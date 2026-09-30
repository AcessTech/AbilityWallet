-- Ability Wallet — queue the invite email.
--
-- No mail service is connected to this project yet. Appendix B ground rule 7
-- already covers the Text channel this way: log it, don't send it. The same
-- applies to email until Eric connects a provider — `outbound_messages` is the
-- record, and the Navigator can also read the link off her own screen.

drop function if exists create_member_invite(text, text, text, date, jsonb, jsonb, int);

create or replace function create_member_invite(
  p_first_name text,
  p_last_name  text,
  p_email      text,
  p_dob        date,
  p_address    jsonb,
  p_ship       jsonb,
  p_level      int,
  p_send       boolean default true
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nav uuid := auth.uid();
  v_nav_name text;
  v_token text := encode(gen_random_bytes(16), 'hex');
  v_row member_navigator;
  v_days int := config_int('invite_expiry_days');
  v_link text;
begin
  if v_nav is null then
    raise exception 'not signed in';
  end if;

  select first_name into v_nav_name from profiles where id = v_nav;

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
    null, v_nav, p_level, 'invited',
    lower(p_email),
    v_token,
    case when p_send then now() else null end,
    now() + make_interval(days => v_days),
    jsonb_build_object(
      'first_name', p_first_name,
      'last_name',  p_last_name,
      'dob',        p_dob,
      'address',    p_address,
      'ship',       p_ship
    )
  )
  returning * into v_row;

  v_link := 'abilitywallet://invite/' || v_token;

  if p_send then
    insert into outbound_messages (profile_id, channel, to_address, subject, body, sent, reason_not_sent)
    values (
      v_nav, 'email', lower(p_email),
      coalesce(v_nav_name, 'Someone') || ' set up an Ability Wallet card for you',
      coalesce(v_nav_name, 'Someone') || ' set up an Ability Wallet card for you. '
        || 'Tap here to set it up: ' || v_link,
      false,
      'No mail service is connected to this project yet.'
    );
  end if;

  return jsonb_build_object(
    'link_id', v_row.id,
    'token', v_token,
    'link', v_link,
    'sent', p_send,
    'expires_at', v_row.invite_expires_at,
    'first_name', p_first_name
  );
end;
$$;

-- Re-sending an invite that was created but never sent, or that expired.
create or replace function resend_member_invite(p_link_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v member_navigator;
  v_nav_name text;
  v_token text := encode(gen_random_bytes(16), 'hex');
  v_link text;
begin
  select * into v from member_navigator
   where id = p_link_id and navigator_id = auth.uid() for update;
  if v.id is null then
    raise exception 'no such invite';
  end if;

  select first_name into v_nav_name from profiles where id = v.navigator_id;
  v_link := 'abilitywallet://invite/' || v_token;

  update member_navigator
     set invite_token = v_token,
         invite_sent_at = now(),
         invite_expires_at = now() + make_interval(days => config_int('invite_expiry_days')),
         invite_dob_attempts = 0,
         status = 'invited'
   where id = v.id;

  insert into outbound_messages (profile_id, channel, to_address, subject, body, sent, reason_not_sent)
  values (
    v.navigator_id, 'email', v.invite_email,
    coalesce(v_nav_name, 'Someone') || ' set up an Ability Wallet card for you',
    coalesce(v_nav_name, 'Someone') || ' set up an Ability Wallet card for you. '
      || 'Tap here to set it up: ' || v_link,
    false,
    'No mail service is connected to this project yet.'
  );

  return jsonb_build_object('token', v_token, 'link', v_link);
end;
$$;
