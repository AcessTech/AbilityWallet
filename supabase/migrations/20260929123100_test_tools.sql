-- Ability Wallet — the tools a tester needs on their own account.
--
-- Testers make their own account on one side of the app and need a way to
-- add money, run the test scenarios, and start over. These tools are
-- available in test builds, not only in development.
--
-- Every function here works ONLY on the caller's own account, or on a member
-- the caller actively navigates. None of them can touch anyone else's data.

create or replace function test_guard(p_member uuid)
returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if auth.uid() <> p_member and not auth_is_navigator_of(p_member) then
    raise exception 'that is not your account';
  end if;
end;
$$;

-- --------------------------------------------------------- add money ------

create or replace function test_add_money(
  p_member uuid,
  p_kind   account_kind,
  p_amount numeric,
  p_source text default 'Test money'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_account uuid := account_of(p_member, p_kind);
  v_txn uuid;
begin
  perform test_guard(p_member);
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if v_account is null then raise exception 'no % account', p_kind; end if;

  if p_kind = 'checking' then
    v_txn := post_transaction(p_member, v_account, p_source, null, p_amount,
                              'money_in', 'ach', now());
  else
    update accounts set balance = balance + p_amount where id = v_account;
    insert into transactions (member_id, account_id, merchant, merchant_key, amount,
                              status, category, rail, occurred_at)
    values (p_member, v_account, p_source, 'test-money', p_amount, 'posted',
            'money_in', 'ach', now())
    returning id into v_txn;
  end if;

  perform generate_home_cards(p_member);
  return jsonb_build_object('transaction_id', v_txn,
                            'balance', (select balance from accounts where id = v_account));
end;
$$;

-- ------------------------------------------------------- start over -------
-- Clears the money and history but keeps the person, their sign-in and the
-- link to their Navigator.

create or replace function test_reset_account(p_member uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform test_guard(p_member);

  -- Transfers go before linked_banks, or the ON DELETE SET NULL on
  -- transfers.from_linked_bank trips transfer_has_one_source.
  delete from transfers          where member_id = p_member;
  delete from home_cards         where member_id = p_member;
  delete from chat_messages      where thread_id in (select id from chat_threads where member_id = p_member);
  delete from disputes           where member_id = p_member;
  delete from transactions       where member_id = p_member;
  delete from predicted_deposits where member_id = p_member;
  delete from income_schedules   where member_id = p_member;
  delete from merchant_rules     where member_id = p_member;
  delete from member_facts       where member_id = p_member;
  delete from budget_lines       where member_id = p_member;
  delete from savings_goals      where member_id = p_member;
  delete from blocks             where member_id = p_member;
  delete from consents           where member_id = p_member;
  delete from alerts             where member_id = p_member;
  delete from member_notifications where member_id = p_member;
  delete from activity_log       where member_id = p_member;

  update accounts set balance = 0 where member_id = p_member;
  update profiles set auto_move_enabled = false where id = p_member;

  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------- linking a test counterpart ---
-- A tester on one side of the app has nobody on the other. The app signs a
-- second account up through the ordinary sign-up API and then calls this to
-- connect the two, so both ends can be seen from one phone.

create or replace function test_link_counterpart(p_other uuid, p_level int default 4)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_other profiles;
  v_member uuid;
  v_navigator uuid;
begin
  select * into v_me from profiles where id = auth.uid();
  select * into v_other from profiles where id = p_other;
  if v_me.id is null or v_other.id is null then raise exception 'unknown account'; end if;
  if v_me.role = v_other.role then raise exception 'those are the same side of the app'; end if;

  if v_me.role = 'member' then
    v_member := v_me.id; v_navigator := v_other.id;
  else
    v_member := v_other.id; v_navigator := v_me.id;
  end if;

  insert into member_navigator (member_id, navigator_id, level, status, started_at)
  values (v_member, v_navigator, p_level, 'active', now())
  on conflict do nothing;

  update profiles set onboarding_done = true where id in (v_member, v_navigator);

  perform open_member_accounts(v_member);
  perform issue_member_card(v_member);

  return jsonb_build_object('ok', true, 'member', v_member, 'navigator', v_navigator);
end;
$$;

-- ------------------------------------------------------- the scenarios ----
-- The test scenarios, each one setting up what it needs and then
-- firing for real through the same engine the app uses.

create or replace function test_run_scenario(p_member uuid, p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_checking uuid;
  v_able uuid;
  v_line uuid;
  v_consent uuid;
  v_txn uuid;
  v_result jsonb := '{}'::jsonb;
  v_nav uuid;
begin
  perform test_guard(p_member);

  v_checking := account_of(p_member, 'checking');
  v_able     := account_of(p_member, 'able');
  select navigator_id into v_nav from member_navigator
   where member_id = p_member and status = 'active' limit 1;

  -- Every story needs some money to work with.
  if coalesce((select balance from accounts where id = v_checking), 0) < 200 then
    perform test_add_money(p_member, 'checking', 500, 'Test money');
  end if;

  case p_code

    -- A2. An everyday purchase that categorises itself.
    when 'A2' then
      v_result := simulate_purchase(p_member, 'Corner Coffee', '5814', 4.50);

    -- A5. Over a stop line: the card declines and a notice follows.
    when 'A5' then
      insert into budget_lines (member_id, category, display_name, amount, period, mode, sort_order)
      values (p_member, 'games', 'Games', 50, 'month', 'stop', 90)
      on conflict do nothing;
      insert into merchant_rules (member_id, merchant_key, merchant_label, category, ask, source)
      values (p_member, 'gamestop', 'GameStop', 'games', false, 'navigator_set')
      on conflict (member_id, merchant_key) do update set category = 'games';
      perform simulate_purchase(p_member, 'GameStop', '5816', 34.99);
      v_result := simulate_purchase(p_member, 'GameStop', '5816', 72.50);

    -- A16. A blocked merchant.
    when 'A16' then
      insert into blocks (member_id, kind, target, label, status, agreed_by, since)
      values (p_member, 'category', 'gambling', 'Gambling and casinos', 'active',
              array[p_member], now())
      on conflict do nothing;
      v_result := simulate_purchase(p_member, 'Lucky Star Casino', '7995', 60);

    -- A7. Out of money for rides, with emergency money sitting there.
    when 'A7' then
      update accounts set balance = 150 where member_id = p_member and kind = 'emergency';
      insert into budget_lines (member_id, category, display_name, amount, period, mode, sort_order)
      values (p_member, 'around', 'Getting around', 60, 'month', 'guide', 3)
      on conflict do nothing;
      perform simulate_purchase(p_member, 'RideShare Plus', '4121', 58);
      v_result := jsonb_build_object('emergency', 150);

    -- A10. The $2,000 warning.
    when 'A10' then
      insert into member_facts (member_id, key, value, source, fact_confidence)
      values (p_member, 'receives_ssi', 'true', 'deposit_match', 'HIGH')
      on conflict (member_id, key) do update set value = 'true';
      update accounts set balance = 2127.83 where id = v_checking;
      perform run_ssi_sweep(p_member, true);
      v_result := jsonb_build_object('checking', 2127.83);

    -- A11. "Was this for your apartment?"
    when 'A11' then
      if coalesce((select balance from accounts where id = v_able), 0) < 100 then
        perform test_add_money(p_member, 'able', 6240, 'Test money');
      end if;
      insert into member_facts (member_id, key, value, source, fact_confidence)
      values (p_member, 'pays_housing', 'true', 'recurring_stream', 'HIGH')
      on conflict (member_id, key) do update set value = 'true', fact_confidence = 'HIGH';
      perform simulate_purchase(p_member, 'Hardware Depot', '5200', 41.30);
      perform generate_qde_offers(p_member, true);
      v_result := jsonb_build_object('ok', true);

    -- A12. Getting paid: two cycles raises the wages question.
    when 'A12' then
      perform simulate_deposit(p_member, 'Acme Foods', 380, now() - interval '14 days');
      perform simulate_deposit(p_member, 'Acme Foods', 380);
      perform generate_income_tags(p_member);
      v_result := jsonb_build_object('ok', true);

    -- A13. A goal to fill.
    when 'A13' then
      insert into savings_goals (member_id, name, target, saved, agreed_by)
      values (p_member, 'New gaming console', 400, 220,
              array_remove(array[p_member, v_nav], null))
      on conflict do nothing;
      v_result := jsonb_build_object('ok', true);

    -- A8. Card reported lost.
    when 'A8' then
      v_result := report_card_lost(p_member);

    -- A20. Rent money from ABLE, waiting in checking.
    when 'A20' then
      if coalesce((select balance from accounts where id = v_able), 0) < 650 then
        perform test_add_money(p_member, 'able', 1000, 'Test money');
      end if;
      perform move_money(p_member, v_able, v_checking, 650, 'Rent from ABLE', p_member);
      perform start_housing_timer(p_member, 650, 'Oakwood Apartments');
      v_result := jsonb_build_object('ok', true);

    -- B4. A tightening the Member has to agree to.
    when 'B4' then
      insert into budget_lines (member_id, category, display_name, amount, period, mode, sort_order)
      values (p_member, 'games', 'Games', 50, 'month', 'stop', 90)
      on conflict do nothing;
      select id into v_line from budget_lines
       where member_id = p_member and category = 'games' and archived_at is null;
      update budget_lines set pending_change = jsonb_build_object(
        'amount', 40, 'mode', 'stop', 'period', 'month',
        'proposed_by', coalesce(v_nav, p_member), 'proposed_at', now())
       where id = v_line;
      insert into consents (member_id, proposed_by, kind, payload)
      values (p_member, coalesce(v_nav, p_member), 'LIMIT_CHANGE',
              jsonb_build_object('budget_line_id', v_line, 'amount', 40,
                                 'mode', 'stop', 'label', 'Games'))
      returning id into v_consent;
      insert into home_cards (member_id, cls, kind, headline, body, proposal_id, state)
      values (p_member, 'CONSENT', 'LIMIT_CHANGE', 'Games — $40',
              'Purchases over this would stop going through. OK?', v_consent, 'queued');
      v_result := jsonb_build_object('consent_id', v_consent);

    -- B6. More oversight, which he has to agree to.
    when 'B6' then
      insert into consents (member_id, proposed_by, kind, payload)
      values (p_member, coalesce(v_nav, p_member), 'LEVEL_UP',
              jsonb_build_object('level', 4))
      returning id into v_consent;
      insert into home_cards (member_id, cls, kind, headline, body, proposal_id, state)
      values (p_member, 'CONSENT', 'LEVEL_UP', 'A change to your account',
              'Right now, going over a limit sends a note. With this change, purchases over a limit are declined. OK?',
              v_consent, 'queued');
      v_result := jsonb_build_object('consent_id', v_consent);

    -- B12. Money sent from a Navigator's own bank.
    when 'B12' then
      if v_nav is null then
        return jsonb_build_object('ok', false,
          'reason', 'Nobody is on the other side of this account yet.');
      end if;
      update accounts set balance = balance + 50 where id = v_checking;
      insert into transactions (member_id, account_id, merchant, merchant_key, amount,
                                status, category, rail, occurred_at)
      values (p_member, v_checking,
              (select first_name from profiles where id = v_nav),
              'navigator-' || v_nav::text, 50, 'posted', 'money_in', 'ach', now());
      perform notify_member(p_member, 'B3', 'Money arrived',
        (select first_name from profiles where id = v_nav) || ' sent you $50.00', '{}'::jsonb);
      v_result := jsonb_build_object('ok', true);

    -- A budget to look at, if there is none yet.
    when 'BUDGET' then
      insert into budget_lines (member_id, category, display_name, amount, period, mode, sort_order)
      values (p_member, 'groceries', 'Groceries', 150, 'month', 'guide', 1),
             (p_member, 'fun', 'Fun', 120, 'month', 'guide', 2),
             (p_member, 'around', 'Getting around', 60, 'month', 'guide', 3)
      on conflict do nothing;
      v_result := jsonb_build_object('ok', true);

    else
      return jsonb_build_object('ok', false, 'reason', 'unknown scenario');
  end case;

  perform generate_home_cards(p_member);
  return jsonb_build_object('ok', true, 'code', p_code) || v_result;
end;
$$;
