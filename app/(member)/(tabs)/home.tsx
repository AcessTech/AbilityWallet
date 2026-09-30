import React from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  BrandHeader, Card, Empty, Loading, Logo, Row, Screen, Section,
} from '../../../src/components/ui';
import { HomeCardSlot } from '../../../src/features/HomeCardSlot';
import { TxnRow } from '../../../src/features/TxnRow';
import { BudgetRings } from '../../../src/features/BudgetRings';
import { useMemberHome } from '../../../src/data/hooks';
import { money } from '../../../src/lib/format';

/**
 * Member Home:
 * question slot -> My accounts -> My budget -> Recent.
 */
export default function MemberHomeScreen() {
  const router = useRouter();
  const { data, isLoading, refetch } = useMemberHome();

  // The queue moves on at the next Home visit, never in place.
  useFocusEffect(React.useCallback(() => { refetch(); }, [refetch]));

  return (
    <Screen>
      <BrandHeader pillLabel="Need help?" onPillPress={() => router.push('/(member)/chat')} />

      {isLoading && !data ? (
        <Loading />
      ) : !data ? (
        <Card>
          <Empty text="Nothing to show yet." />
        </Card>
      ) : (
        <>
          <HomeCardSlot home={data} />

          <Section first>My accounts</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.accounts.map((a, i) => (
              <Row
                key={a.id}
                name={a.name}
                value={money(a.balance)}
                big
                last={i === data.accounts.length - 1}
                onPress={() =>
                  router.push({ pathname: '/(member)/account-detail/[id]', params: { id: a.id } })
                }
              />
            ))}
          </Card>

          <Section>My budget</Section>
          {data.budget.length === 0 ? (
            <Card>
              <Empty text="No budget yet. When you and your Navigator set one up, it shows here." />
            </Card>
          ) : (
            <BudgetRings
              lines={data.budget}
              onPress={(line) =>
                router.push({ pathname: '/(member)/budget/[id]', params: { id: line.id } })
              }
            />
          )}

          <Section>Recent</Section>
          <Card style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
            {data.recent.length === 0 ? (
              <Empty text="Nothing yet. Purchases show up here." icon="dollar" />
            ) : (
              data.recent.map((t, i) => (
                <TxnRow
                  key={t.id}
                  txn={t}
                  last={i === data.recent.length - 1}
                  onPress={() =>
                    router.push({ pathname: '/(member)/txn/[id]', params: { id: t.id } })
                  }
                />
              ))
            )}
          </Card>
          <View style={{ height: 8 }} />
        </>
      )}
    </Screen>
  );
}
