import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Role = 'member' | 'navigator';

export interface Profile {
  id: string;
  role: Role;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  reading_level: string;
  ai_helper_enabled: boolean;
  auto_move_enabled: boolean;
  face_id_enabled: boolean;
  onboarding_done: boolean;
}

export interface Link {
  link_id: string;
  /** 1 Independent · 2 Monitored · 3 Flexible · 4 Firm · 5 Fiduciary.
   *  NEVER shown to the Member. */
  level: number;
  status: 'invited' | 'active' | 'ended' | 'locked' | 'expired';
  invite_email?: string | null;
  member?: { id: string; first_name: string; last_name: string; email: string | null } | null;
  navigator?: { id: string; first_name: string; last_name: string; email: string | null } | null;
}

interface Ctx {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  links: Link[];
  /** The Navigator's currently selected member (she may support several). */
  activeMemberId: string | null;
  setActiveMemberId: (id: string) => void;
  activeLink: Link | null;
  /** The other person's first name, for "Message Maria" / "Ask Alex". */
  otherFirstName: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('my_context');
    const ctx = data as { profile: Profile | null; links: Link[] } | null;
    setProfile(ctx?.profile ?? null);
    setLinks(ctx?.links ?? []);
    if (ctx?.profile?.role === 'member') {
      setActiveMemberId(ctx.profile.id);
    } else {
      setActiveMemberId((prev) => {
        const still = ctx?.links?.some((l) => l.member?.id === prev);
        return still ? prev : (ctx?.links?.find((l) => l.status === 'active')?.member?.id ?? null);
      });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (data.session) await load();
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) await load();
      else {
        setProfile(null);
        setLinks([]);
        setActiveMemberId(null);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const activeLink = useMemo(() => {
    if (!profile) return null;
    if (profile.role === 'member') return links[0] ?? null;
    return links.find((l) => l.member?.id === activeMemberId) ?? null;
  }, [profile, links, activeMemberId]);

  const otherFirstName = useMemo(() => {
    if (!profile) return '';
    if (profile.role === 'member') return activeLink?.navigator?.first_name ?? '';
    return activeLink?.member?.first_name ?? '';
  }, [profile, activeLink]);

  const value: Ctx = {
    loading,
    session,
    profile,
    links,
    activeMemberId,
    setActiveMemberId,
    activeLink,
    otherFirstName,
    refresh: load,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Ctx {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

/** The Member's help pill says "Need help?"; the Navigator's says "Message {name}". */
export function useActionPill(): { label: string; href: string } {
  const { profile, otherFirstName } = useSession();
  if (profile?.role === 'navigator') {
    return { label: otherFirstName ? `Message ${otherFirstName}` : 'Message', href: '/(navigator)/chat' };
  }
  return { label: 'Need help?', href: '/(member)/chat' };
}
