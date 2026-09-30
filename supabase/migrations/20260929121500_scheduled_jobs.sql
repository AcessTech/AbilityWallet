-- Ability Wallet — the server-side jobs.
-- All timing logic is server-side: the app renders whatever cards exist.

-- --------------------------------------------------------- banking days ----
-- SSI is paid the 1st, moved to the prior business day on a weekend or federal
-- holiday. SSDI follows the birth-date Wednesday rule, or the 3rd for claims
-- from before May 1997 and for everyone drawing both.

create table federal_holidays (
  on_date date primary key,
  name    text not null
);

-- Fixed-date holidays observed on the nearest weekday, plus the floating ones,
-- generated for the years this app will plausibly run.
create or replace function seed_federal_holidays(p_from int, p_to int)
returns void
language plpgsql as $$
declare
  y int;
  d date;
begin
  for y in p_from..p_to loop
    -- Fixed dates, observed Friday if Saturday and Monday if Sunday.
    foreach d in array array[
      make_date(y, 1, 1), make_date(y, 6, 19), make_date(y, 7, 4),
      make_date(y, 11, 11), make_date(y, 12, 25)
    ] loop
      insert into federal_holidays (on_date, name) values (
        case extract(dow from d)
          when 6 then d - 1
          when 0 then d + 1
          else d end,
        'Federal holiday')
      on conflict do nothing;
    end loop;

    -- Third Monday in January and February; last Monday in May; first Monday
    -- in September; second Monday in October; fourth Thursday in November.
    insert into federal_holidays (on_date, name) values
      (nth_dow_of_month(y, 1, 1, 3),  'Martin Luther King Jr. Day'),
      (nth_dow_of_month(y, 2, 1, 3),  'Washington''s Birthday'),
      (last_dow_of_month(y, 5, 1),    'Memorial Day'),
      (nth_dow_of_month(y, 9, 1, 1),  'Labor Day'),
      (nth_dow_of_month(y, 10, 1, 2), 'Columbus Day'),
      (nth_dow_of_month(y, 11, 4, 4), 'Thanksgiving')
    on conflict do nothing;
  end loop;
end;
$$;

create or replace function nth_dow_of_month(p_year int, p_month int, p_dow int, p_nth int)
returns date language sql immutable as $$
  select (make_date(p_year, p_month, 1)
          + ((p_dow - extract(dow from make_date(p_year, p_month, 1))::int + 7) % 7)
          + (p_nth - 1) * 7)::date;
$$;

