-- Bug: post_transaction lost every category.
--
-- In plpgsql, SELECT ... INTO sets its targets to NULL when the query returns
-- no rows. The merchant-rule lookup ran unconditionally, so any purchase at a
-- shop with no saved rule — which is most of them — had its category, QDE and
-- confidence wiped straight after the merchant-code table had filled them in.
--
-- Effect: nothing landed on a budget line, so every ring read full; and ABLE
-- purchases that the code table had assigned at HIGH confidence were treated
-- as uncategorised, raising ABLE questions that should never have been asked.
--
-- Fix: only let a saved rule overwrite when a rule actually exists.

create or replace function post_transaction(
  p_member   uuid,
  p_account  uuid,
  p_merchant text,
  p_mcc      text,
  p_amount   numeric,          -- negative for money out
  p_category text default null,
  p_rail     text default 'card',
  p_at       timestamptz default now()
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_key text := lower(regexp_replace(p_merchant, '[^a-zA-Z0-9]+', '-', 'g'));
  v_auth jsonb;
  v_txn uuid;
  v_category text;
  v_qde text;
  v_conf confidence;
  v_rule merchant_rules;
  v_line record;
  v_is_debit boolean := p_amount < 0;
  v_acct accounts;
begin
  v_key := trim(both '-' from v_key);
  select * into v_acct from accounts where id = p_account;

  -- QDE tier 1: assign straight from the merchant code.
  select mc.spine_id, mc.candidate_qde,
         case when mc.auto_assign then 'HIGH' else 'MEDIUM' end::confidence
    into v_category, v_qde, v_conf
    from mcc_categories mc where mc.mcc = p_mcc;

  -- QDE tier 3: a saved answer beats the code table. Ask once, remember
  -- forever — but only overwrite when a rule is actually there.
  select * into v_rule from merchant_rules
   where member_id = p_member and merchant_key = v_key;
  if v_rule.id is not null then
    v_category := v_rule.category;
    v_qde      := coalesce(v_rule.qde, v_qde);
    v_conf     := 'HIGH';
  end if;

  v_category := coalesce(p_category, v_category);
  if v_conf is null then v_conf := 'LOW'; end if;
  -- A category passed in by the caller is a stated fact, not a guess.
  if p_category is not null then v_conf := 'HIGH'; end if;

  if v_is_debit and v_acct.kind = 'checking' then
    v_auth := authorize_purchase(p_member, v_key, p_mcc, abs(p_amount));

    if not (v_auth ->> 'ok')::boolean then
      insert into transactions (member_id, account_id, merchant, merchant_key, mcc, amount,
                                status, declined_reason, category, rail, occurred_at)
      values (p_member, p_account, p_merchant, v_key, p_mcc, p_amount,
              'declined', v_auth ->> 'reason', v_category, p_rail, p_at)
      returning id into v_txn;

      perform on_decline(p_member, v_txn, v_auth);
      return v_txn;
    end if;
  end if;

  update accounts set balance = balance + p_amount where id = p_account;

  select * into v_line from budget_status(p_member) bs where bs.category = v_category limit 1;

  insert into transactions (member_id, account_id, merchant, merchant_key, mcc, amount,
                            status, category, qde_category, qde_confidence,
                            budget_line_id, rail, occurred_at)
  values (p_member, p_account, p_merchant, v_key, p_mcc, p_amount,
          'posted', v_category, v_qde, v_conf, v_line.id, p_rail, p_at)
  returning id into v_txn;

  perform on_posted(p_member, v_txn);
  return v_txn;
end;
$$;

-- The same shape of bug, in the ABLE-side question generator: a transaction
-- the code table assigned at HIGH confidence is already categorised and must
-- not be asked about.
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
       and tx.category is null
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

-- The SSI sweep only ever raises on day 25, two days before the last day, and
-- the morning of the last day. The test-account loader needs to be able to
-- show the card on whatever day it happens to run, so it can force one.
create or replace function run_ssi_sweep(p_member uuid, p_force boolean default false)
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
  if not p_force and not exists (
        select 1 from member_facts
         where member_id = p_member and key = 'receives_ssi' and value = 'true') then
    return;
  end if;

  v_projected := projected_first_moment_next_month(p_member);
  if not p_force and v_projected < v_limit - v_buffer then
    update home_cards set state = 'dismissed'
     where member_id = p_member and cls = 'SENTINEL' and kind = 'SSI_SWEEP'
       and state in ('queued','shown');
    return;
  end if;

  v_touch := p_force or (v_day >= 25
         and (v_day = 25
           or current_date = v_last_day - 2
           or current_date = v_last_day));
  if not v_touch then return; end if;

  if not p_force then
    select count(*) into v_touches from home_cards
     where member_id = p_member and cls = 'SENTINEL' and kind = 'SSI_SWEEP'
       and created_at >= date_trunc('month', current_date);
    if v_touches >= 3 then return; end if;
  end if;

  if exists (select 1 from home_cards
              where member_id = p_member and cls = 'SENTINEL' and kind = 'SSI_SWEEP'
                and state in ('queued','shown')) then
    return;
  end if;

  v_suggested := greatest(ceil((v_projected - (v_limit - v_buffer)) / 10) * 10, 10);
  select auto_move_enabled into v_auto from profiles where id = p_member;

  if v_auto then
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
