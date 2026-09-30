-- Ability Wallet — the transaction simulator and the two Home screens.

-- ----------------------------------------------------------- simulator ----
-- Brief §5 item 6, MVP only. Injects fake purchases, including declines, so
-- the flows are testable on the phone. Lives behind Member -> Account -> Test
-- tools in dev builds.

create or replace function simulate_purchase(
  p_member   uuid,
  p_merchant text,
  p_mcc      text,
  p_amount   numeric,           -- positive magnitude
  p_account  account_kind default 'checking',
  p_at       timestamptz default now()
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_account uuid := account_of(p_member, p_account);
  v_txn uuid;
  t transactions;
begin
  if v_account is null then raise exception 'no % account', p_account; end if;

  -- A paused or lost card declines before anything else is considered.
  if exists (select 1 from member_cards
              where member_id = p_member and status in ('paused','lost','stolen')) then
    insert into transactions (member_id, account_id, merchant, merchant_key, mcc,
                              amount, status, declined_reason, rail, occurred_at)
    values (p_member, v_account, p_merchant,
            trim(both '-' from lower(regexp_replace(p_merchant, '[^a-zA-Z0-9]+', '-', 'g'))),
            p_mcc, -abs(p_amount), 'declined',
            (select case when status = 'paused' then 'card paused'
                         else 'card reported lost' end
               from member_cards where member_id = p_member limit 1),
            'card', p_at)
    returning id into v_txn;
    perform on_decline(p_member, v_txn,
      jsonb_build_object('reason', (select declined_reason from transactions where id = v_txn),
                         'rule', 'card_status'));
  else
    v_txn := post_transaction(p_member, v_account, p_merchant, p_mcc,
                              -abs(p_amount), null, 'card', p_at);
  end if;

  perform generate_home_cards(p_member);

  select * into t from transactions where id = v_txn;
  return jsonb_build_object('transaction_id', v_txn, 'status', t.status,
                            'declined_reason', t.declined_reason);
end;
$$;

create or replace function simulate_deposit(
  p_member uuid,
  p_source text,
  p_amount numeric,
  p_at     timestamptz default now()
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_txn uuid;
begin
  v_txn := post_transaction(p_member, account_of(p_member, 'checking'),
                            p_source, null, abs(p_amount), 'money_in', 'ach', p_at);
  perform generate_home_cards(p_member);
  return jsonb_build_object('transaction_id', v_txn);
end;
$$;

-- ---------------------------------------------------------- Member Home ----
-- Decision slot -> accounts -> budget -> recent (Appendix A §6.1).

create or replace function member_home(p_member uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m uuid := coalesce(p_member, auth.uid());
  v_card home_cards;
  v_notice home_cards;
  v_txn transactions;
begin
  if m <> auth.uid() and not auth_sees_money_of(m) then
    raise exception 'not allowed';
  end if;

  select * into v_card   from next_home_card(m);
  select * into v_notice from next_notice(m);

  if v_card.txn_id is not null then
    select * into v_txn from transactions where id = v_card.txn_id;
  end if;

  return jsonb_build_object(
    'card', case when v_card.id is null then null else
      to_jsonb(v_card) || jsonb_build_object('merchant', v_txn.merchant) end,
    'notice', case when v_notice.id is null then null else to_jsonb(v_notice) end,
    'accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'kind', a.kind, 'name', a.name, 'balance', a.balance,
               'program_name', a.program_name)
             order by array_position(
               array['checking','able','emergency','ebt','backpayment']::account_kind[], a.kind))
        from accounts a where a.member_id = m), '[]'::jsonb),
    'budget', coalesce((
      select jsonb_agg(to_jsonb(b) order by b.sort_order) from budget_status(m) b), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'merchant', t.merchant, 'merchant_key', t.merchant_key,
               'amount', t.amount, 'status', t.status, 'occurred_at', t.occurred_at,
               'declined_reason', t.declined_reason)
             order by t.occurred_at desc)
        from (select * from transactions
               where member_id = m and rail <> 'internal'
               order by occurred_at desc limit 3) t), '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------ Navigator Home ----
-- Most recent alert -> accounts -> budget -> send money -> recent.
-- Newest first, like missed calls (decided Sep 23).

create or replace function navigator_home(p_member uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_level int := auth_level_for(p_member);
begin
  if v_level is null then raise exception 'not this member''s Navigator'; end if;

  return jsonb_build_object(
    'level', v_level,
    'member', (select jsonb_build_object('id', id, 'first_name', first_name,
                                         'last_name', last_name)
                 from profiles where id = p_member),
    'alert', (select to_jsonb(a) from alerts a
               where a.navigator_id = auth.uid() and a.member_id = p_member
               order by a.created_at desc limit 1),
    'unread_alerts', (select count(*) from alerts
                       where navigator_id = auth.uid() and member_id = p_member
                         and read_at is null),
    'accounts', case when v_level < 2 then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'kind', a.kind, 'name', a.name, 'balance', a.balance)
             order by array_position(
               array['checking','able','emergency','ebt','backpayment']::account_kind[], a.kind))
        from accounts a where a.member_id = p_member), '[]'::jsonb) end,
    'budget', case when v_level < 2 then '[]'::jsonb else coalesce((
      select jsonb_agg(to_jsonb(b) order by b.sort_order)
        from budget_status(p_member) b), '[]'::jsonb) end,
    'ssi_room', case when v_level < 2 then null else ssi_room(p_member) end,
    'recent', case when v_level < 2 then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'merchant', t.merchant, 'amount', t.amount,
               'status', t.status, 'occurred_at', t.occurred_at,
               'declined_reason', t.declined_reason)
             order by t.occurred_at desc)
        from (select * from transactions
               where member_id = p_member and rail <> 'internal'
               order by occurred_at desc limit 3) t), '[]'::jsonb) end
  );
end;
$$;
