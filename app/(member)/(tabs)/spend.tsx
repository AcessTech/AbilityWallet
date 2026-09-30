import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Loading, Screen, Section, TitleHeader, uiStyles } from '../../../src/components/ui';
import { BudgetRings } from '../../../src/features/BudgetRings';
import { TxnRow } from '../../../src/features/TxnRow';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money, shortDate } from '../../../src/lib/format';
import { color, font } from '../../../src/theme/tokens';
import type { MemberHome } from '../../../src/data/hooks';

interface Spend {
  budget: MemberHome['budget'];
  everything_else: number;
  able_total: number;
  able_transactions: { id: string; merchant: string; amount: number; occurred_at: string; status: string; category: string | null; qde: string | null }[];
  transactions: { id: string; merchant: string; amount: number; occurred_at: string; status: string; declined_reason: string | null; category: string | null }[];
}

/**
 * Member Spend tab: budget rings ->
 * "Everything else" -> "ABLE spending" (expandable) -> Transactions.
 */
export default function MemberSpend() {
  const router = useRouter();
  const { activeMemberId } = useSession();
  const [ableOpen, setAbleOpen] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['member_spend', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async (): Promise<Spend> => {
      const { data, error } = await supabase.rpc('member_spend', { p_member: activeMemberId! });
      if (error) throw error;
      return data as unknown as Spend;
    },
  });

  return (
    <Screen>
      <TitleHeader title="Spending" pillLabel="Need help?" onPillPress={() => router.push('/(member)/chat')} />

      {isLoading && !data ? (
        <Loading />
      ) : !data ? (
        <Card>
          <Empty text="Nothing to show yet." />
        </Card>
      ) : (
        <>
          <Section first>My budget</Section>
          {data.budget.length === 0 ? (
            <Card>
              <Empty text="No budget yet. When you and your Navigator set one up, it shows here." />
            </Card>
          ) : (
            <BudgetRings
              lines={data.budget}
              onPress={(l) => router.push({ pathname: '/(member)/budget/[id]', params: { id: l.id } })}
            />
          )}

          <Card
            style={{ paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => router.push('/(member)/everything-else')}
          >
            <Text style={uiStyles.rname}>Everything else</Text>
            <Text style={uiStyles.rval}>
              {money(data.everything_else, { cents: false })} this month <Text style={uiStyles.chev}>›</Text>
            </Text>
          </Card>

          <Card style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 6 }}>
            <Pressable
              onPress={() => setAbleOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: ableOpen }}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 }}
            >
              <Text style={uiStyles.rname}>ABLE spending</Text>
              <Text style={uiStyles.rval}>
                {money(data.able_total, { cents: false })} this month{' '}
                <Text style={{ color: color.navy, fontSize: 14 }}>{ableOpen ? '▲' : '▼'}</Text>
              </Text>
            </Pressable>

            {ableOpen ? (
              data.able_transactions.length === 0 ? (
                <View style={{ borderTopWidth: 1, borderTopColor: color.line }}>
                  <Empty text="Nothing has come out of ABLE this month." />
                </View>
              ) : (
                data.able_transactions.map((t, i) => (
                  <View key={t.id} style={i === 0 ? { borderTopWidth: 1, borderTopColor: color.line } : undefined}>
                    <TxnRow
                      txn={t}
                      last={i === data.able_transactions.length - 1}
                      onPress={() => router.push({ pathname: '/(member)/txn/[id]', params: { id: t.id } })}
                    />
                  </View>
                ))
              )
            ) : null}
          </Card>

          <Section>Transactions</Section>
          <Card style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
            {data.transactions.length === 0 ? (
              <Empty text="Nothing yet. Purchases show up here." icon="dollar" />
            ) : (
              data.transactions.map((t, i) => (
                <TxnRow
                  key={t.id}
                  txn={t}
                  last={i === data.transactions.length - 1}
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
