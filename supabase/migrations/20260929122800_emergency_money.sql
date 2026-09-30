-- Emergency money. The Member never needs permission to reach it; the alert to
-- his Navigator is the whole oversight mechanism (alert A10, always on).

create or replace function use_emergency_money(p_member uuid, p_amount numeric)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_from uuid := account_of(p_member, 'emergency');
  v_to   uuid := account_of(p_member, 'checking');
  v_transfer uuid;
begin
  if auth.uid() <> p_member then
    raise exception 'only the account owner can move their emergency money';
  end if;

  v_transfer := move_money(p_member, v_from, v_to, p_amount, 'Emergency money', p_member);

  perform raise_alert(p_member, 'A10',
    (select first_name from profiles where id = p_member)
      || ' moved ' || to_char(p_amount, 'FM$999,999.00') || ' of emergency money to spending',
    jsonb_build_object('amount', p_amount, 'transfer_id', v_transfer));

  return jsonb_build_object('transfer_id', v_transfer);
end;
$$;
