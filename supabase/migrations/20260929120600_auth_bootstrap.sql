-- Ability Wallet — what happens when someone signs up.
-- Sign-in is email and password. The role and name ride along
-- in the sign-up metadata; this trigger turns them into a profile row.

create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role app_role;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::app_role, 'navigator');

  insert into profiles (id, role, first_name, last_name, email)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  )
  on conflict (id) do nothing;

  -- A Navigator starts with the default alert routing and quiet hours off
  -- (the PagerDuty model). "Card safety and fraud" is Push +
  -- Text and is not configurable.
  if v_role = 'navigator' then
    insert into alert_prefs (navigator_id, grp, channels) values
      (new.id, 'card_safety', '{push,text}'),
      (new.id, 'declines',    '{push}'),
      (new.id, 'limits',      '{push}'),
      (new.id, 'money',       '{in_app}'),
      (new.id, 'benefits',    '{push,text}'),
      (new.id, 'questions',   '{push}'),
      (new.id, 'setup',       '{push}')
    on conflict do nothing;

    insert into quiet_hours (navigator_id) values (new.id) on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Opening a Member's accounts. Called when an invite is accepted, or at the end
-- of self-signup. The app starts empty: balances are zero until money arrives.
create or replace function open_member_accounts(p_member uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into accounts (member_id, kind, name, balance) values
    (p_member, 'checking',  'Checking',        0),
    (p_member, 'able',      'ABLE savings',    0),
    (p_member, 'emergency', 'Emergency money', 0)
  on conflict do nothing;

  -- One Help thread. At level 1 the Navigator gets a separate 1:1 instead of
  -- sharing this one; the RLS policy enforces that.
  insert into chat_threads (member_id, kind) values (p_member, 'help')
  on conflict do nothing;
  insert into chat_threads (member_id, kind) values (p_member, 'navigator_private')
  on conflict do nothing;
end;
$$;

-- Who am I, and who am I linked to. One round trip on app open.
create or replace function my_context()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_me profiles;
  v_out jsonb;
begin
  select * into v_me from profiles where id = auth.uid();
  if v_me.id is null then
    return jsonb_build_object('signed_in', true, 'profile', null);
  end if;

  if v_me.role = 'member' then
    select jsonb_build_object(
      'signed_in', true,
      'profile', to_jsonb(v_me),
      'links', coalesce((
        select jsonb_agg(jsonb_build_object(
          'link_id', mn.id,
          'level', mn.level,
          'status', mn.status,
          'navigator', jsonb_build_object(
            'id', np.id, 'first_name', np.first_name,
            'last_name', np.last_name, 'email', np.email)))
        from member_navigator mn
        left join profiles np on np.id = mn.navigator_id
        where mn.member_id = v_me.id and mn.status in ('active','invited')
      ), '[]'::jsonb)
    ) into v_out;
  else
    select jsonb_build_object(
      'signed_in', true,
      'profile', to_jsonb(v_me),
      'links', coalesce((
        select jsonb_agg(jsonb_build_object(
          'link_id', mn.id,
          'level', mn.level,
          'status', mn.status,
          'invite_email', mn.invite_email,
          'member', jsonb_build_object(
            'id', mp.id, 'first_name', mp.first_name,
            'last_name', mp.last_name, 'email', mp.email))
          order by mn.created_at)
        from member_navigator mn
        left join profiles mp on mp.id = mn.member_id
        where mn.navigator_id = v_me.id and mn.status in ('active','invited')
      ), '[]'::jsonb)
    ) into v_out;
  end if;

  return v_out;
end;
$$;
