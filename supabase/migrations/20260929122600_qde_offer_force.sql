-- The one-question-a-day cap is correct, but it means the test-account loader
-- cannot show a QDE offer on the same day it creates everything else. Give the
-- generator a force flag, used only by the loader.

drop function if exists generate_qde_offers(uuid);

create or replace function generate_qde_offers(p_member uuid, p_force boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare
  t record;
  v_min numeric := config_num('qde_min_ask');
  v_able_balance numeric;
  v_pays_housing boolean;
  v_phrase text;
begin
  if not p_force and transaction_questions_today(p_member) >= config_int('daily_question_cap') then
    return;
  end if;

  select coalesce(balance, 0) into v_able_balance
    from accounts where member_id = p_member and kind = 'able';
  if v_able_balance is null or v_able_balance <= 0 then return; end if;

  v_pays_housing := exists (select 1 from member_facts
    where member_id = p_member and key = 'pays_housing' and value = 'true'
      and (suppressed_until is null or suppressed_until < current_date));

  for t in
    select tx.*, mc.candidate_qde
      from transactions tx
      join mcc_categories mc on mc.mcc = tx.mcc
      join accounts a on a.id = tx.account_id and a.kind = 'checking'
     where tx.member_id = p_member
       and tx.status = 'posted'
       and tx.amount < 0
       and tx.rail in ('card','ach')
       and mc.candidate_qde is not null
       and not mc.auto_assign
       and abs(tx.amount) >= v_min
       and abs(tx.amount) <= v_able_balance
       and tx.occurred_at > now() - make_interval(days => config_int('qde_offer_expiry_days'))
       and not exists (select 1 from merchant_rules mr
                        where mr.member_id = p_member and mr.merchant_key = tx.merchant_key)
       and not exists (select 1 from home_cards hc
                        where hc.txn_id = tx.id and hc.cls = 'QDE_OFFER')
     order by tx.occurred_at
     limit 1
  loop
    -- Housing offers need the licensing fact. A wrong-premise question is
    -- worse than a missed saving.
    if t.candidate_qde like 'Housing%' and not v_pays_housing then
      continue;
    end if;

    v_phrase := case
      when t.candidate_qde like 'Housing%'        then 'If this was for your apartment, it can come out of your ABLE savings instead.'
      when t.candidate_qde like 'Health%'         then 'If this was for your health, it can come out of your ABLE savings instead.'
      when t.candidate_qde like 'Transportation%' then 'If this was for getting around, it can come out of your ABLE savings instead.'
      when t.candidate_qde like 'Education%'      then 'If this was for school, it can come out of your ABLE savings instead.'
      else 'This one can come out of your ABLE savings instead.'
    end;

    insert into home_cards (member_id, cls, headline, body, txn_id, state, expires_at, payload)
    values (
      p_member, 'QDE_OFFER',
      t.merchant || ' — ' || to_char(abs(t.amount), 'FM$999,999.00'),
      v_phrase, t.id, 'queued',
      t.occurred_at + make_interval(days => config_int('qde_offer_expiry_days')),
      jsonb_build_object('qde', t.candidate_qde));

    perform notify_member(p_member, 'B1b', 'A question about a purchase',
      'A purchase may qualify for ABLE.', jsonb_build_object('transaction_id', t.id));
  end loop;
end;
$$;
