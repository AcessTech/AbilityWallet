-- Ability Wallet — enums, config and reference data.
-- Brief §4 (data model), Appendix A §4.5 (all thresholds are config, not code).

create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

-- ---------------------------------------------------------------- enums ----

create type app_role          as enum ('member','navigator');
create type link_status       as enum ('invited','active','ended','locked','expired');
create type account_kind      as enum ('checking','able','emergency','ebt','backpayment');
create type txn_status        as enum ('posted','declined','pending');
create type budget_period     as enum ('day','week','month');
create type budget_mode       as enum ('guide','alert','stop');
create type block_kind        as enum ('merchant','category');
create type block_status      as enum ('active','pending_add','pending_remove','ended');
create type card_class        as enum ('ABLE_ANSWER','CONSENT','SENTINEL','QDE_OFFER','INCOME_TAG','NOTICE');
create type card_state        as enum ('queued','shown','answered_yes','answered_no','dismissed','expired','withdrawn');
create type consent_kind      as enum ('LEVEL_UP','LIMIT_CHANGE','BLOCK_ADD','BLOCK_REMOVE','GOAL_PROPOSAL','ABLE_ROLLOVER','SUCCESSOR','AUTO_MOVE','AI_HELPER_ON');
create type consent_status    as enum ('pending','approved','declined','withdrawn','expired');
create type confidence        as enum ('LOW','MEDIUM','HIGH');
create type thread_kind       as enum ('help','navigator_private');
create type msg_sender        as enum ('member','navigator','ai','system');
create type msg_action_status as enum ('pending','confirmed','declined','expired');
create type transfer_status   as enum ('pending','completed','failed','scheduled');
create type dispute_kind      as enum ('fraud','other');
create type dispute_status    as enum ('open','under_review','resolved','withdrawn');
create type card_status       as enum ('not_ordered','ordered','shipped','delivered','active','paused','lost','stolen','replaced');
create type income_kind       as enum ('ssi','ssdi','wages','other');
create type alert_group       as enum ('card_safety','declines','limits','money','benefits','questions','setup');
create type notify_channel    as enum ('push','text','email','in_app');

-- Support levels are integers 1-5 everywhere. The MEMBER NEVER SEES THESE
-- (brief §2 rule 1); they surface only on the Navigator's Plan tab.
--   1 Independent · 2 Monitored · 3 Flexible limits · 4 Firm limits · 5 Fiduciary

-- --------------------------------------------------------------- config ----
-- Appendix A §4.5: SSI limit, BUFFER, MIN_ASK, daily cap and expiry windows
-- are versioned config because the real-world numbers change annually.

create table app_config (
  key         text primary key,
  value       jsonb       not null,
  note        text,
  updated_at  timestamptz not null default now()
);

insert into app_config (key, value, note) values
  ('ssi_resource_limit',        '2000',   'SSI individual resource limit, 20 CFR 416.1205 (2026)'),
  ('ssi_couple_limit',          '3000',   'SSI couple resource limit'),
  ('ssi_buffer',                '100',    'BUFFER: raise the sentinel this far below the limit'),
  ('ssi_safe_line',             '1900',   'Auto-move leaves this much in checking (limit minus buffer)'),
  ('able_annual_contribution',  '20000',  'ABLE contribution cap, 2026'),
  ('able_resource_exclusion',   '100000', 'ABLE balance excluded from SSI resources up to this'),
  ('qde_min_ask',               '15',     'MIN_ASK: do not interrupt for purchases under this'),
  ('daily_question_cap',        '1',      'Max transaction-derived questions per day'),
  ('qde_offer_expiry_days',     '25',     'QDE_OFFER expires after this many days'),
  ('income_tag_expiry_days',    '14',     'INCOME_TAG defaults to best guess after this'),
  ('consent_expiry_days',       '30',     'Consents auto-decline after this'),
  ('invite_expiry_days',        '7',      'Setup invite link lifetime'),
  ('backpayment_exclusion_months','9',    'Back payments excluded from resources, POMS SI 01130.600'),
  ('low_balance_default',       '100',    'A2 low-balance alert threshold'),
  ('low_balance_rearm',         '25',     'A2 re-arms once the balance rises this far above the threshold'),
  ('housing_timer_days',        '5',      'Housing same-month card raises at this many days left'),
  ('trial_work_month_amount',   '1210',   'A month counts only when wages strictly exceed this'),
  ('burial_fund_exclusion',     '1500',   'Burial funds excluded up to this'),
  ('ai_yield_seconds',          '90',     'AI stays quiet this long after a Navigator message');

create or replace function config_num(p_key text)
returns numeric language sql stable as $$
  select (value #>> '{}')::numeric from app_config where key = p_key;
$$;

create or replace function config_int(p_key text)
returns int language sql stable as $$
  select (value #>> '{}')::int from app_config where key = p_key;
$$;