create or replace function last_dow_of_month(p_year int, p_month int, p_dow int)
returns date language sql immutable as $$
  select max(d)::date from generate_series(
           make_date(p_year, p_month, 1),
           (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date,
           interval '1 day') d
   where extract(dow from d)::int = p_dow;
$$;

create or replace function is_banking_day(p_date date)
returns boolean language sql stable as $$
  select extract(dow from p_date)::int between 1 and 5
     and not exists (select 1 from federal_holidays where on_date = p_date);
$$;

create or replace function prior_banking_day(p_date date)
returns date language plpgsql stable as $$
declare d date := p_date;
begin
  while not is_banking_day(d) loop d := d - 1; end loop;
  return d;
end;
$$;

select seed_federal_holidays(2025, 2035);

-- ------------------------------------------------- recurring detection -----
-- Flag streams after two cycles. QDE tier 2.

create or replace function detect_recurring(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  -- Deposits: same payer, similar amount, at least two occurrences.
  for r in
    select t.merchant, t.merchant_key,
           count(*) as cycles,
           avg(t.amount) as avg_amount,
           max(t.occurred_at)::date as last_on
      from transactions t
     where t.member_id = p_member
       and t.status = 'posted'
       and t.amount > 0
       and t.rail <> 'internal'
     group by t.merchant, t.merchant_key
    having count(*) >= 2
       and (max(t.amount) - min(t.amount)) <= greatest(avg(t.amount) * 0.15, 5)
  loop
    insert into income_schedules (member_id, source, merchant_key, kind, amount,
                                  prediction_confidence, cycles_seen, last_seen_on, rule)
    values (
      p_member, r.merchant, r.merchant_key,
      case
        when r.merchant_key ~ '(social-security|ssa-treas|ssi)' then 'ssi'
        else 'other'
      end,
      round(r.avg_amount, 2),
      case when r.cycles >= 3 then 'HIGH' else 'MEDIUM' end,
      r.cycles, r.last_on,
      jsonb_build_object('cadence', 'monthly')
    )
    on conflict (member_id, merchant_key) do update
      set amount = excluded.amount,
          cycles_seen = excluded.cycles_seen,
          last_seen_on = excluded.last_seen_on,
          prediction_confidence = excluded.prediction_confidence;
  end loop;

  -- A federal deposit descriptor is a HIGH-confidence SSI match, so there is
  -- no question to ask about it.
  update income_schedules set kind = 'ssi', prediction_confidence = 'HIGH'
   where member_id = p_member and merchant_key ~ '(social-security|ssa-treas)';

  if exists (select 1 from income_schedules where member_id = p_member and kind = 'ssi') then
    insert into member_facts (member_id, key, value, source, fact_confidence)
    values (p_member, 'receives_ssi', 'true', 'deposit_match', 'HIGH')
    on conflict (member_id, key) do update set value = 'true', fact_confidence = 'HIGH';
  end if;

  -- Rent-shaped debits license the Housing questions:
  -- same payee, similar amount, monthly, in the first days, a big debit.
  for r in
    select t.merchant, t.merchant_key, count(*) as cycles
      from transactions t
     where t.member_id = p_member
       and t.status = 'posted'
       and t.amount < 0
       and (extract(day from t.occurred_at) <= 5 or t.mcc = '6513')
       and abs(t.amount) >= 300
     group by t.merchant, t.merchant_key
    having count(*) >= 2
  loop
    insert into member_facts (member_id, key, value, source, fact_confidence)
    values (p_member, 'pays_housing', 'true', 'recurring_stream', 'HIGH')
    on conflict (member_id, key) do update
      set value = 'true', fact_confidence = 'HIGH', source = 'recurring_stream';
    insert into member_facts (member_id, key, value, source, fact_confidence)
    values (p_member, 'housing_payee', r.merchant, 'recurring_stream', 'HIGH')
    on conflict (member_id, key) do update set value = excluded.value;
  end loop;
end;
$$;

-- ------------------------------------------------- income prediction -------
-- "Coming in" lists only HIGH/MEDIUM predictions in the next
-- 35 days, as dated predictions.

create or replace function predict_income(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s income_schedules;
  d date;
  v_month date;
  v_concurrent boolean;
  v_dob date;
begin
  delete from predicted_deposits where member_id = p_member and expected_on < current_date;

  select dob into v_dob from profiles where id = p_member;
  v_concurrent := exists (select 1 from income_schedules where member_id = p_member and kind = 'ssi')
              and exists (select 1 from income_schedules where member_id = p_member and kind = 'ssdi');

  for s in select * from income_schedules where member_id = p_member loop
    for v_month in
      select generate_series(date_trunc('month', current_date),
                             date_trunc('month', current_date) + interval '2 months',
                             interval '1 month')::date
    loop
      d := null;

      if s.kind = 'ssi' then
        -- Paid the 1st; prior business day on a weekend or holiday.
        d := prior_banking_day(v_month);

      elsif s.kind = 'ssdi' then
        if v_concurrent or coalesce((s.rule ->> 'pre_may_1997')::boolean, false) then
          d := prior_banking_day(v_month + 2);          -- the 3rd
        elsif v_dob is not null then
          d := nth_dow_of_month(
                 extract(year from v_month)::int,
                 extract(month from v_month)::int,
                 3,                                      -- Wednesday
                 case
                   when extract(day from v_dob)::int between 1 and 10  then 2
                   when extract(day from v_dob)::int between 11 and 20 then 3
                   else 4
                 end);
        end if;

      elsif s.kind = 'wages' and s.cycles_seen >= 2 and s.last_seen_on is not null then
        -- Learned cadence: keep stepping from the last observed deposit.
        d := s.last_seen_on;
        while d < current_date loop
          d := d + coalesce((s.rule ->> 'days')::int, 14);
        end loop;
      end if;

      if d is not null and d >= current_date and d <= current_date + 35 then
        insert into predicted_deposits (member_id, schedule_id, source, amount,
                                        expected_on, prediction_confidence)
        values (p_member, s.id, s.source, s.amount, d, s.prediction_confidence)
        on conflict (schedule_id, expected_on) do update
          set amount = excluded.amount,
              prediction_confidence = excluded.prediction_confidence;
      end if;
    end loop;
  end loop;
end;
$$;

-- --------------------------------------------------------- SSI sentinel ----
-- Nothing before day 25. Day 25, then two days before the
-- last day, then the morning of the last day. Three touches maximum.

create or replace function run_ssi_sweep(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_limit numeric := config_num('ssi_resource_limit');
  v_buffer numeric := config_num('ssi_buffer');
  v_projected numeric;
  v_suggested numeric;
  v_last_day date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
  v_day int := extract(day from current_date)::int;
  v_touch boolean;
  v_auto boolean;
  v_touches int;
begin
  -- The Member must actually be on SSI for this question to have a premise.
  if not exists (select 1 from member_facts
                  where member_id = p_member and key = 'receives_ssi' and value = 'true') then
    return;
  end if;

  v_projected := projected_first_moment_next_month(p_member);
  if v_projected < v_limit - v_buffer then
    -- Resolves silently when the projection drops back below the line.
    update home_cards set state = 'dismissed'
     where member_id = p_member and cls = 'SENTINEL' and kind = 'SSI_SWEEP'
       and state in ('queued','shown');
    return;
  end if;

  v_touch := v_day >= 25
         and (v_day = 25
           or current_date = v_last_day - 2
           or current_date = v_last_day);
  if not v_touch then return; end if;

  select count(*) into v_touches from home_cards
   where member_id = p_member and cls = 'SENTINEL' and kind = 'SSI_SWEEP'
     and created_at >= date_trunc('month', current_date);
  if v_touches >= 3 then return; end if;

  v_suggested := ceil((v_projected - (v_limit - v_buffer)) / 10) * 10;
  select auto_move_enabled into v_auto from profiles where id = p_member;

  if v_auto then
    -- With the standing rule on, day 25 is a heads-up, not a question.
    insert into home_cards (member_id, cls, kind, headline, body, state)
    values (p_member, 'NOTICE', 'AUTO_MOVE_PLANNED',
            'A move to your ABLE savings is planned',
            'About ' || to_char(v_suggested, 'FM$999,999') || ' on '
              || to_char(v_last_day, 'FMMonth FMDD') || '.',
            'queued');
  else
    insert into home_cards (member_id, cls, kind, headline, body, suggested_amount, state)
    values (p_member, 'SENTINEL', 'SSI_SWEEP',
            'Your checking is getting close to $2,000',
            'Money left in checking on ' || to_char(v_last_day, 'FMMonth FMDD')
              || ' would pass the $2,000 limit. Moving some to your ABLE savings keeps it safe.',
            v_suggested, 'queued');

    perform notify_member(p_member, 'B1c', 'An idea for your savings',
      'Your checking is getting close to $2,000.', '{}'::jsonb);
  end if;

  perform raise_alert(p_member, 'A8',
    'Checking is on track to pass $2,000 by ' || to_char(v_last_day, 'FMMonth FMDD'),
    jsonb_build_object('projected', v_projected, 'suggested', v_suggested));
end;
$$;

-- On the last day of the month, anything above the safe
-- line moves to ABLE, if the rule is on.
create or replace function run_auto_move()
returns void
language plpgsql security definer set search_path = public as $$
declare
  p record;
  v_safe numeric := config_num('ssi_safe_line');
  v_amount numeric;
  v_checking uuid;
  v_able uuid;
begin
  if current_date <> (date_trunc('month', current_date) + interval '1 month - 1 day')::date then
    return;
  end if;

  for p in select id from profiles where role = 'member' and auto_move_enabled loop
    v_checking := account_of(p.id, 'checking');
    v_able     := account_of(p.id, 'able');
    if v_checking is null or v_able is null then continue; end if;

    select greatest(balance - v_safe, 0) into v_amount from accounts where id = v_checking;
    if v_amount < 10 then continue; end if;
    v_amount := floor(v_amount / 10) * 10;

    perform move_money(p.id, v_checking, v_able, v_amount, 'Savings & goals', null);
    perform raise_alert(p.id, 'A9',
      'Automatic move: ' || to_char(v_amount, 'FM$999,999.00') || ' to ABLE savings',
      jsonb_build_object('amount', v_amount, 'automatic', true));
    perform notify_member(p.id, 'B7', 'Something changed',
      'Money moved to your ABLE savings.', jsonb_build_object('amount', v_amount));
  end loop;
end;
$$;

-- Housing timer. Daily; the card raises at five days left, the alert at two.
create or replace function run_housing_timer(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_last_day date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
  v_days_left int := v_last_day - current_date;
  c home_cards;
begin
  select * into c from home_cards
   where member_id = p_member and cls = 'SENTINEL' and kind = 'HOUSING_TIMER'
     and state in ('queued','shown') limit 1;
  if c.id is null then return; end if;

  -- The month turned over: the timer stops.
  if c.created_at < date_trunc('month', current_date) then
    update home_cards set state = 'expired' where id = c.id;
    return;
  end if;

  if v_days_left <= 2 then
    perform raise_alert(p_member, 'A16',
      (select first_name from profiles where id = p_member)
        || '''s rent money from ABLE needs to go out by ' || to_char(v_last_day, 'FMMonth FMDD'),
      jsonb_build_object('card_id', c.id));
  end if;
end;
$$;

-- ------------------------------------------------ transaction questions ----
-- QDE offers and income tags, under the one-question-a-day cap.

create or replace function generate_qde_offers(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  t record;
  v_min numeric := config_num('qde_min_ask');
  v_able_balance numeric;
  v_pays_housing boolean;
  v_phrase text;
begin
  if transaction_questions_today(p_member) >= config_int('daily_question_cap') then
    return;
  end if;

  select coalesce(balance, 0) into v_able_balance
    from accounts where member_id = p_member and kind = 'able';
  if v_able_balance is null or v_able_balance <= 0 then return; end if;

  v_pays_housing := exists (select 1 from member_facts
    where member_id = p_member and key = 'pays_housing' and value = 'true'
      and (suppressed_until is null or suppressed_until < current_date));

  for t in
    select tx.*, mc.candidate_qde, mc.auto_assign
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

create or replace function generate_income_tags(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare s income_schedules;
begin
  if transaction_questions_today(p_member) >= config_int('daily_question_cap') then
    return;
  end if;

  for s in
    select * from income_schedules
     where member_id = p_member
       and kind = 'other'
       and cycles_seen >= 2
       and not exists (select 1 from home_cards hc
                        where hc.member_id = p_member and hc.cls = 'INCOME_TAG'
                          and hc.payload ->> 'merchant_key' = income_schedules.merchant_key)
     limit 1
  loop
    insert into home_cards (member_id, cls, headline, body, state, expires_at, payload)
    values (
      p_member, 'INCOME_TAG',
      s.source || ' — ' || to_char(s.amount, 'FM$999,999.00'),
      'Is this pay from work?', 'queued',
      now() + make_interval(days => config_int('income_tag_expiry_days')),
      jsonb_build_object('merchant_key', s.merchant_key, 'schedule_id', s.id));

    perform notify_member(p_member, 'B1e', 'A question about money that arrived',
      'A new repeating deposit needs a tag.', '{}'::jsonb);
  end loop;
end;
$$;

-- An ABLE-side debit that could not be categorised is mandatory and blocking.
create or replace function generate_able_answers(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare t record;
begin
  for t in
    select tx.* from transactions tx
      join accounts a on a.id = tx.account_id and a.kind = 'able'
     where tx.member_id = p_member
       and tx.status = 'posted'
       and tx.amount < 0
       and tx.rail <> 'internal'
       and tx.qde_category is null
       and coalesce(tx.qde_confidence, 'LOW') <> 'HIGH'
       and not exists (select 1 from home_cards hc
                        where hc.txn_id = tx.id and hc.cls = 'ABLE_ANSWER')
  loop
    update transactions set needs_answer = true where id = t.id;

    insert into home_cards (member_id, cls, headline, body, txn_id, state, payload)
    values (
      p_member, 'ABLE_ANSWER',
      t.merchant || ' — ' || to_char(abs(t.amount), 'FM$999,999.00'),
      'This came from your ABLE savings. What was it for?',
      t.id, 'queued', '{}'::jsonb);

    perform notify_member(p_member, 'B1d', 'A question about a purchase',
      'An ABLE purchase needs a category.', jsonb_build_object('transaction_id', t.id));
  end loop;
end;
$$;

-- --------------------------------------------------------- the sweep -------

create or replace function generate_home_cards(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform detect_recurring(p_member);
  perform predict_income(p_member);
  perform generate_able_answers(p_member);
  perform run_ssi_sweep(p_member);
  perform run_housing_timer(p_member);
  perform generate_qde_offers(p_member);
  perform generate_income_tags(p_member);
end;
$$;

create or replace function nightly_sweep()
returns void
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  for p in select id from profiles where role = 'member' loop
    perform generate_home_cards(p.id);
  end loop;

  perform expire_cards();
  perform expire_consents();
  perform run_auto_move();
end;
$$;

create or replace function expire_cards()
returns void
language plpgsql security definer set search_path = public as $$
begin
  update home_cards set state = 'expired'
   where state in ('queued','shown')
     and expires_at is not null
     and expires_at < now()
     -- ABLE category questions never expire (compliance).
     and cls <> 'ABLE_ANSWER';
end;
$$;

create or replace function expire_consents()
returns void
language plpgsql security definer set search_path = public as $$
begin
  update consents set status = 'expired', answered_at = now()
   where status = 'pending' and expires_at < now();

  update home_cards set state = 'expired'
   where cls = 'CONSENT' and state in ('queued','shown')
     and proposal_id in (select id from consents where status = 'expired');

  -- A pending tightening that nobody answered leaves the old value live.
  update budget_lines set pending_change = null
   where pending_change is not null
     and (pending_change ->> 'proposed_at')::timestamptz
         < now() - make_interval(days => config_int('consent_expiry_days'));
end;
$$;

-- ---------------------------------------------------------------- cron -----

select cron.schedule('ability-wallet-nightly', '15 7 * * *', $$select nightly_sweep()$$);
