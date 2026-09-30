// Run SQL against the Supabase database from the command line.
//   node scripts/sql.mjs "select 1"
//   node scripts/sql.mjs --file path/to.sql
// Reads SUPABASE_DB_URL, or builds it from SUPABASE_DB_PASSWORD + the project
// ref in EXPO_PUBLIC_SUPABASE_URL.
import fs from 'node:fs';
import pg from 'pg';

function dbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const pw = process.env.SUPABASE_DB_PASSWORD;
  const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
  const host = env.match(/EXPO_PUBLIC_SUPABASE_URL=https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!pw || !host) throw new Error('Set SUPABASE_DB_PASSWORD (and keep .env in place)');
  return `postgresql://postgres:${encodeURIComponent(pw)}@db.${host}.supabase.co:5432/postgres`;
}

const args = process.argv.slice(2);
const sql = args[0] === '--file' ? fs.readFileSync(args[1], 'utf8') : args.join(' ');

const client = new pg.Client({ connectionString: dbUrl(), ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const res = await client.query(sql);
  const all = Array.isArray(res) ? res : [res];
  for (const r of all) {
    if (r.rows?.length) console.table(r.rows);
    else console.log(r.command, r.rowCount ?? '');
  }
} finally {
  await client.end();
}
