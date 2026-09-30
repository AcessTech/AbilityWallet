-- The CASE expressions in detect_recurring produce text; the columns are
-- enums, so they need explicit casts.

create or replace function detect_recurring(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
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
      (case
         when r.merchant_key ~ '(social-security|ssa-treas|ssi)' then 'ssi'
         else 'other'
       end)::income_kind,
      round(r.avg_amount, 2),
      (case when r.cycles >= 3 then 'HIGH' else 'MEDIUM' end)::confidence,
      r.cycles, r.last_on,
      jsonb_build_object('cadence', 'monthly')
    )
    on conflict (member_id, merchant_key) do update
      set amount = excluded.amount,
          cycles_seen = excluded.cycles_seen,
          last_seen_on = excluded.last_seen_on,
          prediction_confidence = excluded.prediction_confidence;
  end loop;

  update income_schedules set kind = 'ssi', prediction_confidence = 'HIGH'
   where member_id = p_member and merchant_key ~ '(social-security|ssa-treas)';

  if exists (select 1 from income_schedules where member_id = p_member and kind = 'ssi') then
    insert into member_facts (member_id, key, value, source, fact_confidence)
    values (p_member, 'receives_ssi', 'true', 'deposit_match', 'HIGH')
    on conflict (member_id, key) do update set value = 'true', fact_confidence = 'HIGH';
  end if;

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
