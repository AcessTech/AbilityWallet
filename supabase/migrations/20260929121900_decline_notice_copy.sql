-- The decline notice was naming the budget line as "Games limit" because it
-- parsed the stored reason string. Carry the line's name in the authorization
-- result instead, and keep declined_reason in the alert's exact wording.

create or replace function authorize_purchase(
  p_member uuid,
  p_merchant_key text,
  p_mcc text,
  p_amount numeric
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_block blocks;
  v_line record;
  v_balance numeric;
begin
  if exists (select 1 from known_scams where merchant_key = p_merchant_key) then
    return jsonb_build_object('ok', false, 'reason', 'blocked merchant', 'rule', 'known_scam');
  end if;

  select * into v_block from blocks
   where member_id = p_member and status = 'active'
     and ((kind = 'merchant' and target = p_merchant_key)
       or (kind = 'category'  and target = (select block_group from mcc_categories where mcc = p_mcc)))
   limit 1;
  if v_block.id is not null then
    return jsonb_build_object('ok', false, 'reason', 'blocked merchant',
                              'rule', 'block', 'block_id', v_block.id,
                              'label', v_block.label);
  end if;

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
      'line_name', v_line.display_name,
      'remaining', v_line.remaining);
  end if;

  v_balance := spendable_balance(p_member);
  if p_amount > v_balance then
    return jsonb_build_object('ok', false, 'reason', 'not enough money',
                              'rule', 'balance', 'remaining', v_balance);
  end if;

  return jsonb_build_object('ok', true, 'budget_line_id', v_line.id);
end;
$$;

create or replace function on_decline(p_member uuid, p_txn uuid, p_auth jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  t transactions;
  v_reason text := p_auth ->> 'reason';
begin
  select * into t from transactions where id = p_txn;

  perform raise_alert(p_member, 'A6',
    'Declined: ' || t.merchant || ' ' || to_char(abs(t.amount), 'FM$999,999.00')
      || ' — ' || v_reason,
    jsonb_build_object('transaction_id', p_txn, 'reason', v_reason));

  perform notify_member(p_member, 'B2', 'Open Ability Wallet',
    'A purchase didn''t go through.', jsonb_build_object('transaction_id', p_txn));

  insert into home_cards (member_id, cls, kind, headline, body, txn_id, state, payload)
  values (
    p_member, 'NOTICE', 'DECLINE_EXPLAIN',
    'That one didn''t go through',
    case p_auth ->> 'rule'
      when 'balance' then
        'You had ' || to_char((p_auth ->> 'remaining')::numeric, 'FM$999,999.00')
          || ' and this one was ' || to_char(abs(t.amount), 'FM$999,999.00') || '.'
      when 'stop_line' then
        'You have ' || to_char((p_auth ->> 'remaining')::numeric, 'FM$999,999.00')
          || ' left for ' || (p_auth ->> 'line_name')
          || ' this month. This one was ' || to_char(abs(t.amount), 'FM$999,999.00') || '.'
      when 'card_status' then
        'Your card is not working right now.'
      else
        'You and your Navigator agreed not to use this shop.'
    end,
    p_txn, 'queued',
    jsonb_build_object('reason', v_reason, 'rule', p_auth ->> 'rule'));

  if p_auth ? 'block_id' then
    update blocks set attempts_stopped = attempts_stopped + 1
     where id = (p_auth ->> 'block_id')::uuid;
  end if;
end;
$$;
