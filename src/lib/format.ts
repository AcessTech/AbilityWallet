/** Money and date formatting. The money is fake but it must read like money. */

export function money(n: number | string | null | undefined, opts?: { cents?: boolean; sign?: boolean }): string {
  const v = Number(n ?? 0);
  const cents = opts?.cents ?? !Number.isInteger(v);
  const body = Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  const sign = opts?.sign ? (v < 0 ? '−' : '+') : v < 0 ? '−' : '';
  return `${sign}$${body}`;
}

/** Whole dollars, for ring centres: "$96". */
export function moneyShort(n: number | string | null | undefined): string {
  return money(Math.round(Number(n ?? 0)), { cents: false });
}

/** "Yesterday", "Jul 17" — the transaction sub-line. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "September 30" — copy must name the exact day, never "end of month". */
export function longDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function monthLabel(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Two initials for a merchant tile. */
export function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** A stable colour for a merchant tile, so the same shop always looks the same. */
const TILE_COLORS = ['#093870', '#2E7D5B', '#6F4E37', '#B3261E', '#D97706', '#5b6b80', '#7B4397', '#1b6ca8'];
export function tileColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TILE_COLORS[h % TILE_COLORS.length];
}

/** Cleaned merchant descriptor, used for rules, blocks and "new payee". */
export function merchantKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** The last day of the month a date falls in. */
export function lastDayOfMonth(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function daysLeftInMonth(d: Date = new Date()): number {
  return lastDayOfMonth(d).getDate() - d.getDate();
}

/** Types a date as MM / DD / YYYY while the person types digits. */
export function maskDate(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)} / ${d.slice(2)}`;
  return `${d.slice(0, 2)} / ${d.slice(2, 4)} / ${d.slice(4)}`;
}

/** MM / DD / YYYY -> YYYY-MM-DD, or null if it isn't a real date yet. */
export function parseMaskedDate(masked: string): string | null {
  const d = masked.replace(/\D/g, '');
  if (d.length !== 8) return null;
  const mm = Number(d.slice(0, 2));
  const dd = Number(d.slice(2, 4));
  const yyyy = Number(d.slice(4));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900) return null;
  const iso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const back = new Date(`${iso}T00:00:00`);
  if (back.getUTCMonth() + 1 !== mm || back.getUTCDate() !== dd) return null;
  return iso;
}

/** 000-00-0000 */
export function maskSsn(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/** "2214 Birchwood Ave, Columbus, OH" — the one-line form used in sign-up. */
export function addressLine(a: {
  line1?: string | null;
  city?: string | null;
  state?: string | null;
}): string {
  return [a.line1, a.city, a.state].filter(Boolean).join(', ');
}
