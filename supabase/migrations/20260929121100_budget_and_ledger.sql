-- Ability Wallet — budget spend, derived from the ledger.
--
-- Budget spend is derived from the ledger, never stored, so it cannot drift.
-- Both roles read the same numbers from these functions.

-- The start of the period a budget line is measured over.
create or replace function period_start(p_period budget_period, p_at timestamptz default now())
returns timestamptz language sql immutable as $$
  select case p_period
    when 'day'   then date_trunc('day', p_at)
    when 'week'  then date_trunc('week', p_at)      -- Postgres weeks start Monday
    else              date_trunc('month', p_at)
  end;
$$;

create or replace function period_end(p_period budget_period, p_at timestamptz default now())
returns timestamptz language sql immutable as $$
  select case p_period
    when 'day'   then date_trunc('day', p_at)   + interval '1 day'
    when 'week'  then date_trunc('week', p_at)  + interval '7 days'
    else              date_trunc('month', p_at) + interval '1 month'
  end;
$$;

-- How much has gone against one budget line this period.
create or replace function budget_spent(p_line uuid, p_at timestamptz default now())
returns numeric language sql stable as $$
  select coalesce(sum(abs(t.amount)), 0)
    from budget_lines bl
    join transactions t
      on t.member_id = bl.member_id
     and t.status = 'posted'
     and t.amount < 0
     and (t.budget_line_id = bl.id or (t.budget_line_id is null and t.category = bl.category))
     and t.occurred_at >= period_start(bl.period, p_at)
     and t.occurred_at <  period_end(bl.period, p_at)
   where bl.id = p_line;
$$;

-- Every live budget line for a member, with what is left. The Member's side
-- renders rings only: no mode tags ever.
create or replace function budget_status(p_member uuid)
returns table (
  id uuid,
  category text,
  display_name text,
  amount numeric,
  period budget_period,
  mode budget_mode,
  spent numeric,
  remaining numeric,
  fraction_left numeric,
  pending_change jsonb,
  sort_order int
) language sql stable as $$
  select bl.id, bl.category, bl.display_name, bl.amount, bl.period, bl.mode,
         s.spent,
         greatest(bl.amount - s.spent, 0) as remaining,
         case when bl.amount > 0
              then greatest(least((bl.amount - s.spent) / bl.amount, 1), 0)
              else 0 end as fraction_left,
         bl.pending_change,
         bl.sort_order
    from budget_lines bl
    cross join lateral (select budget_spent(bl.id) as spent) s
   where bl.member_id = p_member
     and bl.archived_at is null
   order by bl.sort_order, bl.created_at;
$$;

-- --------------------------------------------------------- SSI numbers ----
-- ssi_room (live) and the month-end projection are
-- separate numbers and are never conflated.

create or replace function ssi_room(p_member uuid)
returns numeric language sql stable as $$
  select config_num('ssi_resource_limit') - coalesce((
    select sum(a.balance) from accounts a
     where a.member_id = p_member
       -- ABLE is excluded to $100k, EBT is a SNAP benefit and not a resource,
       -- a back-payment balance is excluded for 9 months.
       and a.kind in ('checking','emergency')
  ), 0);
$$;

-- What the countable balance is projected to be at the first moment of next
-- month: today's countable balance, plus deposits expected before the month
-- turns (an Aug 25 paycheck counts; a Sep 1 SSI deposit does not).
create or replace function projected_first_moment_next_month(p_member uuid)
returns numeric language sql stable as $$
  select coalesce((
    select sum(a.balance) from accounts a
     where a.member_id = p_member and a.kind in ('checking','emergency')
  ), 0)
  + coalesce((
    select sum(pd.amount) from predicted_deposits pd
     where pd.member_id = p_member
       and pd.expected_on >= current_date
       and pd.expected_on <= (date_trunc('month', current_date) + interval '1 month - 1 day')::date
       and pd.prediction_confidence in ('HIGH','MEDIUM')
  ), 0);
$$;

-- ----------------------------------------------------- account helpers ----

create or replace function account_of(p_member uuid, p_kind account_kind)
returns uuid language sql stable as $$
  select id from accounts where member_id = p_member and kind = p_kind limit 1;
$$;

-- What the Member has to spend right now: checking only. Emergency money is a
-- separate stash and ABLE is savings.
create or replace function spendable_balance(p_member uuid)
returns numeric language sql stable as $$
  select coalesce(balance, 0) from accounts
   where member_id = p_member and kind = 'checking' limit 1;
$$;
