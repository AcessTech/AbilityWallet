-- Ability Wallet — the decision-card engine.
--
-- The engine lives in Postgres, not the app: two phones must never disagree
-- about what is due. Every function here is idempotent.

-- ------------------------------------------------------- the queue --------
-- Highest priority first:
--   1 ABLE_ANSWER · 2 CONSENT · 3 SENTINEL · 4 QDE_OFFER · 5 INCOME_TAG
-- NOTICEs never occupy the slot; they render as a strip above it.

create or replace function next_home_card(p_member uuid)
returns home_cards
language sql stable security definer set search_path = public as $$
  select * from home_cards
   where member_id = p_member
     and cls <> 'NOTICE'
     and state in ('queued','shown')
     and (expires_at is null or expires_at > now())
   order by array_position(
              array['ABLE_ANSWER','CONSENT','SENTINEL','QDE_OFFER','INCOME_TAG']::card_class[],
              cls),
            created_at
   limit 1;
$$;

-- The notice strip. A decline notice shows on the first app-open after the
-- decline regardless of the queue (the dignity rule: he should never learn
-- about a decline from his Navigator first).
create or replace function next_notice(p_member uuid)
returns home_cards
language sql stable security definer set search_path = public as $$
  select * from home_cards
   where member_id = p_member
     and cls = 'NOTICE'
     and state in ('queued','shown')
   order by (kind = 'DECLINE_EXPLAIN') desc, created_at desc
   limit 1;
$$;

