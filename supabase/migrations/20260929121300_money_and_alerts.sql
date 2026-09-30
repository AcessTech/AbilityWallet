-- Ability Wallet — the simulated ledger, the authorization path, and alerts.

-- ------------------------------------------------------------ alerting ----
-- Alerts are generated server-side; the app renders them. Every alert lands in
-- the Activity feed regardless of routing.

create or replace function raise_alert(
  p_member uuid,
  p_code   text,
  p_title  text default null,
  p_payload jsonb default '{}'
) returns void
language plpgsql security definer set search_path = public as $$
declare
  m alert_group_map;
  ln record;
  v_title text;
begin
  select * into m from alert_group_map where code = p_code;
  if m.code is null then return; end if;

  for ln in
    select mn.navigator_id, mn.level
      from member_navigator mn
     where mn.member_id = p_member
       and mn.status = 'active'
       and mn.navigator_id is not null
       and mn.level >= m.min_level
  loop
    v_title := coalesce(p_title, m.wording);

    insert into alerts (navigator_id, member_id, code, grp, title, payload)
    values (ln.navigator_id, p_member, p_code, m.grp, v_title, p_payload);
  end loop;

  insert into activity_log (member_id, actor_kind, event, detail, payload)
  values (p_member, 'system', 'alert_' || p_code, coalesce(p_title, m.wording), p_payload);
end;
$$;

-- Member-side notification. Lock-screen copy never carries amounts, merchant
-- names or declines.
create or replace function notify_member(
  p_member uuid,
  p_code   text,
  p_lock   text,
  p_in_app text,
  p_payload jsonb default '{}'
) returns void
language sql security definer set search_path = public as $$
  insert into member_notifications (member_id, code, lock_text, in_app_text, payload)
  values (p_member, p_code, p_lock, p_in_app, p_payload);
$$;

-- -------------------------------------------------------------- ledger ----

