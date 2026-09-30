-- Ability Wallet — the "Me" path: someone opening an account for himself,
-- with no Navigator. Onboarding frames 5, 15, then address and card.

create or replace function finish_self_signup(
  p_dob     date,
  p_address jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'not signed in'; end if;

  update profiles set
    dob           = p_dob,
    address_line1 = p_address ->> 'line1',
    address_line2 = p_address ->> 'line2',
    city          = p_address ->> 'city',
    state         = p_address ->> 'state',
    postal_code   = p_address ->> 'postal_code',
    onboarding_done = true,
    updated_at    = now()
  where id = v_me and role = 'member';

  perform open_member_accounts(v_me);
  perform issue_member_card(v_me);

  insert into activity_log (member_id, actor_id, actor_kind, event, detail)
  values (v_me, v_me, 'member', 'account_opened', 'Account opened');

  return (select jsonb_build_object('last4', last4)
            from member_cards where member_id = v_me
           order by created_at desc limit 1);
end;
$$;

-- The Navigator finishing setup without sending an invite yet still needs her
-- own account marked done.
create or replace function finish_navigator_signup()
returns void
language plpgsql security definer set search_path = public as $$
begin
  update profiles set onboarding_done = true, updated_at = now()
   where id = auth.uid() and role = 'navigator';
end;
$$;
