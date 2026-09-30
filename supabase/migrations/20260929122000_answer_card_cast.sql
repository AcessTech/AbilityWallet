-- CASE produces text; state and status are enums, so the assignments need
-- explicit casts.

create or replace function answer_home_card(
  p_card uuid,
  p_yes  boolean,
  p_payload jsonb default '{}'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v home_cards;
  v_result jsonb := '{}'::jsonb;
begin
  select * into v from home_cards where id = p_card for update;
  if v.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Idempotent: double-tapping Yes must not act twice.
  if v.state in ('answered_yes','answered_no','dismissed','expired','withdrawn') then
    return jsonb_build_object('ok', true, 'already', true, 'state', v.state);
  end if;

  if v.member_id <> auth.uid() then
    raise exception 'only the account owner answers their own questions';
  end if;

  update home_cards
     set state = (case when p_yes then 'answered_yes' else 'answered_no' end)::card_state,
         answered_at = now()
   where id = p_card;

  case v.cls
    when 'QDE_OFFER'   then v_result := answer_qde_offer(v, p_yes, p_payload);
    when 'ABLE_ANSWER' then v_result := answer_able_category(v, p_yes, p_payload);
    when 'CONSENT'     then v_result := answer_consent(v, p_yes);
    when 'SENTINEL'    then v_result := answer_sentinel(v, p_yes);
    when 'INCOME_TAG'  then v_result := answer_income_tag(v, p_yes, p_payload);
    else v_result := '{}'::jsonb;
  end case;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail, payload)
  values (v.member_id, auth.uid(), 'member',
          case when p_yes then 'card_answered_yes' else 'card_answered_no' end,
          v.headline,
          jsonb_build_object('card_id', v.id, 'cls', v.cls, 'kind', v.kind));

  return jsonb_build_object('ok', true, 'cls', v.cls, 'kind', v.kind) || v_result;
end;
$$;

create or replace function answer_consent(v home_cards, p_yes boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c consents;
begin
  select * into c from consents where id = v.proposal_id for update;
  if c.id is null then return '{}'::jsonb; end if;

  update consents
     set status = (case when p_yes then 'approved' else 'declined' end)::consent_status,
         answered_at = now()
   where id = c.id;

  if p_yes then
    perform apply_consent(c.id);
  end if;

  perform raise_alert(c.member_id, 'A13', null,
                      jsonb_build_object('consent_id', c.id, 'kind', c.kind));

  return jsonb_build_object('consent', c.kind, 'approved', p_yes);
end;
$$;

create or replace function answer_consent_as_navigator(p_consent uuid, p_yes boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare c consents;
begin
  select * into c from consents where id = p_consent for update;
  if c.id is null or c.status <> 'pending' then
    return jsonb_build_object('ok', false);
  end if;
  if not auth_is_navigator_of(c.member_id) then
    raise exception 'not this member''s Navigator';
  end if;

  update consents
     set status = (case when p_yes then 'approved' else 'declined' end)::consent_status,
         answered_at = now()
   where id = c.id;

  if p_yes then perform apply_consent(c.id); end if;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail, payload)
  values (c.member_id, auth.uid(), 'navigator',
          case when p_yes then 'consent_approved' else 'consent_declined' end,
          c.kind::text, jsonb_build_object('consent_id', c.id));

  return jsonb_build_object('ok', true, 'approved', p_yes);
end;
$$;

create or replace function set_card_paused(p_member uuid, p_paused boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare v_level int;
begin
  select level into v_level from member_navigator
   where member_id = p_member and navigator_id = auth.uid() and status = 'active';
  if coalesce(v_level, 0) < 4 then
    raise exception 'pausing the card is not available at this level';
  end if;

  update member_cards
     set status = (case when p_paused then 'paused' else 'active' end)::card_status,
         paused_by = case when p_paused then auth.uid() else null end,
         paused_at = case when p_paused then now() else null end
   where member_id = p_member;

  if p_paused then
    insert into home_cards (member_id, cls, kind, headline, body, state, payload)
    values (p_member, 'NOTICE', 'CARD_PAUSED',
            (select first_name from profiles where id = auth.uid()) || ' paused your card',
            'Call them if you need it back on.', 'queued',
            jsonb_build_object('by', auth.uid()));
    perform notify_member(p_member, 'B7', 'Something changed',
      'Your card is paused.', '{}'::jsonb);
  end if;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail)
  values (p_member, auth.uid(), 'navigator',
          case when p_paused then 'card_paused' else 'card_unpaused' end, '');
end;
$$;
