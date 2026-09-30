-- Ability Wallet — the Navigator's email invite to the Member.
-- Decided Sep 29: the invite goes by EMAIL. Nothing sends until the Navigator
-- taps "Send the invite" (onboarding frame 11); the account activates when the
-- Member accepts.

alter table member_navigator
  add column if not exists invite_payload jsonb not null default '{}';

-- Create (or replace) the pending invite for a member the Navigator is setting
-- up. Everything she typed rides in the payload until the Member accepts.
create or replace function create_member_invite(
  p_first_name text,
  p_last_name  text,
  p_email      text,
  p_dob        date,
  p_address    jsonb,
  p_ship       jsonb,
  p_level      int
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nav uuid := auth.uid();
  v_token text := encode(gen_random_bytes(16), 'hex');
  v_row member_navigator;
  v_days int := config_int('invite_expiry_days');
begin
  if v_nav is null then
    raise exception 'not signed in';
  end if;

  -- One pending invite per email per navigator; re-sending replaces it.
  update member_navigator
     set status = 'ended', ended_at = now()
   where navigator_id = v_nav
     and lower(invite_email) = lower(p_email)
     and status = 'invited';

  insert into member_navigator (
    member_id, navigator_id, level, status,
    invite_email, invite_token, invite_sent_at, invite_expires_at, invite_payload
  ) values (
    gen_random_uuid(),   -- placeholder id, replaced when the Member signs up
    v_nav, p_level, 'invited',
    lower(p_email), v_token, now(), now() + make_interval(days => v_days),
    jsonb_build_object(
      'first_name', p_first_name,
      'last_name',  p_last_name,
      'dob',        p_dob,
      'address',    p_address,
      'ship',       p_ship
    )
  )
  returning * into v_row;

  return jsonb_build_object(
    'link_id', v_row.id,
    'token', v_token,
    'expires_at', v_row.invite_expires_at,
    'first_name', p_first_name
  );
end;
$$;

-- member_id is a placeholder until acceptance, so drop the FK requirement on
-- invited rows by deferring: instead, keep the FK but point invited rows at a
-- row that does not exist. Postgres will not allow that, so invited rows carry
-- a null member_id instead.
alter table member_navigator alter column member_id drop not null;
alter table member_navigator
  add constraint member_navigator_member_required_when_active
  check (status <> 'active' or member_id is not null);

-- Undo the placeholder id written above: invited rows start with no member.
create or replace function create_member_invite(
  p_first_name text,
  p_last_name  text,
  p_email      text,
  p_dob        date,
  p_address    jsonb,
  p_ship       jsonb,
  p_level      int
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nav uuid := auth.uid();
  v_token text := encode(gen_random_bytes(16), 'hex');
  v_row member_navigator;
  v_days int := config_int('invite_expiry_days');
begin
  if v_nav is null then
    raise exception 'not signed in';
  end if;

  update member_navigator
     set status = 'ended', ended_at = now()
   where navigator_id = v_nav
     and lower(invite_email) = lower(p_email)
     and status = 'invited';

  insert into member_navigator (
    member_id, navigator_id, level, status,
    invite_email, invite_token, invite_sent_at, invite_expires_at, invite_payload
  ) values (
    null, v_nav, p_level, 'invited',
    lower(p_email), v_token, now(), now() + make_interval(days => v_days),
    jsonb_build_object(
      'first_name', p_first_name,
      'last_name',  p_last_name,
      'dob',        p_dob,
      'address',    p_address,
      'ship',       p_ship
    )
  )
  returning * into v_row;

  return jsonb_build_object(
    'link_id', v_row.id,
    'token', v_token,
    'expires_at', v_row.invite_expires_at,
    'first_name', p_first_name
  );
end;
$$;

-- What the invite link shows before anyone signs in: whose invite it is and
-- whether it is still good. No personal detail beyond first names.
create or replace function peek_invite(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v member_navigator;
  v_nav profiles;
begin
  select * into v from member_navigator where invite_token = p_token;
  if v.id is null then
    return jsonb_build_object('state', 'not_found');
  end if;
  if v.status = 'active' then
    return jsonb_build_object('state', 'already_used');
  end if;
  if v.status = 'locked' then
    return jsonb_build_object('state', 'locked');
  end if;
  if v.invite_expires_at < now() or v.status = 'expired' then
    return jsonb_build_object('state', 'expired');
  end if;

  select * into v_nav from profiles where id = v.navigator_id;
  return jsonb_build_object(
    'state', 'ok',
    'navigator_first_name', v_nav.first_name,
    'member_first_name', v.invite_payload ->> 'first_name',
    'member_last_name', v.invite_payload ->> 'last_name',
    'email', v.invite_email
  );
end;
$$;

-- The Member confirms his date of birth against what the Navigator entered.
-- Two misses lock the invite and the Navigator is told (A19).
create or replace function verify_invite_dob(p_token text, p_dob date)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v member_navigator;
begin
  select * into v from member_navigator where invite_token = p_token for update;
  if v.id is null or v.status <> 'invited' then
    return jsonb_build_object('ok', false, 'state', 'not_found');
  end if;

  if (v.invite_payload ->> 'dob')::date = p_dob then
    return jsonb_build_object('ok', true);
  end if;

  update member_navigator
     set invite_dob_attempts = invite_dob_attempts + 1,
         status = case when invite_dob_attempts + 1 >= 2 then 'locked' else status end
   where id = v.id
  returning * into v;

  if v.status = 'locked' then
    insert into alerts (navigator_id, member_id, code, grp, title, payload)
    values (v.navigator_id, v.navigator_id, 'A19', 'setup',
            'The invite for ' || coalesce(v.invite_payload ->> 'first_name', 'someone')
              || ' couldn''t be verified. Send a new one when you''re ready.',
            jsonb_build_object('link_id', v.id));
    return jsonb_build_object('ok', false, 'state', 'locked');
  end if;

  return jsonb_build_object('ok', false, 'state', 'mismatch',
                            'attempts_left', 2 - v.invite_dob_attempts);
end;
$$;

-- The Member has signed up; attach him to the invite and open the account.
create or replace function accept_member_invite(p_token text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v member_navigator;
  v_me uuid := auth.uid();
  v_payload jsonb;
begin
  if v_me is null then raise exception 'not signed in'; end if;

  select * into v from member_navigator where invite_token = p_token for update;
  if v.id is null or v.status <> 'invited' then
    return jsonb_build_object('ok', false, 'state', 'not_found');
  end if;
  if v.invite_expires_at < now() then
    update member_navigator set status = 'expired' where id = v.id;
    return jsonb_build_object('ok', false, 'state', 'expired');
  end if;

  v_payload := v.invite_payload;

  update profiles set
    first_name    = coalesce(nullif(v_payload ->> 'first_name', ''), first_name),
    last_name     = coalesce(nullif(v_payload ->> 'last_name', ''), last_name),
    dob           = coalesce((v_payload ->> 'dob')::date, dob),
    address_line1 = coalesce(v_payload #>> '{address,line1}', address_line1),
    address_line2 = coalesce(v_payload #>> '{address,line2}', address_line2),
    city          = coalesce(v_payload #>> '{address,city}', city),
    state         = coalesce(v_payload #>> '{address,state}', state),
    postal_code   = coalesce(v_payload #>> '{address,postal_code}', postal_code),
    onboarding_done = true,
    updated_at    = now()
  where id = v_me;

  update member_navigator
     set member_id = v_me, status = 'active', started_at = now()
   where id = v.id;

  perform open_member_accounts(v_me);
  perform issue_member_card(v_me);

  insert into alerts (navigator_id, member_id, code, grp, title, payload)
  select v.navigator_id, v_me, 'A18', 'setup',
         coalesce(p.first_name, 'They') || ' accepted. The account is open.',
         '{}'::jsonb
    from profiles p where p.id = v_me;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail)
  values (v_me, v_me, 'member', 'invite_accepted', 'Account opened');

  return jsonb_build_object('ok', true);
end;
$$;

-- A card is issued as soon as the account opens (digital issuance).
create or replace function issue_member_card(p_member uuid)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if exists (select 1 from member_cards where member_id = p_member
               and status not in ('lost','stolen','replaced')) then
    return;
  end if;
  insert into member_cards (member_id, last4, expires_on, status)
  values (
    p_member,
    lpad((floor(random() * 10000))::int::text, 4, '0'),
    (current_date + interval '4 years')::date,
    'active'
  );
end;
$$;
