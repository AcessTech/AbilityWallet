-- Ability Wallet — one round trip per screen.

-- ------------------------------------------------------- Member: Spend ----
-- Budget rings -> "Everything else" -> "ABLE spending" -> Transactions.

create or replace function member_spend(p_member uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m uuid := coalesce(p_member, auth.uid());
  v_month_start timestamptz := date_trunc('month', now());
begin
  if m <> auth.uid() and not auth_sees_money_of(m) then raise exception 'not allowed'; end if;

  return jsonb_build_object(
    'budget', coalesce((select jsonb_agg(to_jsonb(b) order by b.sort_order)
                          from budget_status(m) b), '[]'::jsonb),

    -- Everything that did not land on a budget line this month.
    'everything_else', coalesce((
      select sum(abs(t.amount)) from transactions t
        join accounts a on a.id = t.account_id and a.kind = 'checking'
       where t.member_id = m and t.status = 'posted' and t.amount < 0
         and t.rail <> 'internal'
         and t.occurred_at >= v_month_start
         and t.budget_line_id is null), 0),

    'able_total', coalesce((
      select sum(abs(t.amount)) from transactions t
        join accounts a on a.id = t.account_id and a.kind = 'able'
       where t.member_id = m and t.status = 'posted' and t.amount < 0
         and t.rail <> 'internal'
         and t.occurred_at >= v_month_start), 0),

    'able_transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'merchant', t.merchant, 'amount', t.amount,
               'occurred_at', t.occurred_at, 'status', t.status,
               'category', sc.member_word, 'qde', t.qde_category)
             order by t.occurred_at desc)
        from transactions t
        join accounts a on a.id = t.account_id and a.kind = 'able'
        left join spine_categories sc on sc.id = t.category
       where t.member_id = m and t.status = 'posted' and t.amount < 0
         and t.rail <> 'internal'
         and t.occurred_at >= v_month_start), '[]'::jsonb),

    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'merchant', t.merchant, 'amount', t.amount,
               'occurred_at', t.occurred_at, 'status', t.status,
               'declined_reason', t.declined_reason,
               'category', sc.member_word)
             order by t.occurred_at desc)
        from (select * from transactions
               where member_id = m and rail <> 'internal'
               order by occurred_at desc limit 60) t
        left join spine_categories sc on sc.id = t.category), '[]'::jsonb)
  );
end;
$$;

-- -------------------------------------------------------- Member: Save ----
-- Income coming in -> ABLE tasks -> goals.

create or replace function member_save(p_member uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m uuid := coalesce(p_member, auth.uid());
  v_able numeric;
begin
  if m <> auth.uid() and not auth_sees_money_of(m) then raise exception 'not allowed'; end if;

  select coalesce(balance, 0) into v_able from accounts where member_id = m and kind = 'able';

  return jsonb_build_object(
    'coming_in', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', pd.id, 'source', pd.source, 'amount', pd.amount,
               'expected_on', pd.expected_on, 'confidence', pd.prediction_confidence)
             order by pd.expected_on)
        from predicted_deposits pd
       where pd.member_id = m
         and pd.expected_on between current_date and current_date + 35
         and pd.prediction_confidence in ('HIGH','MEDIUM')), '[]'::jsonb),

    'able_balance', v_able,
    'able_room_this_year', config_num('able_annual_contribution') - coalesce((
      select sum(t.amount) from transactions t
        join accounts a on a.id = t.account_id and a.kind = 'able'
       where t.member_id = m and t.amount > 0
         and t.occurred_at >= date_trunc('year', now())), 0),

    'ssi_room', ssi_room(m),
    'projected', projected_first_moment_next_month(m),
    'auto_move', (select auto_move_enabled from profiles where id = m),

    'goals', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', g.id, 'name', g.name, 'target', g.target, 'saved', g.saved,
               'reached_at', g.reached_at, 'agreed', cardinality(g.agreed_by) >= 2)
             order by g.created_at)
        from savings_goals g where g.member_id = m), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------- Navigator: Activity --
-- Rings -> send money -> recurring -> transactions -> Notifications row.

