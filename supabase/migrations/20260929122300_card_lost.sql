-- Reporting the card lost or stolen. A5 always sends and cannot be turned off:
-- a missing card is time-critical (Appendix B).

create or replace function report_card_lost(p_member uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_new text;
begin
  if auth.uid() <> p_member and not auth_is_navigator_of(p_member) then
    raise exception 'not allowed';
  end if;

  update member_cards set status = 'lost' where member_id = p_member and status <> 'lost';

  perform raise_alert(p_member, 'A5',
    (select first_name from profiles where id = p_member)
      || ' reported the card lost or stolen. A new card is on the way.',
    '{}'::jsonb);

  perform notify_member(p_member, 'B5', 'Your card is on the way',
    'Your new card has been ordered.', '{}'::jsonb);

  -- The replacement is issued straight away in the simulated core.
  update member_cards set status = 'replaced' where member_id = p_member and status = 'lost';
  perform issue_member_card(p_member);

  select last4 into v_new from member_cards
   where member_id = p_member order by created_at desc limit 1;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail)
  values (p_member, auth.uid(),
          case when auth.uid() = p_member then 'member' else 'navigator' end,
          'card_reported_lost', 'A replacement card was ordered');

  return jsonb_build_object('new_last4', v_new);
end;
$$;
