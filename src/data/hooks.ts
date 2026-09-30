import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useSession } from '../lib/session';

/** One round trip for the Member's Home: card, notice, accounts, budget, recent. */
export interface MemberHome {
  card: {
    id: string;
    cls: 'ABLE_ANSWER' | 'CONSENT' | 'SENTINEL' | 'QDE_OFFER' | 'INCOME_TAG';
    kind: string | null;
    headline: string;
    body: string;
    txn_id: string | null;
    suggested_amount: number | null;
    merchant: string | null;
    payload: Record<string, unknown>;
  } | null;
  notice: { id: string; kind: string; headline: string; body: string } | null;
  accounts: { id: string; kind: string; name: string; balance: number; program_name: string | null }[];
  budget: {
    id: string;
    category: string;
    display_name: string;
    amount: number;
    period: string;
    mode: string;
    spent: number;
    remaining: number;
    fraction_left: number;
    pending_change: Record<string, unknown> | null;
  }[];
  recent: {
    id: string;
    merchant: string;
    merchant_key: string;
    amount: number;
    status: string;
    occurred_at: string;
    declined_reason: string | null;
  }[];
}

export function useMemberHome() {
  const { activeMemberId } = useSession();
  return useQuery({
    queryKey: ['member_home', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async (): Promise<MemberHome> => {
      const { data, error } = await supabase.rpc('member_home', { p_member: activeMemberId! });
      if (error) throw error;
      return data as unknown as MemberHome;
    },
  });
}

export interface NavigatorHome {
  level: number;
  member: { id: string; first_name: string; last_name: string } | null;
  alert: { id: string; code: string; title: string; created_at: string; read_at: string | null } | null;
  unread_alerts: number;
  accounts: MemberHome['accounts'];
  budget: MemberHome['budget'];
  ssi_room: number | null;
  recent: MemberHome['recent'];
}

export function useNavigatorHome() {
  const { activeMemberId } = useSession();
  return useQuery({
    queryKey: ['navigator_home', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async (): Promise<NavigatorHome> => {
      const { data, error } = await supabase.rpc('navigator_home', { p_member: activeMemberId! });
      if (error) throw error;
      return data as unknown as NavigatorHome;
    },
  });
}

/** Answering the one question on Home. */
export function useAnswerCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { cardId: string; yes: boolean; payload?: Record<string, unknown> }) => {
      const { data, error } = await supabase.rpc('answer_home_card', {
        p_card: args.cardId,
        p_yes: args.yes,
        p_payload: (args.payload ?? {}) as never,
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member_home'] });
      qc.invalidateQueries({ queryKey: ['navigator_home'] });
    },
  });
}

export function useDismissNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.rpc('dismiss_notice', { p_card: cardId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member_home'] }),
  });
}

/** Transactions, newest first, for Spend and Activity. */
export function useTransactions(memberId: string | null, limit = 100) {
  return useQuery({
    queryKey: ['transactions', memberId, limit],
    enabled: !!memberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', memberId!)
        .neq('rail', 'internal')
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ['transaction', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}
