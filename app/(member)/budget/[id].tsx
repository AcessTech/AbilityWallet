import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Empty, Loading, Muted, Ring, Screen, Section, SubHeader, Title,
} from '../../../src/components/ui';
import { TxnRow } from '../../../src/features/TxnRow';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money, moneyShort } from '../../../src/lib/format';
import { gaugeColor } from '../../../src/theme/tokens';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * One budget line, his side. Prototype screens `alex/cat_groceries`,
 * `cat_fun`, `cat_around`.
 *
 * Rings only: no mode tags, ever. Restriction invisibility means a stop line
 * looks exactly like a guide line here — a stop surfaces only at decline time
 * and at consent time (Appendix A §0.5).
 */
export default function MemberBudgetDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeMemberId } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['budget_detail', id, activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data: lines } = await supabase.rpc('budget_status', { p_member: activeMemberId! });
      const line = ((lines ?? []) as { id: string; category: string; display_name: string; amount: number; spent: number; remaining: number; fraction_left: number }[])
        .find((l) => l.id === id) ?? null;
      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', activeMemberId!)
        .or(`budget_line_id.eq.${id},category.eq.${line?.category ?? '__none__'}`)
        .order('occurred_at', { ascending: false })
        .limit(30);
      return { line, txns: txns ?? [] };
    },
  });

  const line = data?.line;

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />

      {isLoading || !line ? (
        <Loading />
      ) : (
        <>
          <Title title={line.display_name} />
          <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Ring
              label=""
              sub="left"
              amountText={moneyShort(line.remaining)}
              fraction={Number(line.fraction_left)}
              strokeColor={gaugeColor(Number(line.fraction_left))}
            />
            <View style={{ marginTop: 10 }}>
              <Muted>
                {money(line.spent, { cents: false })} spent of {money(line.amount, { cents: false })} this month
              </Muted>
            </View>
          </Card>

          <Section>Spent on this</Section>
          <Card style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
            {data.txns.length === 0 ? (
              <Empty text="Nothing yet this month." icon="dollar" />
            ) : (
              data.txns.map((t, i) => (
                <TxnRow
                  key={t.id}
                  txn={t}
                  last={i === data.txns.length - 1}
                  onPress={() => router.push({ pathname: '/(member)/txn/[id]', params: { id: t.id } })}
                />
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
