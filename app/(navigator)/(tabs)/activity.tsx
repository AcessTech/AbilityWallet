import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BrandHeader, Card, Empty, Loading, Row, Screen, Section,
} from '../../../src/components/ui';
import { BudgetRings } from '../../../src/features/BudgetRings';
import { TxnRow } from '../../../src/features/TxnRow';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money, shortDate } from '../../../src/lib/format';
import { color, font } from '../../../src/theme/tokens';
import type { MemberHome } from '../../../src/data/hooks';

interface Activity {
  level: number;
  budget: MemberHome['budget'];
  recurring: { id: string; source: string; amount: number; kind: string; confidence: string; last_seen_on: string | null }[];
  alerts: { id: string; code: string; grp: string; title: string; created_at: string; read_at: string | null }[];
  transactions: MemberHome['recent'];
}

/**
 * Navigator Activity tab. Prototype screen `maria/nactivity`: rings -> send
 * money -> recurring -> transactions -> the Notifications row at the bottom.
 * Every alert lands here regardless of routing — routing configures
 * interruption, not knowledge.
 */
export default function NavigatorActivity() {
  const router = useRouter();
  const { activeMemberId, otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['navigator_activity', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async (): Promise<Activity> => {
      const { data, error } = await supabase.rpc('navigator_activity', { p_member: activeMemberId! });
      if (error) throw error;
      return data as unknown as Activity;
    },
  });

  return (
    <Screen>
      <BrandHeader
        pillLabel={otherFirstName ? `Message ${otherFirstName}` : 'Message'}
        onPillPress={() => router.push('/(navigator)/chat')}
      />

      {isLoading && !data ? (
        <Loading />
      ) : !data ? (
        <Card>
          <Empty text="Nothing to show yet." />
        </Card>
      ) : (
        <>
          <Section first>Budget</Section>
          {data.budget.length === 0 ? (
            <Card><Empty text="No budget lines yet." icon="bars" /></Card>
          ) : (
            <BudgetRings
              lines={data.budget}
              onPress={(l) => router.push({ pathname: '/(navigator)/limit/[id]', params: { id: l.id } })}
            />
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -6, marginBottom: 14 }}>
            <Pressable
              onPress={() => router.push('/(navigator)/send')}
              accessibilityRole="button"
              style={({ pressed }) => [
                { backgroundColor: color.gold, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={{ fontFamily: font.extrabold, fontSize: 14, color: color.navy }}>Send money</Text>
            </Pressable>
          </View>

          <Section>Repeating</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.recurring.length === 0 ? (
              <Empty text="Nothing repeating yet. Streams show up after two cycles." icon="repeat" />
            ) : (
              data.recurring.map((r, i) => (
                <Row
                  key={r.id}
                  name={r.source}
                  sub={r.last_seen_on ? `Last seen ${shortDate(r.last_seen_on)}` : undefined}
                  value={money(r.amount)}
                  chevron
                  last={i === data.recurring.length - 1}
                  onPress={() => router.push({ pathname: '/(navigator)/recurring/[id]', params: { id: r.id } })}
                />
              ))
            )}
          </Card>

          <Section>Transactions</Section>
          <Card style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
            {data.transactions.length === 0 ? (
              <Empty text="Nothing yet." icon="dollar" />
            ) : (
              data.transactions.map((t, i) => (
                <TxnRow
                  key={t.id}
                  txn={t}
                  navigatorView
                  last={i === data.transactions.length - 1}
                  onPress={() => router.push({ pathname: '/(navigator)/txn/[id]', params: { id: t.id } })}
                />
              ))
            )}
          </Card>

          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row
              icon="bell"
              name="Notifications"
              sub="Choose what reaches you, and when"
              chevron
              last
              onPress={() => router.push('/(navigator)/notifications')}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
