-- The invite link is opened by someone who is not signed in yet, so the
-- lookup that tells them whose invite it is must be callable by anon.
grant execute on function peek_invite(text) to anon;
