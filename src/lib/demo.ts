/**
 * The two fake accounts the test-account loader creates (scripts/seed.mjs).
 *
 * The demo switch only appears when the signed-in account is one of these, so
 * a real member or navigator never sees it — not in development, and not in a
 * TestFlight build either.
 */
export const DEMO_ACCOUNTS = [
  { email: 'alex@example.com', label: 'Alex', role: 'member' as const },
  { email: 'maria@example.com', label: 'Maria', role: 'navigator' as const },
];

export const DEMO_PASSWORD = 'abilitywallet';

export function isDemoAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_ACCOUNTS.some((a) => a.email === email.toLowerCase());
}

export function otherDemoAccount(email: string | null | undefined) {
  if (!email) return null;
  return DEMO_ACCOUNTS.find((a) => a.email !== email.toLowerCase()) ?? null;
}
