/**
 * Loads two fake test accounts so the screens can be walked through with money
 * on them. It runs only when invoked by hand; nothing calls it automatically.
 *
 *   SUPABASE_DB_PASSWORD=… node scripts/seed.mjs          # load
 *   SUPABASE_DB_PASSWORD=… node scripts/seed.mjs --wipe   # remove them again
 *
 * The numbers come from the design, so the phone should look like the
 * drawings: checking $412.55, ABLE $6,240, emergency $150, EBT $187.42, and
 * budget rings reading $96 / $38 / $8 left.
 *
 * Nothing here runs on a real account: it only ever touches the two addresses
 * below.
 */
import fs from 'node:fs';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const MEMBER = { email: 'alex@example.com', first: 'Alex', last: 'Rivera', dob: '1992-03-14' };
const NAVIGATOR = { email: 'maria@example.com', first: 'Maria', last: 'Santos' };
const PASSWORD = 'abilitywallet';
const LEVEL = 4; // Firm limits — the level the design draws.

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const ref = URL_.match(/https:\/\/([a-z0-9]+)\./)[1];

const db = new pg.Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${ref}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});
const client = () => createClient(URL_, KEY, { auth: { persistSession: false } });

/**
 * Transfers must go before linked_banks, or the
 * ON DELETE SET NULL on transfers.from_linked_bank trips the
 * transfer_has_one_source constraint and aborts the wipe.
 */
async function wipe() {
  const { rows } = await db.query(
    `select id from auth.users where email = any($1)`, [[MEMBER.email, NAVIGATOR.email]]);
  if (!rows.length) return 0;
  const ids = rows.map((r) => r.id);
  await db.query(`delete from transfers where member_id = any($1) or initiated_by = any($1)`, [ids]);
  await db.query(`delete from linked_banks where owner_id = any($1)`, [ids]);
  await db.query(`delete from auth.users where id = any($1)`, [ids]);
  return ids.length;
}

async function signUp(person, role) {
  const c = client();
  const { data, error } = await c.auth.signUp({
    email: person.email,
    password: PASSWORD,
    options: { data: { role, first_name: person.first, last_name: person.last } },
  });
  if (error) throw new Error(`${person.email}: ${error.message}`);
  return { client: c, id: data.user.id };
}

