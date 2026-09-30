/**
 * End-to-end check of the backend, run from the command line.
 *
 * Creates two throwaway accounts, walks the invite flow, fires transactions
 * through the simulator, and prints what the engine produced. Deletes both
 * accounts and all their data at the end, so the database is left empty.
 *
 *   SUPABASE_DB_PASSWORD=… node scripts/smoke.mjs
 */
import fs from 'node:fs';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const ref = URL_.match(/https:\/\/([a-z0-9]+)\./)[1];

const stamp = Date.now();
const navEmail = `smoke.nav.${stamp}@example.com`;
const memEmail = `smoke.mem.${stamp}@example.com`;
const PW = 'smoke-test-pw-12345';

const client = () => createClient(URL_, KEY, { auth: { persistSession: false } });
const ok = (label, e) => {
  if (e) { console.error('✗', label, e.message ?? e); process.exitCode = 1; throw e; }
  console.log('✓', label);
};

const db = new pg.Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${ref}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await db.connect();

  /* ---- Navigator signs up and invites a Member ------------------------- */
  const nav = client();
  {
    const { error } = await nav.auth.signUp({
      email: navEmail, password: PW,
      options: { data: { role: 'navigator', first_name: 'Nav', last_name: 'Tester' } },
    });
    ok('navigator signed up', error);
  }

  const { data: ctx } = await nav.rpc('my_context');
  ok('my_context returns a navigator profile', ctx?.profile?.role === 'navigator' ? null : new Error(JSON.stringify(ctx)));

  const { data: invite, error: invErr } = await nav.rpc('create_member_invite', {
    p_first_name: 'Mem', p_last_name: 'Tester', p_email: memEmail,
    p_dob: '1990-04-12',
    p_address: { line1: '1 Test St', city: 'Columbus', state: 'OH', postal_code: '43201' },
    p_ship: null, p_level: 4, p_send: true,
  });
  ok('invite created', invErr);

  const { data: peek } = await nav.rpc('peek_invite', { p_token: invite.token });
  ok('invite reads back as ok', peek?.state === 'ok' ? null : new Error(JSON.stringify(peek)));

  /* ---- Member accepts --------------------------------------------------- */
  const mem = client();
  {
    const { error } = await mem.auth.signUp({
      email: memEmail, password: PW,
      options: { data: { role: 'member', first_name: 'Mem', last_name: 'Tester' } },
    });
    ok('member signed up', error);
  }

  const { data: wrongDob } = await mem.rpc('verify_invite_dob', {
    p_token: invite.token, p_dob: '1980-01-01',
  });
  ok('wrong date of birth is refused', wrongDob?.ok === false ? null : new Error('should have failed'));

  const { data: rightDob } = await mem.rpc('verify_invite_dob', {
    p_token: invite.token, p_dob: '1990-04-12',
  });
  ok('right date of birth passes', rightDob?.ok ? null : new Error(JSON.stringify(rightDob)));

  const { data: accepted, error: accErr } = await mem.rpc('accept_member_invite', { p_token: invite.token });
  ok('invite accepted', accErr ?? (accepted?.ok ? null : new Error(JSON.stringify(accepted))));

  const memberId = (await mem.auth.getUser()).data.user.id;
  const navId = (await nav.auth.getUser()).data.user.id;

  const { data: accounts } = await mem.from('accounts').select('kind,balance');
  ok(`accounts opened (${accounts.map((a) => a.kind).join(', ')})`,
     accounts.length === 3 ? null : new Error(JSON.stringify(accounts)));

  /* ---- Money in, budget lines, and a decline ---------------------------- */
  await db.query(`select simulate_deposit($1,'Social Security',994)`, [memberId]);
  await db.query(`select simulate_deposit($1,'Social Security',994, now() - interval '1 month')`, [memberId]);
  ok('two Social Security deposits posted');

  await db.query(
    `insert into budget_lines (member_id, category, display_name, amount, period, mode, sort_order)
     values ($1,'fun','Games',50,'month','stop',1), ($1,'groceries','Groceries',200,'month','guide',2)`,
    [memberId]);
  ok('budget lines created (Games is a stop line)');

  const { rows: [buy] } = await db.query(
    `select simulate_purchase($1,'GameStop','5816',72.50) as r`, [memberId]);
  ok(`GameStop $72.50 declined — "${buy.r.declined_reason}"`,
     buy.r.status === 'declined' && buy.r.declined_reason === 'over the Games limit'
       ? null : new Error(JSON.stringify(buy.r)));

  const { rows: [ok1] } = await db.query(
    `select simulate_purchase($1,'Save-Mart Grocery','5411',32.18) as r`, [memberId]);
  ok('Save-Mart $32.18 posted', ok1.r.status === 'posted' ? null : new Error(JSON.stringify(ok1.r)));

  /* ---- The QDE offer ---------------------------------------------------- */
  await db.query(`update accounts set balance = 6240 where member_id = $1 and kind = 'able'`, [memberId]);
  await db.query(
    `insert into member_facts (member_id, key, value, source, fact_confidence)
     values ($1,'pays_housing','true','recurring_stream','HIGH')
     on conflict (member_id, key) do nothing`, [memberId]);
  const { rows: [hd] } = await db.query(
    `select simulate_purchase($1,'Hardware Depot','5200',41.30) as r`, [memberId]);
  ok('Hardware Depot $41.30 posted', hd.r.status === 'posted' ? null : new Error(JSON.stringify(hd.r)));

  const { data: home } = await mem.rpc('member_home');
  ok(`Home card is the Hardware Depot question — "${home?.card?.headline}"`,
     home?.card?.cls === 'QDE_OFFER' ? null : new Error(JSON.stringify(home?.card)));
  ok(`decline notice is showing above it — "${home?.notice?.headline}"`,
     home?.notice?.kind === 'DECLINE_EXPLAIN' ? null : new Error(JSON.stringify(home?.notice)));
  console.log('   notice body:', home.notice.body);

  const { data: answered, error: ansErr } = await mem.rpc('answer_home_card', {
    p_card: home.card.id, p_yes: true,
  });
  ok(`answered Yes — ABLE reimbursed $${answered?.amount}`,
     ansErr ?? (answered?.reimbursed ? null : new Error(JSON.stringify(answered))));

  const { data: again } = await mem.rpc('answer_home_card', { p_card: home.card.id, p_yes: true });
  ok('answering twice does nothing the second time', again?.already ? null : new Error('not idempotent'));

  /* ---- The Navigator's side --------------------------------------------- */
  const { data: nhome, error: nhErr } = await nav.rpc('navigator_home', { p_member: memberId });
  ok(`navigator_home loads at level ${nhome?.level}`, nhErr);
  ok(`her latest alert is "${nhome?.alert?.title}"`, nhome?.alert ? null : new Error('no alert'));
  ok(`she sees ${nhome?.budget?.length} budget lines and $${nhome?.accounts?.[0]?.balance} in checking`,
     nhome?.accounts?.length ? null : new Error('no accounts'));

  const { data: declines } = await nav
    .from('transactions').select('merchant,amount,declined_reason')
    .eq('status', 'declined');
  ok(`her declined view reads "${declines?.[0]?.merchant} — ${declines?.[0]?.declined_reason}"`,
     declines?.length ? null : new Error('no declines visible'));

  /* ---- RLS: a stranger sees nothing -------------------------------------- */
  const stranger = client();
  await stranger.auth.signUp({
    email: `smoke.other.${stamp}@example.com`, password: PW,
    options: { data: { role: 'navigator', first_name: 'Other', last_name: 'Tester' } },
  });
  const { data: leaked } = await stranger.from('transactions').select('id');
  ok(`a stranger sees ${leaked?.length ?? 0} transactions`,
     (leaked?.length ?? 0) === 0 ? null : new Error('RLS leak'));

  /* ---- Consent: tighten asks first --------------------------------------- */
  const { data: lines } = await nav.from('budget_lines').select('id,display_name,amount')
    .eq('member_id', memberId).eq('category', 'groceries');
  const { data: tighten } = await nav.rpc('propose_budget_change', {
    p_line: lines[0].id, p_amount: 120, p_mode: 'stop',
  });
  ok('tightening Groceries asks him first', tighten?.needs_consent ? null : new Error(JSON.stringify(tighten)));

  const { data: stillLive } = await nav.from('budget_lines').select('amount').eq('id', lines[0].id).single();
  ok(`the old $${stillLive.amount} stays live until he answers`,
     Number(stillLive.amount) === 200 ? null : new Error('old value changed'));

  const { data: home2 } = await mem.rpc('member_home');
  ok(`his Home now asks "${home2?.card?.headline}"`,
     home2?.card?.cls === 'CONSENT' ? null : new Error(JSON.stringify(home2?.card)));
  console.log('   card body:', home2.card.body);

  await mem.rpc('answer_home_card', { p_card: home2.card.id, p_yes: true });
  const { data: applied } = await nav.from('budget_lines').select('amount,mode').eq('id', lines[0].id).single();
  ok(`after Yes it is $${applied.amount} on a ${applied.mode} line`,
     Number(applied.amount) === 120 && applied.mode === 'stop' ? null : new Error(JSON.stringify(applied)));

  /* ---- Loosening applies at once ----------------------------------------- */
  const { data: loosen } = await nav.rpc('propose_budget_change', {
    p_line: lines[0].id, p_amount: 260, p_mode: 'guide',
  });
  ok('loosening applies straight away', loosen?.applied ? null : new Error(JSON.stringify(loosen)));

  console.log('\nAll checks passed.');
  return { memberId, navId };
}

let ids;
try {
  ids = await main();
} finally {
  const { rows } = await db.query(
    `delete from auth.users where email like 'smoke.%@example.com' returning id`);
  console.log(`\nCleaned up ${rows.length} throwaway accounts. Database is empty again.`);
  const { rows: left } = await db.query(`select count(*)::int as n from profiles`);
  console.log(`profiles remaining: ${left[0].n}`);
  await db.end();
}
