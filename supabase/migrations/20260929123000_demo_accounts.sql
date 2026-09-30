-- Whether the two fake demo accounts are loaded. Callable before sign-in so
-- the welcome screen can offer a way straight into them; it returns only a
-- boolean, never an address or anything else.
--
-- When Eric wipes the test accounts, this goes false and the shortcut
-- disappears on its own.

create or replace function demo_accounts_loaded()
returns boolean
language sql stable security definer set search_path = public as $$
  select count(*) = 2 from auth.users
   where email in ('alex@example.com', 'maria@example.com');
$$;

grant execute on function demo_accounts_loaded() to anon, authenticated;