create or replace function navigator_activity(p_member uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_level int := auth_level_for(p_member);
begin
  if v_level is null then raise exception 'not this member''s Navigator'; end if;

  return jsonb_build_object(
    'level', v_level,
    'budget', coalesce((select jsonb_agg(to_jsonb(b) order by b.sort_order)
                          from budget_status(p_member) b), '[]'::jsonb),
    'recurring', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', s.id, 'source', s.source, 'amount', s.amount, 'kind', s.kind,
               'confidence', s.prediction_confidence, 'last_seen_on', s.last_seen_on)
             order by s.amount desc)
        from income_schedules s where s.member_id = p_member), '[]'::jsonb),
    'alerts', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'code', a.code, 'grp', a.grp, 'title', a.title,
               'created_at', a.created_at, 'read_at', a.read_at)
             order by a.created_at desc)
        from (select * from alerts
               where navigator_id = auth.uid() and member_id = p_member
               order by created_at desc limit 50) a), '[]'::jsonb),
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'merchant', t.merchant, 'amount', t.amount,
               'occurred_at', t.occurred_at, 'status', t.status,
               'declined_reason', t.declined_reason)
             order by t.occurred_at desc)
        from (select * from transactions
               where member_id = p_member and rail <> 'internal'
               order by occurred_at desc limit 40) t), '[]'::jsonb)
  );
end;
$$;

-- -------------------------------------------------------- Navigator: Plan --
-- Level bar -> unified budget list -> Blocked -> Analytics rows.

create or replace function navigator_plan(p_member uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_level int := auth_level_for(p_member);
begin
  if v_level is null then raise exception 'not this member''s Navigator'; end if;

  return jsonb_build_object(
    'level', v_level,
    'budget', coalesce((select jsonb_agg(to_jsonb(b) order by b.sort_order)
                          from budget_status(p_member) b), '[]'::jsonb),
    'blocks', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', b.id, 'kind', b.kind, 'target', b.target, 'label', b.label,
               'status', b.status, 'since', b.since,
               'attempts_stopped', b.attempts_stopped)
             order by b.label)
        from blocks b where b.member_id = p_member and b.status <> 'ended'), '[]'::jsonb),
    'goals', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', g.id, 'name', g.name, 'target', g.target, 'saved', g.saved)
             order by g.created_at)
        from savings_goals g where g.member_id = p_member), '[]'::jsonb),
    'waiting', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'kind', c.kind, 'payload', c.payload, 'created_at', c.created_at)
             order by c.created_at)
        from consents c
       where c.member_id = p_member and c.status = 'pending'
         and c.proposed_by = auth.uid()), '[]'::jsonb),
    'asked_by_member', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'kind', c.kind, 'payload', c.payload, 'created_at', c.created_at)
             order by c.created_at)
        from consents c
       where c.member_id = p_member and c.status = 'pending'
         and c.proposed_by = c.member_id), '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------------- Analytics --
-- Cash flow, spending by category, balance line with the $2,000 limit.

create or replace function navigator_analytics(p_member uuid, p_months int default 6)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_level int := auth_level_for(p_member);
begin
  if v_level is null then raise exception 'not this member''s Navigator'; end if;

  return jsonb_build_object(
    'cash_flow', coalesce((
      select jsonb_agg(row_to_json(x) order by x.month)
        from (
          select date_trunc('month', t.occurred_at)::date as month,
                 sum(case when t.amount > 0 then t.amount else 0 end) as money_in,
                 sum(case when t.amount < 0 then abs(t.amount) else 0 end) as money_out
            from transactions t
           where t.member_id = p_member and t.status = 'posted' and t.rail <> 'internal'
             and t.occurred_at >= date_trunc('month', now()) - make_interval(months => p_months - 1)
           group by 1
        ) x), '[]'::jsonb),

    'by_category', coalesce((
      select jsonb_agg(row_to_json(x) order by x.total desc)
        from (
          select coalesce(sc.navigator_word, 'Other') as label,
                 sum(abs(t.amount)) as total
            from transactions t
            left join spine_categories sc on sc.id = t.category
           where t.member_id = p_member and t.status = 'posted'
             and t.amount < 0 and t.rail <> 'internal'
             and t.occurred_at >= date_trunc('month', now())
           group by 1
        ) x), '[]'::jsonb),

    'resource_limit', config_num('ssi_resource_limit'),
    'ssi_room', ssi_room(p_member),
    'balance_now', (select sum(balance) from accounts
                     where member_id = p_member and kind in ('checking','emergency'))
  );
end;
$$;
