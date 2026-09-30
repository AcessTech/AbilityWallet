-- Ability Wallet — the Help thread. Brief §2 rule 5, Appendix A §6.1.

create or replace function send_chat_message(
  p_member uuid,
  p_kind   thread_kind default 'help',
  p_body   text default '',
  p_txn_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_thread uuid;
  v_sender msg_sender;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;

  v_sender := case when auth.uid() = p_member then 'member' else 'navigator' end;

  if v_sender = 'navigator' and not auth_is_navigator_of(p_member) then
    raise exception 'not this member''s Navigator';
  end if;

  select id into v_thread from chat_threads
   where member_id = p_member and kind = p_kind;
  if v_thread is null then
    insert into chat_threads (member_id, kind) values (p_member, p_kind)
    returning id into v_thread;
  end if;

  insert into chat_messages (thread_id, sender, sender_id, body, txn_id)
  values (v_thread, v_sender, auth.uid(), p_body, p_txn_id)
  returning id into v_id;

  if v_sender = 'member' then
    -- A11: messaging works at every level, including Independent.
    perform raise_alert(p_member, 'A11', 'Message from '
      || (select first_name from profiles where id = p_member), '{}'::jsonb);
  else
    perform notify_member(p_member, 'B4', 'New message', 'New message', '{}'::jsonb);
  end if;

  return v_id;
end;
$$;

/*
 * The AI yield rule (brief §2 rule 5): when the Navigator posts, the AI goes
 * quiet. It speaks again only when directly prompted, or when the thread has
 * been silent for about 90 seconds with an unanswered Member question.
 */
create or replace function ai_should_reply(p_thread uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_last chat_messages;
  v_last_human chat_messages;
  v_yield int := config_int('ai_yield_seconds');
begin
  select * into v_last from chat_messages
   where thread_id = p_thread order by created_at desc limit 1;
  if v_last.id is null or v_last.sender <> 'member' then
    return false;                      -- the AI only ever replies, never starts
  end if;

  -- Directly prompted.
  if v_last.body ~* '(^|\s)(ai|helper|assistant)(\s|,|\?|$)' then
    return true;
  end if;

  select * into v_last_human from chat_messages
   where thread_id = p_thread and sender = 'navigator'
   order by created_at desc limit 1;

  if v_last_human.id is null then
    return true;                       -- nobody else is in the conversation
  end if;

  -- She spoke more recently than he did: stay out.
  if v_last_human.created_at > v_last.created_at then
    return false;
  end if;

  -- She spoke, then he asked something. Give her time to answer first.
  return now() - v_last.created_at > make_interval(secs => v_yield);
end;
$$;

-- The AI proposes; it never executes. This writes the confirmation card into
-- the thread with static Yes / No.
create or replace function propose_chat_action(
  p_thread uuid,
  p_body   text,
  p_action jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into chat_messages (thread_id, sender, body, action, action_status)
  values (p_thread, 'ai', p_body, p_action, 'pending')
  returning id into v_id;
  return v_id;
end;
$$;

-- The confirmation tap. Only the Member can confirm, only within existing
-- permissions, and every execution is logged (brief §2 rule 4).
create or replace function confirm_chat_action(p_message uuid, p_yes boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  m chat_messages;
  t chat_threads;
  v_from uuid;
  v_to uuid;
  v_amount numeric;
begin
  select * into m from chat_messages where id = p_message for update;
  if m.id is null or m.action is null then
    return jsonb_build_object('ok', false, 'reason', 'no_action');
  end if;
  if m.action_status <> 'pending' then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  select * into t from chat_threads where id = m.thread_id;
  if t.member_id <> auth.uid() then
    raise exception 'only the account owner can confirm an action';
  end if;

  update chat_messages
     set action_status = (case when p_yes then 'confirmed' else 'declined' end)::msg_action_status
   where id = p_message;

  if not p_yes then
    insert into chat_messages (thread_id, sender, body)
    values (m.thread_id, 'ai', 'Okay, I left it alone.');
    return jsonb_build_object('ok', true, 'confirmed', false);
  end if;

  if m.action ->> 'kind' = 'transfer' then
    v_amount := (m.action ->> 'amount')::numeric;
    v_from := account_of(t.member_id, (m.action ->> 'from')::account_kind);
    v_to   := account_of(t.member_id, (m.action ->> 'to')::account_kind);

    if v_from is null or v_to is null then
      insert into chat_messages (thread_id, sender, body)
      values (m.thread_id, 'ai', 'I could not find those accounts.');
      return jsonb_build_object('ok', false);
    end if;

    if (select balance from accounts where id = v_from) < v_amount then
      insert into chat_messages (thread_id, sender, body)
      values (m.thread_id, 'ai', 'There is not enough in that account for this.');
      return jsonb_build_object('ok', false, 'reason', 'not_enough');
    end if;

    perform move_money(t.member_id, v_from, v_to, v_amount, 'Moved from chat', auth.uid());

    insert into chat_messages (thread_id, sender, body)
    values (m.thread_id, 'ai',
            'Done. ' || to_char(v_amount, 'FM$999,999.00') || ' moved.');

    perform raise_alert(t.member_id, 'A9',
      to_char(v_amount, 'FM$999,999.00') || ' moved to ABLE savings',
      jsonb_build_object('amount', v_amount, 'via', 'chat'));
  end if;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail, payload)
  values (t.member_id, auth.uid(), 'member', 'chat_action_confirmed',
          coalesce(m.action ->> 'label', ''), m.action);

  return jsonb_build_object('ok', true, 'confirmed', true);
end;
$$;

-- "Report a problem" opens the Help chat with the transaction attached and the
-- AI asking the opening question. There is no category sheet: categories
-- invite confusion and false disputes, and the real case is fraud
-- (Appendix A §6.2).
create or replace function start_problem_report(p_member uuid, p_txn_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_thread uuid;
  v_name text;
begin
  select id into v_thread from chat_threads where member_id = p_member and kind = 'help';
  if v_thread is null then
    insert into chat_threads (member_id, kind) values (p_member, 'help') returning id into v_thread;
  end if;

  -- Do not stack duplicate openings for the same transaction.
  if exists (select 1 from chat_messages
              where thread_id = v_thread and txn_id = p_txn_id and sender = 'system') then
    return;
  end if;

  select first_name into v_name from profiles where id = p_member;

  insert into chat_messages (thread_id, sender, body, txn_id)
  values (v_thread, 'system', coalesce(v_name, 'They') || ' reported a problem', p_txn_id);

  insert into chat_messages (thread_id, sender, body, txn_id)
  values (v_thread, 'ai', 'What''s wrong with this purchase? You can type or talk.', p_txn_id);

  insert into activity_log (member_id, actor_id, actor_kind, event, detail, payload)
  values (p_member, p_member, 'member', 'problem_reported', '',
          jsonb_build_object('transaction_id', p_txn_id));
end;
$$;

-- Fraud: lock the card, alert the Navigator on the always-on group, open a
-- dispute. A wrongly locked card is a small problem; a real thief with a
-- working card is not (Appendix C).
create or replace function report_fraud(p_member uuid, p_txn_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_dispute uuid;
begin
  update member_cards set status = 'lost' where member_id = p_member;

  insert into disputes (member_id, transaction_id, opened_via, kind, reason)
  values (p_member, p_txn_id, 'chat', 'fraud', 'Reported in chat')
  returning id into v_dispute;

  perform raise_alert(p_member, 'A4',
    'Unusual activity: ' || (select first_name from profiles where id = p_member)
      || ' reported a purchase they did not make',
    jsonb_build_object('transaction_id', p_txn_id, 'dispute_id', v_dispute));

  insert into activity_log (member_id, actor_kind, event, detail, payload)
  values (p_member, 'ai', 'fraud_reported', 'Card locked and a dispute opened',
          jsonb_build_object('transaction_id', p_txn_id));

  return jsonb_build_object('dispute_id', v_dispute, 'card_locked', true);
end;
$$;

create or replace function file_dispute(p_member uuid, p_txn_id uuid, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_dispute uuid;
begin
  insert into disputes (member_id, transaction_id, opened_via, kind, reason)
  values (p_member, p_txn_id, 'chat', 'other', p_reason)
  returning id into v_dispute;

  insert into activity_log (member_id, actor_kind, event, detail, payload)
  values (p_member, 'ai', 'dispute_filed', p_reason,
          jsonb_build_object('transaction_id', p_txn_id));

  return jsonb_build_object('dispute_id', v_dispute);
end;
$$;

-- Decided Sep 23: this alerts Ability Wallet support, who follow up with the
-- Member. It NEVER notifies the Navigator.
create or replace function escalate_safety_concern(p_member uuid, p_note text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into safety_escalations (member_id, note) values (p_member, p_note);
end;
$$;
