import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Loading, Row, Screen, Section, SubHeader, Title } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { money } from '../../src/lib/format';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Prototype screen `alex/everything_else` — the collapsed row on Spend opens
 * the full category breakdown. Member-facing words only.
 */
export default function EverythingElse() {
  const router = useRouter();
  const { activeMemberId } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['everything_else', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const [{ data: txns }, { data: spine }] = await Promise.all([
        supabase
          .from('transactions')
          .select('category,amount')
          .eq('member_id', activeMemberId!)
          .eq('status', 'posted')
          .lt('amount', 0)
          .neq('rail', 'internal')
          .gte('occurred_at', start.toISOString()),
        supabase.from('spine_categories').select('id,member_word,sort_order').order('sort_order'),
      ]);
      const words = new Map((spine ?? []).map((s) => [s.id, s.member_word]));
      const totals = new Map<string, number>();
      for (const t of txns ?? []) {
        const label = words.get(t.category ?? '') ?? 'Other';
        totals.set(label, (totals.get(label) ?? 0) + Math.abs(Number(t.amount)));
      }
      return [...totals.entries()].sort((a, b) => b[1] - a[1]);
    },
  });

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Everything else" sub="This month" />
      {isLoading || !data ? (
        <Loading />
      ) : (
        <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
          {data.length === 0 ? (
            <Empty text="Nothing yet this month." icon="dollar" />
          ) : (
            data.map(([label, total], i) => (
              <Row key={label} name={label} value={money(total)} last={i === data.length - 1} />
            ))
          )}
        </Card>
      )}
    </Screen>
  );
}
