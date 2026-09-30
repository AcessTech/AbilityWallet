-- Ability Wallet — row level security.
--
-- Members read and write only their own rows. Navigators reach member data
-- only through an ACTIVE member_navigator row, and only at their level's
-- visibility. Nobody else reads anything.
--
-- A row-level policy alone is not enough: the role also needs a table-level
-- GRANT (build_status.md §6 — this cost an hour in July). The grants are at
-- the bottom of this file.

-- ------------------------------------------------------------- helpers ----
-- SECURITY DEFINER so the policies do not recurse through the policies on
-- member_navigator / profiles.

create or replace function auth_is_navigator_of(p_member uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from member_navigator mn
    where mn.member_id = p_member
      and mn.navigator_id = auth.uid()
      and mn.status = 'active'
  );
$$;

-- Level 1 (Independent) has NO account visibility — messages only
-- (Appendix B delivery matrix). Anything about money needs level >= 2.
create or replace function auth_sees_money_of(p_member uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from member_navigator mn
    where mn.member_id = p_member
      and mn.navigator_id = auth.uid()
      and mn.status = 'active'
      and mn.level >= 2
  );
$$;

create or replace function auth_level_for(p_member uuid)
returns int
language sql stable security definer set search_path = public as $$
  select mn.level from member_navigator mn
  where mn.member_id = p_member
    and mn.navigator_id = auth.uid()
    and mn.status = 'active'
  limit 1;
$$;

-- Everyone this user may see money for: himself if he is a member, plus every
-- member he actively navigates at level >= 2.
create or replace function auth_visible_members()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select auth.uid()
  union
  select mn.member_id from member_navigator mn
   where mn.navigator_id = auth.uid()
     and mn.status = 'active'
     and mn.level >= 2;
$$;

-- ---------------------------------------------------------------- RLS ------

alter table profiles              enable row level security;
alter table member_navigator      enable row level security;
alter table accounts              enable row level security;
alter table member_cards          enable row level security;
alter table budget_lines          enable row level security;
alter table transactions          enable row level security;
alter table blocks                enable row level security;
alter table known_scams           enable row level security;
alter table mcc_categories        enable row level security;
alter table spine_categories      enable row level security;
alter table app_config            enable row level security;
alter table home_cards            enable row level security;
alter table merchant_rules        enable row level security;
alter table member_facts          enable row level security;
alter table income_schedules      enable row level security;
alter table predicted_deposits    enable row level security;
alter table savings_goals         enable row level security;
alter table consents              enable row level security;
alter table activity_log          enable row level security;
alter table alerts                enable row level security;
alter table alert_group_map       enable row level security;
alter table alert_prefs           enable row level security;
alter table quiet_hours           enable row level security;
alter table member_notifications  enable row level security;
alter table push_tokens           enable row level security;
alter table outbound_messages     enable row level security;
alter table chat_threads          enable row level security;
alter table chat_messages         enable row level security;
alter table linked_banks          enable row level security;
alter table transfers             enable row level security;
alter table disputes              enable row level security;
alter table safety_escalations    enable row level security;
alter table fiduciary_documents   enable row level security;
alter table subscriptions         enable row level security;

-- Reference data: readable by any signed-in user, written only by the server.
create policy ref_read_spine  on spine_categories for select to authenticated using (true);
create policy ref_read_mcc    on mcc_categories   for select to authenticated using (true);
create policy ref_read_scams  on known_scams      for select to authenticated using (true);
create policy ref_read_config on app_config       for select to authenticated using (true);
create policy ref_read_agmap  on alert_group_map  for select to authenticated using (true);

-- profiles: your own row, plus the profile of anyone you are linked to in
-- either direction (so both sides can show a real name).
create policy profiles_self_read on profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from member_navigator mn
      where mn.status in ('active','invited')
        and ((mn.member_id = profiles.id and mn.navigator_id = auth.uid())
          or (mn.navigator_id = profiles.id and mn.member_id = auth.uid()))
    )
  );
create policy profiles_self_write on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_self_insert on profiles for insert to authenticated
  with check (id = auth.uid());

-- member_navigator: either side of the row.
create policy mn_read on member_navigator for select to authenticated
  using (member_id = auth.uid() or navigator_id = auth.uid());
create policy mn_navigator_write on member_navigator for insert to authenticated
  with check (navigator_id = auth.uid());
create policy mn_update on member_navigator for update to authenticated
  using (member_id = auth.uid() or navigator_id = auth.uid())
  with check (member_id = auth.uid() or navigator_id = auth.uid());

