-- Ability Wallet — the Navigator sending money.
-- It is funded from her linked external bank; her money never sits in the
-- system, so there is no balance to debit on our side.

create or replace function navigator_send_money(
  p_member uuid,
  p_amount numeric,
  p_repeat boolean default false
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_bank linked_banks;
  v_checking uuid;
  v_transfer uuid;
  v_name text;
begin
  if not auth_is_navigator_of(p_member) then
    raise exception 'not this member''s Navigator';
  end if;
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;

  select * into v_bank from linked_banks
   where owner_id = auth.uid() and is_default order by created_at limit 1;
  if v_bank.id is null then raise exception 'no linked bank'; end if;

  v_checking := account_of(p_member, 'checking');
  if v_checking is null then raise exception 'no checking account'; end if;

  select first_name into v_name from profiles where id = auth.uid();

  update accounts set balance = balance + p_amount where id = v_checking;

  insert into transfers (member_id, from_linked_bank, to_account_id, amount, memo,
                         initiated_by, status, repeats_monthly, next_run_on)
  values (p_member, v_bank.id, v_checking, p_amount,
          coalesce(v_name, 'Your Navigator') || ' sent you money',
          auth.uid(), 'completed', p_repeat,
          case when p_repeat then (current_date + interval '1 month')::date else null end)
  returning id into v_transfer;

  insert into transactions (member_id, account_id, merchant, merchant_key, amount,
                            status, category, rail, occurred_at)
  values (p_member, v_checking, coalesce(v_name, 'Your Navigator'),
          'navigator-' || auth.uid()::text, p_amount, 'posted', 'money_in', 'ach', now());

  perform notify_member(p_member, 'B3', 'Money arrived',
    coalesce(v_name, 'Your Navigator') || ' sent you ' || to_char(p_amount, 'FM$999,999.00'),
    jsonb_build_object('transfer_id', v_transfer));

  perform raise_alert(p_member, 'A1',
    coalesce(v_name, 'Your Navigator') || ' deposit: ' || to_char(p_amount, 'FM$999,999.00'),
    jsonb_build_object('transfer_id', v_transfer));

  insert into activity_log (member_id, actor_id, actor_kind, event, detail, payload)
  values (p_member, auth.uid(), 'navigator', 'money_sent',
          to_char(p_amount, 'FM$999,999.00') || ' sent from a linked bank',
          jsonb_build_object('transfer_id', v_transfer, 'repeats', p_repeat));

  return jsonb_build_object('transfer_id', v_transfer);
end;
$$;

-- The repeating monthly send, run by the nightly sweep.
create or replace function run_repeating_transfers()
returns void
language plpgsql security definer set search_path = public as $$
declare t record;
begin
  for t in
    select * from transfers
     where repeats_monthly and next_run_on is not null and next_run_on <= current_date
  loop
    update accounts set balance = balance + t.amount where id = t.to_account_id;

    insert into transactions (member_id, account_id, merchant, merchant_key, amount,
                              status, category, rail, occurred_at)
    select t.member_id, t.to_account_id, coalesce(p.first_name, 'Your Navigator'),
           'navigator-' || t.initiated_by::text, t.amount, 'posted', 'money_in', 'ach', now()
      from profiles p where p.id = t.initiated_by;

    update transfers set next_run_on = (next_run_on + interval '1 month')::date
     where id = t.id;

    perform notify_member(t.member_id, 'B3', 'Money arrived',
      'Your monthly money arrived.', jsonb_build_object('transfer_id', t.id));
  end loop;
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
  perform run_repeating_transfers();
end;
$$;