-- An internal move between two of the Member's own accounts.
create or replace function move_money(
  p_member uuid,
  p_from   uuid,
  p_to     uuid,
  p_amount numeric,
  p_memo   text,
  p_actor  uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_transfer uuid;
  v_from accounts;
  v_to accounts;
begin
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;

  select * into v_from from accounts where id = p_from for update;
  select * into v_to   from accounts where id = p_to   for update;
  if v_from.id is null or v_to.id is null then raise exception 'unknown account'; end if;
  if v_from.balance < p_amount then raise exception 'not enough money'; end if;

  update accounts set balance = balance - p_amount where id = p_from;
  update accounts set balance = balance + p_amount where id = p_to;

  insert into transfers (member_id, from_account_id, to_account_id, amount, memo, initiated_by, status)
  values (p_member, p_from, p_to, p_amount, p_memo, p_actor, 'completed')
  returning id into v_transfer;

  insert into transactions (member_id, account_id, merchant, merchant_key, amount,
                            status, category, rail, occurred_at)
  values
    (p_member, p_from, v_to.name,   'internal-' || v_to.kind,   -p_amount, 'posted', 'savings', 'internal', now()),
    (p_member, p_to,   v_from.name, 'internal-' || v_from.kind,  p_amount, 'posted', 'money_in', 'internal', now());

  insert into activity_log (member_id, actor_id, actor_kind, event, detail, payload)
  values (p_member, p_actor, case when p_actor = p_member then 'member' else 'system' end,
          'money_moved',
          to_char(p_amount, 'FM$999,999.00') || ' from ' || v_from.name || ' to ' || v_to.name,
          jsonb_build_object('transfer_id', v_transfer));

  return v_transfer;
end;
$$;

-- ------------------------------------------------- the authorization path --
-- ONE path, in this order: blocks -> stop lines -> balance.
-- The order matters: the decline reason must name the rule that actually bit,
-- because both roles build their copy from that string.

create or replace function authorize_purchase(
  p_member uuid,
  p_merchant_key text,
  p_mcc text,
  p_amount numeric      -- positive magnitude
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_block blocks;
  v_group text;
  v_line record;
  v_balance numeric;
begin
  -- 1a. Known scams are always enforced, for everyone, not configurable.
  if exists (select 1 from known_scams where merchant_key = p_merchant_key) then
    return jsonb_build_object('ok', false, 'reason', 'blocked merchant', 'rule', 'known_scam');
  end if;

  -- 1b. This member's own blocks: the merchant itself, or its MCC group.
  select * into v_block from blocks
   where member_id = p_member and status = 'active'
     and ((kind = 'merchant' and target = p_merchant_key)
       or (kind = 'category'  and target = (select block_group from mcc_categories where mcc = p_mcc)))
   limit 1;
  if v_block.id is not null then
    return jsonb_build_object('ok', false, 'reason', 'blocked merchant',
                              'rule', 'block', 'block_id', v_block.id);
  end if;

  -- 2. Stop-mode budget lines. Only mode='stop' can decline.
  select * into v_line from budget_status(p_member) bs
   where bs.mode = 'stop'
     and bs.category = coalesce(
           (select mr.category from merchant_rules mr
             where mr.member_id = p_member and mr.merchant_key = p_merchant_key),
           (select mc.spine_id from mcc_categories mc where mc.mcc = p_mcc))
   limit 1;

  if v_line.id is not null and p_amount > v_line.remaining then
    return jsonb_build_object(
      'ok', false,
      'reason', 'over the ' || v_line.display_name || ' limit',
      'rule', 'stop_line',
      'budget_line_id', v_line.id,
      'remaining', v_line.remaining);
  end if;

  -- 3. Money.
  v_balance := spendable_balance(p_member);
  if p_amount > v_balance then
    return jsonb_build_object('ok', false, 'reason', 'not enough money',
                              'rule', 'balance', 'remaining', v_balance);
  end if;

  return jsonb_build_object('ok', true,
    'budget_line_id', v_line.id,
    'over_alert_line', false);
end;
$$;

-- Post one transaction through the authorization path. Used by the simulator
-- and by anything else that moves money out of the card.
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
  v_line record;
  v_is_debit boolean := p_amount < 0;
  v_acct accounts;
begin
  v_key := trim(both '-' from v_key);
  select * into v_acct from accounts where id = p_account;

  -- Tier 1 of QDE identification: assign straight from the merchant code.
  select mc.spine_id, mc.candidate_qde,
         case when mc.auto_assign then 'HIGH' else 'MEDIUM' end::confidence
    into v_category, v_qde, v_conf
    from mcc_categories mc where mc.mcc = p_mcc;

  -- A saved merchant rule beats the code table: ask once, remember forever.
  select mr.category, mr.qde, 'HIGH'::confidence
    into v_category, v_qde, v_conf
    from merchant_rules mr
   where mr.member_id = p_member and mr.merchant_key = v_key;

  v_category := coalesce(p_category, v_category);
  if v_conf is null then v_conf := 'LOW'; end if;

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

  -- The money actually moves.
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

-- What happens after a decline (alerts A6 and B2).
create or replace function on_decline(p_member uuid, p_txn uuid, p_auth jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  t transactions;
  v_reason text := p_auth ->> 'reason';
  v_line budget_lines;
begin
  select * into t from transactions where id = p_txn;

  perform raise_alert(p_member, 'A6',
    'Declined: ' || t.merchant || ' ' || to_char(abs(t.amount), 'FM$999,999.00')
      || ' — ' || v_reason,
    jsonb_build_object('transaction_id', p_txn, 'reason', v_reason));

  -- The Member's private explanation. No amounts on the lock screen.
  perform notify_member(p_member, 'B2', 'Open Ability Wallet',
    'A purchase didn''t go through.', jsonb_build_object('transaction_id', p_txn));

  -- The no-buttons notice. declined_reason is already in the alert's exact
  -- wording, so the template must NOT prefix it with "more than the".
  insert into home_cards (member_id, cls, kind, headline, body, txn_id, state, payload)
  values (
    p_member, 'NOTICE', 'DECLINE_EXPLAIN',
    'That one didn''t go through',
    case
      when p_auth ->> 'rule' = 'balance'
        then 'You had ' || to_char((p_auth ->> 'remaining')::numeric, 'FM$999,999.00')
             || ' and this was ' || to_char(abs(t.amount), 'FM$999,999.00') || '.'
      when p_auth ->> 'rule' = 'stop_line'
        then 'You have ' || to_char((p_auth ->> 'remaining')::numeric, 'FM$999,999.00')
             || ' left for ' || split_part(v_reason, 'over the ', 2)
             || '. This was ' || to_char(abs(t.amount), 'FM$999,999.00') || '.'
      else 'You and your Navigator agreed not to use this shop.'
    end,
    p_txn, 'queued',
    jsonb_build_object('reason', v_reason, 'rule', p_auth ->> 'rule'));

  -- A blocked merchant that keeps trying is worth counting.
  if p_auth ? 'block_id' then
    update blocks set attempts_stopped = attempts_stopped + 1
     where id = (p_auth ->> 'block_id')::uuid;
  end if;
end;
$$;

-- What happens after a purchase posts.
create or replace function on_posted(p_member uuid, p_txn uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  t transactions;
  v_line record;
  v_low numeric := config_num('low_balance_default');
  v_balance numeric;
begin
  select * into t from transactions where id = p_txn;

  if t.amount > 0 then
    -- Money in.
    perform raise_alert(p_member, 'A1',
      coalesce(t.merchant, 'Deposit') || ' deposit: ' || to_char(t.amount, 'FM$999,999.00'),
      jsonb_build_object('transaction_id', p_txn));
    perform notify_member(p_member, 'B3', 'Money arrived',
      t.merchant || ': ' || to_char(t.amount, 'FM$999,999.00'),
      jsonb_build_object('transaction_id', p_txn));
    return;
  end if;

  -- A3 new payee: no prior transaction with this merchant.
  if (select count(*) from transactions
       where member_id = p_member and merchant_key = t.merchant_key) = 1 then
    perform raise_alert(p_member, 'A3',
      'First payment to ' || t.merchant || ': ' || to_char(abs(t.amount), 'FM$999,999.00'),
      jsonb_build_object('transaction_id', p_txn));
  end if;

  -- A7 over an alert-mode line: the purchase went through, this is awareness.
  select * into v_line from budget_status(p_member) bs
   where bs.category = t.category and bs.mode = 'alert' limit 1;
  if v_line.id is not null and v_line.spent > v_line.amount then
    perform raise_alert(p_member, 'A7',
      'Over the ' || v_line.display_name || ' limit: ' || t.merchant || ' '
        || to_char(abs(t.amount), 'FM$999,999.00') || ' ('
        || to_char(v_line.spent - v_line.amount, 'FM$999,999.00') || ' over)',
      jsonb_build_object('transaction_id', p_txn, 'budget_line_id', v_line.id));
  end if;

  -- A2 low balance, once, until it recovers.
  v_balance := spendable_balance(p_member);
  if v_balance < v_low and not exists (
        select 1 from alerts a
         where a.member_id = p_member and a.code = 'A2'
           and a.created_at > now() - interval '30 days'
           and (a.payload ->> 'cleared') is null) then
    perform raise_alert(p_member, 'A2',
      (select first_name from profiles where id = p_member)
        || '''s checking is below ' || to_char(v_low, 'FM$999,999'),
      jsonb_build_object('balance', v_balance));
  end if;
end;
$$;

-- Housing timer. Starts only when ABLE money for rent lands in checking.
create or replace function start_housing_timer(p_member uuid, p_amount numeric, p_payee text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into home_cards (member_id, cls, kind, headline, body, suggested_amount, state, payload)
  values (
    p_member, 'SENTINEL', 'HOUSING_TIMER',
    'Your rent money from ABLE needs to be paid this month',
    to_char(p_amount, 'FM$999,999.00') || ' to ' || p_payee || ' by '
      || to_char((date_trunc('month', now()) + interval '1 month - 1 day')::date, 'FMMonth FMDD') || '.',
    p_amount, 'queued',
    jsonb_build_object('payee', p_payee))
  on conflict do nothing;
end;
$$;