-- Money-shaped member data: the member, or a navigator at level >= 2.
do $$
declare t text;
begin
  foreach t in array array[
    'accounts','member_cards','budget_lines','transactions','blocks',
    'merchant_rules','income_schedules','predicted_deposits','savings_goals',
    'activity_log','transfers','disputes','home_cards'
  ] loop
    execute format(
      'create policy %1$s_read on %1$s for select to authenticated
         using (member_id in (select auth_visible_members()))', t);
    execute format(
      'create policy %1$s_write on %1$s for insert to authenticated
         with check (member_id in (select auth_visible_members()))', t);
    execute format(
      'create policy %1$s_update on %1$s for update to authenticated
         using (member_id in (select auth_visible_members()))
         with check (member_id in (select auth_visible_members()))', t);
  end loop;
end $$;

-- member_facts exist only to gate questions and are shown to nobody as a list
-- (Appendix A §3.5). The member may read his own; navigators may not.
create policy member_facts_self on member_facts for select to authenticated
  using (member_id = auth.uid());

-- Consents: the member and the proposer.
create policy consents_read on consents for select to authenticated
  using (member_id = auth.uid() or proposed_by = auth.uid()
         or auth_is_navigator_of(member_id));
create policy consents_insert on consents for insert to authenticated
  with check (proposed_by = auth.uid()
              and (member_id = auth.uid() or auth_is_navigator_of(member_id)));
create policy consents_update on consents for update to authenticated
  using (member_id = auth.uid() or proposed_by = auth.uid())
  with check (member_id = auth.uid() or proposed_by = auth.uid());

-- The Member never sees the Navigator's alert settings (Appendix B rule 2).
create policy alerts_own on alerts for select to authenticated
  using (navigator_id = auth.uid());
create policy alerts_update on alerts for update to authenticated
  using (navigator_id = auth.uid()) with check (navigator_id = auth.uid());
create policy alert_prefs_own on alert_prefs for all to authenticated
  using (navigator_id = auth.uid()) with check (navigator_id = auth.uid());
create policy quiet_hours_own on quiet_hours for all to authenticated
  using (navigator_id = auth.uid()) with check (navigator_id = auth.uid());

-- Member notifications are the member's own.
create policy member_notifications_own on member_notifications for all to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy push_tokens_own on push_tokens for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Chat. At level 1 the help thread is private to the member; from level 2 the
-- navigator shares it. The navigator_private thread is always shared.
create policy chat_threads_read on chat_threads for select to authenticated
  using (
    member_id = auth.uid()
    or (kind = 'navigator_private' and auth_is_navigator_of(member_id))
    or (kind = 'help' and auth_is_navigator_of(member_id)
        and coalesce(auth_level_for(member_id), 1) >= 2)
  );
create policy chat_threads_insert on chat_threads for insert to authenticated
  with check (member_id = auth.uid() or auth_is_navigator_of(member_id));

create policy chat_messages_read on chat_messages for select to authenticated
  using (exists (select 1 from chat_threads t where t.id = thread_id));
create policy chat_messages_insert on chat_messages for insert to authenticated
  with check (exists (select 1 from chat_threads t where t.id = thread_id));
create policy chat_messages_update on chat_messages for update to authenticated
  using (exists (select 1 from chat_threads t where t.id = thread_id))
  with check (exists (select 1 from chat_threads t where t.id = thread_id));

-- The navigator's own external bank. Her money never sits in the system.
create policy linked_banks_own on linked_banks for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy subscriptions_own on subscriptions for all to authenticated
  using (navigator_id = auth.uid()) with check (navigator_id = auth.uid());

create policy fiduciary_docs_read on fiduciary_documents for all to authenticated
  using (member_id = auth.uid() or navigator_id = auth.uid())
  with check (member_id = auth.uid() or navigator_id = auth.uid());

-- Safety escalations go to Ability Wallet support. The member may create one
-- (through the AI); nobody in the app reads them back.
create policy safety_insert on safety_escalations for insert to authenticated
  with check (member_id = auth.uid());

-- outbound_messages is server-only: no policy, so nothing is readable.

-- -------------------------------------------------------------- grants -----
-- Policies do not grant. Without these, every query fails with 42501.

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on spine_categories, mcc_categories, known_scams, app_config, alert_group_map to anon;
grant execute on all functions in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;

-- outbound_messages and safety_escalations stay server-side.
revoke all on outbound_messages from authenticated, anon;
revoke select on safety_escalations from authenticated, anon;
