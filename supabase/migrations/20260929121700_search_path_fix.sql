-- pgcrypto lives in the `extensions` schema on Supabase, so gen_random_bytes
-- is not on the search path of a function pinned to `public`. The invite
-- functions are the two that need it.
alter function create_member_invite(text, text, text, date, jsonb, jsonb, int, boolean)
  set search_path = public, extensions;
alter function resend_member_invite(uuid)
  set search_path = public, extensions;