/** A date this month, so "this month" numbers land where the design has them. */
function thisMonth(day, hour = 12) {
  const d = new Date();
  d.setDate(day);
  d.setHours(hour, 14, 0, 0);
  return d.toISOString();
}
/** N days back from now, for things that must stay inside a rolling window. */
function daysAgo(n, hour = 15) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 22, 0, 0);
  return d.toISOString();
}
/** N whole months back, on a given day. */
function monthsBack(n, day) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  d.setHours(13, 5, 0, 0);
  return d.toISOString();
}
function lastMonth(day) {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(day);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

async function main() {
  await db.connect();

  const removed = await wipe();
  if (removed) console.log(`Removed ${removed} existing test account(s).`);
  if (process.argv.includes('--wipe')) {
    console.log('Done. The database has no test accounts in it.');
    return;
  }

  /* ---- the two people ---------------------------------------------------- */
  const nav = await signUp(NAVIGATOR, 'navigator');
  const mem = await signUp(MEMBER, 'member');
  console.log(`Created ${NAVIGATOR.first} (navigator) and ${MEMBER.first} (member).`);

  await db.query(
    `update profiles set dob = $2, address_line1 = '2214 Birchwood Ave', city = 'Columbus',
            state = 'OH', postal_code = '43201', email = $3, onboarding_done = true
      where id = $1`, [mem.id, MEMBER.dob, MEMBER.email]);
  await db.query(
    `update profiles set onboarding_done = true, email = $2 where id = $1`,
    [nav.id, NAVIGATOR.email]);

  await db.query(
    `insert into member_navigator (member_id, navigator_id, level, status, started_at)
     values ($1, $2, $3, 'active', now())`, [mem.id, nav.id, LEVEL]);

  await db.query(`select open_member_accounts($1)`, [mem.id]);
  await db.query(`select issue_member_card($1)`, [mem.id]);
  await db.query(
    `insert into accounts (member_id, kind, name, balance, program_name)
     values ($1, 'ebt', 'EBT', 187.42, null)
     on conflict do nothing`, [mem.id]);
  await db.query(
    `update accounts set program_name = 'Ohio STABLE' where member_id = $1 and kind = 'able'`,
    [mem.id]);

  /* ---- Maria's linked bank, so Send money works -------------------------- */
  await db.query(
    `insert into linked_banks (owner_id, institution, last4, account_type, is_default)
     values ($1, 'Chase', '2210', 'checking', true)`, [nav.id]);

  /* ---- budget lines ------------------------------------------------------ */
  // Games is a stop line, which is what makes the $72.50 decline happen.
  await db.query(
    `insert into budget_lines (member_id, category, display_name, amount, period, mode, sort_order)
     values ($1,'groceries','Groceries',150,'month','guide',1),
            ($1,'fun','Fun',120,'month','guide',2),
            ($1,'around','Getting around',60,'month','guide',3),
            ($1,'games','Games',50,'month','stop',4)`, [mem.id]);

  // GameStop belongs to the custom "Games" label, not the Fun line. Custom
  // labels map back to the spine underneath.
  await db.query(
    `insert into merchant_rules (member_id, merchant_key, merchant_label, category, ask, source)
     values ($1,'gamestop','GameStop','games',false,'navigator_set')`, [mem.id]);

  // Rides get asked about once per merchant and then remembered.
  // These two have been answered before.
  await db.query(
    `insert into merchant_rules (member_id, merchant_key, merchant_label, category, qde, ask, source)
     values ($1,'rideshare-plus','RideShare Plus','around','Transportation',false,'member_answer'),
            ($1,'city-transit','City Transit','around','Transportation',false,'member_answer')`,
    [mem.id]);

  /* ---- three months of history ------------------------------------------- */
  // Only the current month feeds the budget rings, so this cannot disturb the
  // numbers the design draws.
  const HISTORY = [
    ['Social Security', 994.0, 'deposit', 1],
    ['Acme Foods', 380.0, 'deposit', 15],
    ['Oakwood Apartments', 650.0, '6513', 1],
    ['Metro Wireless', 55.0, '4814', 2],
    ['StreamPlus', 19.0, '5815', 3],
    ['Save-Mart Grocery', 71.4, '5411', 7],
    ['Save-Mart Grocery', 44.15, '5411', 21],
    ['Corner Market', 18.6, '5411', 12],
    ['Corner Coffee', 4.5, '5814', 9],
    ['Corner Coffee', 4.5, '5814', 23],
    ['Taco Bus', 11.25, '5814', 17],
    ['City Transit', 2.75, '4131', 8],
    ['City Transit', 2.75, '4131', 14],
    ['RideShare Plus', 16.75, '4121', 19],
    ['Cinema 9', 14.0, '5815', 22],
    ['City Pharmacy', 18.4, '5912', 11],
  ];
  for (let back = 3; back >= 1; back--) {
    for (const [merchant, amount, kind, day] of HISTORY) {
      // Last month's pay and rent are added separately below, so skip them
      // here rather than posting them twice.
      if (back === 1 && (kind === 'deposit' || merchant === 'Oakwood Apartments')) continue;
      const at = monthsBack(back, day);
      if (kind === 'deposit') {
        await db.query(`select simulate_deposit($1,$2,$3,$4)`, [mem.id, merchant, amount, at]);
      } else {
        await db.query(`select simulate_purchase($1,$2,$3,$4,'checking',$5)`,
          [mem.id, merchant, kind, amount, at]);
      }
    }
  }
  console.log('Loaded three months of history.');

  /* ---- money in and out -------------------------------------------------- */
  const deposits = [
    ['Social Security', 994.0, lastMonth(1)],
    ['Social Security', 994.0, thisMonth(1, 9)],
    ['Acme Foods', 380.0, lastMonth(15)],
    ['Acme Foods', 380.0, thisMonth(15, 9)],
  ];
  for (const [source, amount, at] of deposits) {
    await db.query(`select simulate_deposit($1,$2,$3,$4)`, [mem.id, source, amount, at]);
  }

  // Spends chosen so the rings read exactly what the design draws:
  // Groceries $54 of $150, Fun $82 of $120, Getting around $52 of $60,
  // Games $34.99 of $50.
  const purchases = [
    ['Save-Mart Grocery', '5411', 32.18, thisMonth(4, 17)],
    ['Corner Market', '5411', 21.82, thisMonth(6, 11)],
    ['Bowl-A-Rama', '5816', 35.0, thisMonth(2, 19)],
    ['Cinema 9', '5815', 28.0, thisMonth(4, 20)],
    ['StreamPlus', '5815', 19.0, thisMonth(3, 8)],
    ['GameStop', '5816', 34.99, thisMonth(5, 16)],
    ['RideShare Plus', '4121', 22.5, thisMonth(5, 18)],
    ['RideShare Plus', '4121', 18.5, thisMonth(2, 10)],
    ['City Transit', '4131', 2.75, thisMonth(2, 8)],
    ['City Transit', '4131', 2.75, thisMonth(3, 8)],
    ['City Transit', '4131', 2.75, thisMonth(4, 8)],
    ['City Transit', '4131', 2.75, thisMonth(6, 8)],
    ['Corner Coffee', '5814', 4.5, thisMonth(6, 14)],
    ['Taco Bus', '5814', 9.75, thisMonth(3, 13)],
    ['Post Office', '9402', 8.4, thisMonth(5, 11)],
    ['Metro Wireless', '4814', 55.0, thisMonth(2, 9)],
  ];
  for (const [merchant, mcc, amount, at] of purchases) {
    await db.query(`select simulate_purchase($1,$2,$3,$4,'checking',$5)`,
      [mem.id, merchant, mcc, amount, at]);
  }

  // Rent, from the ABLE account, and two more ABLE-side purchases.
  const ableAccount = (await db.query(
    `select account_of($1,'able') as id`, [mem.id])).rows[0].id;
  await db.query(
    `select post_transaction($1,$2,'Oakwood Apartments','6513',-650,'home','ach',$3)`,
    [mem.id, ableAccount, lastMonth(1)]);
  await db.query(
    `select post_transaction($1,$2,'Oakwood Apartments','6513',-650,'home','ach',$3)`,
    [mem.id, ableAccount, thisMonth(1, 10)]);
  await db.query(
    `select post_transaction($1,$2,'City Pharmacy','5912',-23.70,'health','card',$3)`,
    [mem.id, ableAccount, thisMonth(3, 15)]);

  // One ABLE debit that could not be categorised: this raises the mandatory
  // ABLE question.
  await db.query(
    `select post_transaction($1,$2,'Corner Hardware',null,-34.20,null,'card',$3)`,
    [mem.id, ableAccount, thisMonth(6, 16)]);

  // The Hardware Depot purchase that raises the ABLE offer on Home.
  // Recent, because a QDE offer expires 25 days after the purchase.
  await db.query(`select simulate_purchase($1,'Hardware Depot','5200',41.30,'checking',$2)`,
    [mem.id, daysAgo(3)]);

  // The $72.50 decline at a stop line, which leaves the no-buttons notice.
  const declined = await db.query(
    `select simulate_purchase($1,'GameStop','5816',72.50) as r`, [mem.id]);
  console.log(`GameStop $72.50 → ${declined.rows[0].r.status}: "${declined.rows[0].r.declined_reason}"`);

  /* ---- balances, set to what the design draws ---------------------------- */
  await db.query(
    `update accounts set balance = case kind
       when 'checking'  then 412.55
       when 'able'      then 6240.00
       when 'emergency' then 150.00
       when 'ebt'       then 187.42
       else balance end
     where member_id = $1`, [mem.id]);

  /* ---- two savings goals ------------------------------------------------- */
  await db.query(
    `insert into savings_goals (member_id, name, target, saved, agreed_by)
     values ($1,'New gaming console',400,220,array[$1,$2]::uuid[]),
            ($1,'Emergency fund',500,350,array[$1,$2]::uuid[])`, [mem.id, nav.id]);

  /* ---- a block, so the Blocked screen has something on it ---------------- */
  await db.query(
    `insert into blocks (member_id, kind, target, label, status, agreed_by, since, attempts_stopped)
     values ($1,'category','gambling','Gambling and casinos','active',array[$1,$2]::uuid[],now() - interval '40 days',3)`,
    [mem.id, nav.id]);

  /* ---- let the engine produce the questions ------------------------------ */
  await db.query(`select generate_home_cards($1)`, [mem.id]);
  // The SSI sweep only raises on day 25, two days before the last day, and the
  // last day itself. Force one so the card can be seen on any day.
  await db.query(`select run_ssi_sweep($1, true)`, [mem.id]);
  // Same for the ABLE offer: the one-question-a-day cap would otherwise hold
  // it back until tomorrow.
  await db.query(`select generate_qde_offers($1, true)`, [mem.id]);

  // Maria proposes lowering Games $50 -> $40: a tightening, so it waits for
  // his Yes and the old $50 stays live.
  const gamesLine = (await db.query(
    `select id from budget_lines where member_id = $1 and category = 'games'`, [mem.id])).rows[0].id;
  await nav.client.rpc('propose_budget_change', { p_line: gamesLine, p_amount: 40, p_mode: 'stop' });

  /* ---- report ------------------------------------------------------------ */
  const { rows: cards } = await db.query(
    `select cls, kind, headline from home_cards
      where member_id = $1 and state in ('queued','shown')
      order by array_position(array['ABLE_ANSWER','CONSENT','SENTINEL','QDE_OFFER','INCOME_TAG','NOTICE']::card_class[], cls)`,
    [mem.id]);
  const { rows: budget } = await db.query(
    `select display_name, amount, spent, remaining from budget_status($1)`, [mem.id]);
  const { rows: accounts } = await db.query(
    `select name, balance from accounts where member_id = $1 order by kind`, [mem.id]);

  console.log('\nAccounts:');
  for (const a of accounts) console.log(`  ${a.name.padEnd(16)} $${a.balance}`);
  console.log('\nBudget:');
  for (const b of budget) {
    console.log(`  ${b.display_name.padEnd(16)} $${b.remaining} left of $${b.amount} (spent $${b.spent})`);
  }
  console.log('\nWaiting on his Home screen, in this order:');
  for (const c of cards) console.log(`  ${c.cls.padEnd(12)} ${c.headline}`);

  console.log(`\nSign in as:`);
  console.log(`  ${MEMBER.first}  ${MEMBER.email}  /  ${PASSWORD}`);
  console.log(`  ${NAVIGATOR.first} ${NAVIGATOR.email}  /  ${PASSWORD}`);
}

try {
  await main();
} finally {
  await db.end();
}
