import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * What the sign-up flow collects before anything is written to the database.
 * Follows the onboarding design, with phone replaced by email throughout.
 */
export interface SignupDraft {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** 'someone_else' makes this account a Navigator; 'me' makes it a Member. */
  who: 'someone_else' | 'me' | null;

  // The person who will use the card.
  theirFirstName: string;
  theirLastName: string;
  theirEmail: string;
  theirDob: string;
  theirSsn: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;

  // Where the card goes.
  shipToHome: boolean;
  shipLine1: string;
  shipLine2: string;
  shipCity: string;
  shipState: string;
  shipPostalCode: string;

  /** 1 Independent · 2 Monitored · 3 Flexible · 4 Firm · 5 Fiduciary. */
  level: number;
}

const EMPTY: SignupDraft = {
  email: '', password: '', firstName: '', lastName: '', who: null,
  theirFirstName: '', theirLastName: '', theirEmail: '', theirDob: '', theirSsn: '',
  addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '',
  shipToHome: true, shipLine1: '', shipLine2: '', shipCity: '', shipState: '', shipPostalCode: '',
  level: 2,
};

interface Ctx {
  draft: SignupDraft;
  set: (patch: Partial<SignupDraft>) => void;
  reset: () => void;
}

const SignupContext = createContext<Ctx | null>(null);

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SignupDraft>(EMPTY);
  const value = useMemo<Ctx>(
    () => ({
      draft,
      set: (patch) => setDraft((d) => ({ ...d, ...patch })),
      reset: () => setDraft(EMPTY),
    }),
    [draft],
  );
  return <SignupContext.Provider value={value}>{children}</SignupContext.Provider>;
}

export function useSignup(): Ctx {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error('useSignup must be used inside SignupProvider');
  return ctx;
}

/** The five support levels, worded exactly as in the onboarding design. */
export const LEVELS = [
  { level: 1, name: 'Independent',     desc: '{name} banks on their own. You see nothing.' },
  { level: 2, name: 'Monitored',       desc: 'You see balance and spending, and get alerts.' },
  { level: 3, name: 'Flexible limits', desc: 'Limits you set together. Going over works — you get a heads-up.' },
  { level: 4, name: 'Firm limits',     desc: 'Limits you set together. Going over is declined.' },
  { level: 5, name: 'Fiduciary',       desc: 'You manage benefit money. Requires SSA documents.' },
] as const;
