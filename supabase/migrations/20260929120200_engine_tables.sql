-- Ability Wallet — the decision-card engine's tables. Appendix A §3.

-- ----------------------------------------------------------- home_cards ----
-- The single card slot at the top of the Member's Home. Shape matches the
-- HomeCard interface in Appendix A §3 exactly.

create table home_cards (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references profiles(id) on delete cascade,
  cls           card_class not null,
  kind          text,               -- ConsentKind | SSI_SWEEP | HOUSING_TIMER | DECLINE_EXPLAIN | CARD_PAUSED | LEVEL_DOWN | RULE_RELAXED
  headline      text not null,      -- rendered verbatim
  body          text not null,      -- one sentence
  txn_id        uuid references transactions(id) on delete cascade,
  proposal_id   uuid,               -- consents.id
  suggested_amount numeric(12,2),
  payload       jsonb not null default '{}',
  state         card_state not null default 'queued',
  created_at    timestamptz not null default now(),
  expires_at    timestamptz,
  shown_at      timestamptz,
  answered_at   timestamptz
);

create index home_cards_pending_idx
  on home_cards(member_id, cls, created_at)
  where state in ('queued','shown');

-- One open SSI sweep / housing timer at a time.
create unique index home_cards_one_sentinel_idx
  on home_cards(member_id, kind)
  where cls = 'SENTINEL' and state in ('queued','shown');

-- One QDE offer per transaction, ever (idempotency for the nightly jobs).
create unique index home_cards_one_per_txn_idx
  on home_cards(txn_id, cls) where txn_id is not null;

-- ------------------------------------------------------- merchant_rules ----
-- "Ask once, remember forever". Visible to both parties in Account ->
-- "What we agreed" (Appendix A §3).

create table merchant_rules (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references profiles(id) on delete cascade,
  merchant_key  text not null,
  merchant_label text not null,
  category      text,
  qde           text,
  auto_reimburse boolean not null default false,
  ask           boolean not null default false,
  source        text not null check (source in ('member_answer','navigator_set','engine_high_confidence')),
  created_at    timestamptz not null default now(),
  unique (member_id, merchant_key)
);

-- --------------------------------------------------------- member_facts ----
-- What licenses a question (Appendix A §3.5). Inferred from money movement,
-- never from a questionnaire. Shown to nobody as a list.

create table member_facts (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references profiles(id) on delete cascade,
  key         text not null check (key in
                ('pays_housing','housing_payee','has_phone_plan','has_vehicle',
                 'receives_ssi','receives_wages')),
  value       text not null,
  source      text not null check (source in
                ('recurring_stream','signup_data','deposit_match','member_answer')),
  fact_confidence confidence not null default 'MEDIUM',
  -- A fact that keeps getting "No" answers suppresses its question type.
  suppressed_until date,
  no_answer_count  int not null default 0,
  since       timestamptz not null default now(),
  unique (member_id, key)
);

-- ----------------------------------------------------- income_schedules ----
-- SSI / SSDI / wage prediction inputs (Appendix A §2.7).

create table income_schedules (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references profiles(id) on delete cascade,
  source       text not null,
  merchant_key text not null,
  kind         income_kind not null,
  amount       numeric(12,2) not null,
  -- SSI: first of month. SSDI: birth-date Wednesday, or the 3rd for pre-May-1997
  -- and concurrent recipients. Wages: learned cadence.
  rule         jsonb not null default '{}',
  prediction_confidence confidence not null default 'MEDIUM',
  cycles_seen  int not null default 0,
  last_seen_on date,
  created_at   timestamptz not null default now(),
  unique (member_id, merchant_key)
);

-- Materialised predictions the Save tab renders. Rebuilt nightly.
create table predicted_deposits (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references profiles(id) on delete cascade,
  schedule_id   uuid references income_schedules(id) on delete cascade,
  source        text not null,
  amount        numeric(12,2) not null,
  expected_on   date not null,
  prediction_confidence confidence not null default 'MEDIUM',
  created_at    timestamptz not null default now(),
  unique (schedule_id, expected_on)
);

create index predicted_deposits_member_idx on predicted_deposits(member_id, expected_on);

-- ------------------------------------------------------- savings goals -----
-- Saving TOWARD a target (Save tab). A different object from a budget line.
-- "Goals only exist when you both agree."

create table savings_goals (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references profiles(id) on delete cascade,
  name        text not null,
  target      numeric(12,2) not null check (target > 0),
  saved       numeric(12,2) not null default 0,
  account_id  uuid references accounts(id) on delete set null,
  agreed_by   uuid[] not null default '{}',
  reached_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index savings_goals_member_idx on savings_goals(member_id);

-- ------------------------------------------------------------ consents -----
-- TIGHTEN = ask first. LOOSEN = apply now and notify (brief §2 rule 3).

create table consents (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references profiles(id) on delete cascade,
  proposed_by  uuid not null references profiles(id) on delete cascade,
  kind         consent_kind not null,
  payload      jsonb not null default '{}',
  status       consent_status not null default 'pending',
  answered_at  timestamptz,
  expires_at   timestamptz not null default (now() + interval '30 days'),
  created_at   timestamptz not null default now()
);

create index consents_member_idx on consents(member_id, status);

-- A Navigator cannot stack proposals: one open consent per subtype per
-- proposer (Appendix A §2.2, server-enforced).
create unique index consents_one_open_per_subtype_idx
  on consents(member_id, proposed_by, kind) where status = 'pending';

-- ------------------------------------------------------- activity log ------
-- Every card creation, display, answer and expiry, and every Navigator action,
-- lands here. Immutable; the Member can read all of it (Appendix A §4.1).

create table activity_log (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references profiles(id) on delete cascade,
  actor_id    uuid references profiles(id) on delete set null,
  actor_kind  text not null default 'system' check (actor_kind in ('member','navigator','ai','system')),
  event       text not null,
  detail      text not null default '',
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index activity_log_member_idx on activity_log(member_id, created_at desc);
