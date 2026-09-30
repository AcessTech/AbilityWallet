-- Ability Wallet — alerts, chat, money movement. Appendix B, brief §4.

-- --------------------------------------------------------------- alerts ----
-- Generated server-side. The app renders them; it never computes them
-- (Appendix B ground rule 8). Every alert lands in Activity regardless of
-- routing — routing configures interruption, not knowledge.

create table alerts (
  id           uuid primary key default gen_random_uuid(),
  navigator_id uuid not null references profiles(id) on delete cascade,
  member_id    uuid not null references profiles(id) on delete cascade,
  code         text not null check (code ~ '^A([1-9]|1[0-9]|2[0-2])$'),
  grp          alert_group not null,
  title        text not null,
  payload      jsonb not null default '{}',
  channels_sent notify_channel[] not null default '{}',
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  delivered_at timestamptz
);

create index alerts_navigator_idx on alerts(navigator_id, created_at desc);
create index alerts_member_idx    on alerts(member_id, created_at desc);

-- Which alert code belongs to which routing group (Appendix B routing table).
create table alert_group_map (
  code text primary key,
  grp  alert_group not null,
  min_level int not null default 2,
  push_default boolean not null default false,
  can_turn_off boolean not null default true,
  wording text not null
);

-- Per-group channel routing, the PagerDuty model (Appendix A §6.7).
create table alert_prefs (
  navigator_id uuid not null references profiles(id) on delete cascade,
  grp          alert_group not null,
  channels     notify_channel[] not null default '{in_app}',
  primary key (navigator_id, grp)
);

create table quiet_hours (
  navigator_id uuid primary key references profiles(id) on delete cascade,
  enabled      boolean not null default false,
  starts_at    time not null default '22:00',
  ends_at      time not null default '07:00'
);

-- Member push notifications. Lock-screen copy never carries amounts,
-- merchants or declines (Appendix B ground rule 5).
create table member_notifications (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references profiles(id) on delete cascade,
  code        text not null,              -- B1a..B7
  lock_text   text not null,              -- what the lock screen may show
  in_app_text text not null,              -- what the app shows once opened
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create index member_notifications_idx on member_notifications(member_id, created_at desc);

-- Expo push tokens, one row per device.
create table push_tokens (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token      text not null unique,
  platform   text not null default 'ios',
  created_at timestamptz not null default now()
);

-- Text and email that would have gone out. No text-message service is
-- connected (brief §5 item 4), so those are logged, not sent.
create table outbound_messages (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  channel    notify_channel not null,
  to_address text not null,
  subject    text,
  body       text not null,
  sent       boolean not null default false,
  reason_not_sent text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- chat ----
-- One Help thread: Navigator and AI share the conversation with the Member.
-- At level 1 the AI thread is private and the Navigator is a separate 1:1.

create table chat_threads (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references profiles(id) on delete cascade,
  kind        thread_kind not null default 'help',
  created_at  timestamptz not null default now(),
  unique (member_id, kind)
);

create table chat_messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references chat_threads(id) on delete cascade,
  sender        msg_sender not null,
  sender_id     uuid references profiles(id) on delete set null,
  body          text not null default '',
  -- An action the AI proposed. It executes only on an in-chat confirmation
  -- tap, only within existing permissions, and every execution is logged.
  action        jsonb,
  action_status msg_action_status,
  txn_id        uuid references transactions(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index chat_messages_thread_idx on chat_messages(thread_id, created_at);

-- ---------------------------------------------------------------- money ----
-- The Navigator's money never sits in the system: sends are funded from her
-- linked external bank (brief §2 rule 10).

create table linked_banks (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles(id) on delete cascade,
  institution  text not null,
  last4        text not null,
  account_type text not null default 'checking',
  is_default   boolean not null default true,
  created_at   timestamptz not null default now()
);

create table transfers (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid not null references profiles(id) on delete cascade,
  from_account_id  uuid references accounts(id) on delete set null,
  to_account_id    uuid references accounts(id) on delete set null,
  from_linked_bank uuid references linked_banks(id) on delete set null,
  amount           numeric(12,2) not null check (amount > 0),
  memo             text,
  initiated_by     uuid references profiles(id) on delete set null,
  status           transfer_status not null default 'completed',
  -- A repeating monthly send (decided Sep 23).
  repeats_monthly  boolean not null default false,
  next_run_on      date,
  created_at       timestamptz not null default now(),
  -- Exactly one source: an internal account or an external linked bank.
  constraint transfer_has_one_source check (
    (from_account_id is not null) <> (from_linked_bank is not null)
  )
);

create index transfers_member_idx on transfers(member_id, created_at desc);

create table disputes (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references profiles(id) on delete cascade,
  transaction_id uuid not null references transactions(id) on delete cascade,
  opened_via     text not null default 'chat',
  kind           dispute_kind not null,
  reason         text not null default '',
  status         dispute_status not null default 'open',
  created_at     timestamptz not null default now()
);

create index disputes_member_idx on disputes(member_id, created_at desc);

-- Safety escalations go to Ability Wallet support and NEVER to the Navigator
-- (decided Sep 23).
create table safety_escalations (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references profiles(id) on delete cascade,
  note       text not null,
  status     text not null default 'open',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------- level 5 paperwork ----
-- Fiduciary requires SSA documents (prototype n_l5_* screens).

create table fiduciary_documents (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references profiles(id) on delete cascade,
  navigator_id uuid not null references profiles(id) on delete cascade,
  doc_type     text not null,
  file_path    text,
  status       text not null default 'needed'
                 check (status in ('needed','uploaded','under_review','approved','rejected')),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- Subscription and billing live in the Navigator's Account (decided Sep 23).
create table subscriptions (
  id           uuid primary key default gen_random_uuid(),
  navigator_id uuid not null references profiles(id) on delete cascade,
  plan         text not null default 'family',
  price_cents  int  not null default 0,
  status       text not null default 'active',
  renews_on    date,
  created_at   timestamptz not null default now()
);
