-- The Member asking someone to be his Navigator (prototype `alex/add_nav`).
-- Mirror of the Navigator-side invite: nothing is visible until both agree.

create or replace function invite_navigator(p_first_name text, p_email text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_me uuid := auth.uid();
  v_token text := encode(gen_random_bytes(16), 'hex');
  v_row member_navigator;
  v_name text;
begin
  if v_me is null then raise exception 'not signed in'; end if;

  select first_name into v_name from profiles where id = v_me;

  update member_navigator
     set status = 'ended', ended_at = now()
   where member_id = v_me and lower(invite_email) = lower(p_email) and status = 'invited';

  insert into member_navigator (
    member_id, navigator_id, level, status, is_primary,
    invite_email, invite_token, invite_sent_at, invite_expires_at, invite_payload)
  values (
    v_me, null, 2, 'invited', false,
    lower(p_email), v_token, now(),
    now() + make_interval(days => config_int('invite_expiry_days')),
    jsonb_build_object('first_name', p_first_name, 'invited_by_member', true))
  returning * into v_row;

  insert into outbound_messages (profile_id, channel, to_address, subject, body, sent, reason_not_sent)
  values (v_me, 'email', lower(p_email),
          coalesce(v_name, 'Someone') || ' asked you to help with their Ability Wallet account',
          coalesce(v_name, 'Someone') || ' asked you to help with their money. '
            || 'Tap here to set it up: abilitywallet://join/' || v_token,
          false, 'No mail service is connected to this project yet.');

  return jsonb_build_object('link', 'abilitywallet://join/' || v_token, 'token', v_token);
end;
$$;