-- Mark what the Member is actually looking at, so the log is honest.
create or replace function mark_card_shown(p_card uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v home_cards;
begin
  update home_cards set state = 'shown', shown_at = coalesce(shown_at, now())
   where id = p_card and state = 'queued'
  returning * into v;

  if v.id is not null then
    insert into activity_log (member_id, actor_kind, event, detail, payload)
    values (v.member_id, 'system', 'card_shown', v.headline,
            jsonb_build_object('card_id', v.id, 'cls', v.cls));
  end if;
end;
$$;

-- --------------------------------------------------- daily question cap ----
-- Max one transaction-derived question per day (QDE_OFFER + INCOME_TAG).
-- ABLE_ANSWER, CONSENT, SENTINEL and NOTICE are exempt.

create or replace function transaction_questions_today(p_member uuid)
returns int
language sql stable as $$
  select count(*)::int from home_cards
   where member_id = p_member
     and cls in ('QDE_OFFER','INCOME_TAG')
     and created_at >= date_trunc('day', now());
$$;

-- ---------------------------------------------------------- answering ------

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
     set state = case when p_yes then 'answered_yes' else 'answered_no' end,
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

create or replace function dismiss_notice(p_card uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update home_cards set state = 'dismissed', answered_at = now()
   where id = p_card and cls = 'NOTICE' and member_id = auth.uid();
end;
$$;

-- ------------------------------------------- per-class answer handlers -----

-- QDE offer. Yes reimburses from ABLE and saves a merchant rule;
-- No saves a rule that never asks about this shop again.
create or replace function answer_qde_offer(v home_cards, p_yes boolean, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t transactions;
  v_able uuid;
  v_checking uuid;
  v_qde text;
begin
  select * into t from transactions where id = v.txn_id;
  if t.id is null then return '{}'::jsonb; end if;

  v_qde := coalesce(v.payload ->> 'qde', t.qde_category);

  if not p_yes then
    insert into merchant_rules (member_id, merchant_key, merchant_label, category, ask, source)
    values (v.member_id, t.merchant_key, t.merchant, t.category, false, 'member_answer')
    on conflict (member_id, merchant_key) do update
      set ask = false, category = excluded.category;
    return jsonb_build_object('reimbursed', false);
  end if;

  v_able     := account_of(v.member_id, 'able');
  v_checking := account_of(v.member_id, 'checking');

  if v_able is null or v_checking is null then
    return jsonb_build_object('reimbursed', false, 'reason', 'no_able_account');
  end if;

  if (select balance from accounts where id = v_able) < abs(t.amount) then
    return jsonb_build_object('reimbursed', false, 'reason', 'not_enough_in_able');
  end if;

  perform move_money(v.member_id, v_able, v_checking, abs(t.amount),
                     'Paid back from ABLE savings', auth.uid());

  update transactions
     set qde_category = v_qde, qde_confidence = 'HIGH', needs_answer = false
   where id = t.id;

  insert into merchant_rules (member_id, merchant_key, merchant_label, category, qde,
                              auto_reimburse, ask, source)
  values (v.member_id, t.merchant_key, t.merchant, t.category, v_qde, true, false, 'member_answer')
  on conflict (member_id, merchant_key) do update
    set qde = excluded.qde, auto_reimburse = true, ask = false;

  perform raise_alert(v.member_id, 'A15',
    t.merchant || ' ' || to_char(abs(t.amount), 'FM$999,999.00') || ' paid back from ABLE savings',
    jsonb_build_object('transaction_id', t.id));

  -- Housing money that lands back in checking starts the same-month clock.
  if v_qde like 'Housing%' then
    perform start_housing_timer(v.member_id, abs(t.amount), t.merchant);
  end if;

  return jsonb_build_object('reimbursed', true, 'amount', abs(t.amount));
end;
$$;

-- Mandatory categorisation of an ABLE-side transaction.
create or replace function answer_able_category(v home_cards, p_yes boolean, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t transactions;
  v_qde text;
  v_spine text;
begin
  select * into t from transactions where id = v.txn_id;
  if t.id is null then return '{}'::jsonb; end if;

  if p_yes then
    v_qde   := v.payload ->> 'qde';
    v_spine := v.payload ->> 'spine_id';
  else
    -- The picker's answer rides in the payload.
    v_spine := p_payload ->> 'spine_id';
    select qde into v_qde from spine_categories where id = v_spine;
  end if;

  if v_spine is null then
    -- No category chosen yet: put the card back so it keeps asking. Compliance
    -- says this one never goes away unanswered.
    update home_cards set state = 'queued', answered_at = null where id = v.id;
    return jsonb_build_object('needs_category', true);
  end if;

  update transactions
     set category = v_spine, qde_category = v_qde,
         qde_confidence = 'HIGH', needs_answer = false
   where id = t.id;

  insert into merchant_rules (member_id, merchant_key, merchant_label, category, qde, ask, source)
  values (v.member_id, t.merchant_key, t.merchant, v_spine, v_qde, false, 'member_answer')
  on conflict (member_id, merchant_key) do update
    set category = excluded.category, qde = excluded.qde, ask = false;

  if v_qde like 'Housing%' then
    perform start_housing_timer(v.member_id, abs(t.amount), t.merchant);
  end if;

  return jsonb_build_object('categorised', v_spine, 'wants_receipt', true);
end;
$$;

-- The Navigator proposed something; this is his answer.
create or replace function answer_consent(v home_cards, p_yes boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c consents;
begin
  select * into c from consents where id = v.proposal_id for update;
  if c.id is null then return '{}'::jsonb; end if;

  update consents
     set status = case when p_yes then 'approved' else 'declined' end,
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

-- Benefits protection: the SSI sweep and the housing timer.
create or replace function answer_sentinel(v home_cards, p_yes boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_from uuid;
  v_to uuid;
  v_amount numeric;
begin
  if not p_yes then
    -- "Not now" re-raises while the condition holds; the daily job will bring
    -- it back, so nothing to do here.
    return jsonb_build_object('deferred', true);
  end if;

  if v.kind = 'SSI_SWEEP' then
    v_amount := v.suggested_amount;
    v_from := account_of(v.member_id, 'checking');
    v_to   := account_of(v.member_id, 'able');
    if v_from is null or v_to is null or v_amount is null then
      return jsonb_build_object('moved', false);
    end if;
    perform move_money(v.member_id, v_from, v_to, v_amount, 'Savings & goals', auth.uid());
    perform raise_alert(v.member_id, 'A9',
      to_char(v_amount, 'FM$999,999.00') || ' moved to ABLE savings',
      jsonb_build_object('amount', v_amount));
    return jsonb_build_object('moved', true, 'amount', v_amount);
  end if;

  if v.kind = 'HOUSING_TIMER' then
    v_amount := v.suggested_amount;
    v_from := account_of(v.member_id, 'checking');
    if (select balance from accounts where id = v_from) < v_amount then
      -- He has spent the money in the meantime. Say so rather than marking the
      -- deadline met.
      return jsonb_build_object('sent', false, 'reason', 'not_enough');
    end if;
    perform post_transaction(
      v.member_id, v_from, coalesce(v.payload ->> 'payee', 'Rent'), '6513',
      -v_amount, 'home', 'ach');
    update home_cards set state = 'answered_yes' where id = v.id;
    return jsonb_build_object('sent', true, 'amount', v_amount);
  end if;

  return '{}'::jsonb;
end;
$$;

-- Benefit versus wages.
create or replace function answer_income_tag(v home_cards, p_yes boolean, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_kind income_kind;
begin
  if p_yes then
    v_kind := 'wages';
  else
    v_kind := coalesce((p_payload ->> 'kind')::income_kind, 'other');
  end if;

  update income_schedules
     set kind = v_kind
   where member_id = v.member_id
     and merchant_key = (v.payload ->> 'merchant_key');

  if v_kind = 'wages' then
    insert into member_facts (member_id, key, value, source, fact_confidence)
    values (v.member_id, 'receives_wages', 'true', 'member_answer', 'HIGH')
    on conflict (member_id, key) do update
      set value = 'true', fact_confidence = 'HIGH', source = 'member_answer';
  end if;

  return jsonb_build_object('tagged', v_kind);
end;
$$;
