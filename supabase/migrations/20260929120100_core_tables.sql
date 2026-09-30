-- Ability Wallet — people, accounts, money and the category spine.

-- ------------------------------------------------------------- profiles ----

create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           app_role    not null,
  first_name     text        not null default '',
  last_name      text        not null default '',
  email          text,
  phone          text,
  dob            date,
  address_line1  text,
  address_line2  text,
  city           text,
  state          text,
  postal_code    text,
  -- Member settings. Levels never appear on the Member's side of the app.
  reading_level      text    not null default 'standard',
  ai_helper_enabled  boolean not null default false,
  auto_move_enabled  boolean not null default false,
  face_id_enabled    boolean not null default false,
  onboarding_done    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index profiles_role_idx on profiles(role);

comment on column profiles.reading_level is
  'Swaps body copy only. Decided Sep 23: it does not change how the AI writes.';

-- ------------------------------------------------- member <-> navigator ----
-- Supports several members per navigator ("People I support") and, later, a
-- second navigator on one member.

create table member_navigator (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references profiles(id) on delete cascade,
  navigator_id uuid          references profiles(id) on delete cascade,
  level        int  not null default 2 check (level between 1 and 5),
  status       link_status not null default 'invited',
  is_primary   boolean not null default true,
  -- Invite lifecycle (alerts A18-A20). The invite goes by email.
  invite_email        text,
  invite_token        text unique,
  invite_sent_at      timestamptz,
  invite_expires_at   timestamptz,
  invite_dob_attempts int not null default 0,
  started_at   timestamptz,
  ended_at     timestamptz,
  created_at   timestamptz not null default now()
);

create index member_navigator_member_idx    on member_navigator(member_id);
create index member_navigator_navigator_idx on member_navigator(navigator_id);
create unique index member_navigator_active_pair_idx
  on member_navigator(member_id, navigator_id)
  where status in ('invited','active');

-- ------------------------------------------------------------- accounts ----
-- Simulated ledger. A real card ledger also needs pending vs posted balances;
-- not modelled in the MVP.

create table accounts (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references profiles(id) on delete cascade,
  kind         account_kind not null,
  name         text not null,
  balance      numeric(12,2) not null default 0,
  program_name text,                    -- ABLE: the state program
  -- Back-payment balances carry their own 9-month exclusion clock
  -- (POMS SI 01130.600).
  exclusion_ends_on date,
  created_at   timestamptz not null default now()
);

create index accounts_member_idx on accounts(member_id);
create unique index accounts_one_per_kind_idx
  on accounts(member_id, kind) where kind in ('checking','able','emergency','ebt');

-- ----------------------------------------------------- category spine ------
-- The 14-category spine. Data, not code. `qde` is null for the
-- categories that can never be a qualified disability expense.

create table spine_categories (
  id            text primary key,          -- stable key, e.g. 'housing'
  member_word   text not null,             -- what the MEMBER sees: "Home"
  navigator_word text not null,            -- the industry word: "Housing"
  qde           text,                      -- QDE bucket name, null if not QDE-eligible
  sub_labels    text[] not null default '{}',
  budgetable    boolean not null default true,
  sort_order    int not null
);

-- --------------------------------------------------------------- cards -----

create table member_cards (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references profiles(id) on delete cascade,
  last4        text not null,
  brand        text not null default 'Visa',
  expires_on   date not null,
  status       card_status not null default 'not_ordered',
  paused_by    uuid references profiles(id),
  paused_at    timestamptz,
  shipped_at   timestamptz,
  delivered_at timestamptz,
  created_at   timestamptz not null default now()
);

create index member_cards_member_idx on member_cards(member_id);

-- --------------------------------------------------------- budget lines ----
-- The unified model: the goal, the budget and the limit are
-- one object; the mode changes what happens at the line. Spend is DERIVED from
-- the ledger, never stored, so it cannot drift.

create table budget_lines (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references profiles(id) on delete cascade,
  category       text not null,          -- spine id or a custom label
  display_name   text not null,
  amount         numeric(12,2) not null check (amount >= 0),
  period         budget_period not null default 'month',
  mode           budget_mode   not null default 'guide',
  -- A tightening awaiting the Member's Yes. The OLD value stays live until
  -- he answers.
  pending_change jsonb,
  sort_order     int not null default 0,
  archived_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index budget_lines_member_idx on budget_lines(member_id) where archived_at is null;

-- --------------------------------------------------------- transactions ----

create table transactions (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references profiles(id) on delete cascade,
  account_id      uuid not null references accounts(id) on delete cascade,
  merchant        text not null,
  merchant_key    text not null,          -- cleaned descriptor, for "new payee" and rules
  mcc             text,
  amount          numeric(12,2) not null, -- negative = money out, positive = money in
  status          txn_status not null default 'posted',
  -- Stored in the alert's exact wording ("over the Games limit"); templates
  -- must not prefix it with "more than the".
  declined_reason text,
  category        text,
  qde_category    text,
  qde_confidence  confidence,
  needs_answer    boolean not null default false,
  budget_line_id  uuid references budget_lines(id) on delete set null,
  rail            text not null default 'card',   -- card | ach | internal | atm
  receipt_path    text,
  occurred_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index transactions_member_time_idx on transactions(member_id, occurred_at desc);
create index transactions_account_idx     on transactions(account_id);
create index transactions_merchant_idx    on transactions(member_id, merchant_key);

-- --------------------------------------------------------------- blocks ----
-- Merchant and category blocks. Always firm, any level, dual consent to remove.

create table blocks (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references profiles(id) on delete cascade,
  kind        block_kind not null,
  target      text not null,             -- merchant_key, or an MCC group id
  label       text not null,
  status      block_status not null default 'pending_add',
  agreed_by   uuid[] not null default '{}',
  attempts_stopped int not null default 0,
  since       timestamptz,
  created_at  timestamptz not null default now()
);

create index blocks_member_idx on blocks(member_id) where status = 'active';

-- Always enforced, not per member, not configurable.
create table known_scams (
  id           uuid primary key default gen_random_uuid(),
  merchant_key text not null unique,
  label        text not null,
  added_at     timestamptz not null default now()
);

-- MCC groups that back the category blocks and the QDE tier-1 assignment.
create table mcc_categories (
  mcc          text primary key,
  description  text not null,
  spine_id     text references spine_categories(id),
  candidate_qde text,
  auto_assign  boolean not null default false,  -- QDE tier 1: assign, do not ask
  block_group  text                              -- gambling | bars | dating | smoke | money_transfer
);

create index mcc_block_group_idx on mcc_categories(block_group) where block_group is not null;
