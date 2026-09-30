import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  BrandHeader, Card, Empty, Loading, Muted, Row, Screen, Section,
} from '../../../src/components/ui';
import { BudgetRings } from '../../../src/features/BudgetRings';
import { TxnRow } from '../../../src/features/TxnRow';
import { useNavigatorHome } from '../../../src/data/hooks';
import { useSession } from '../../../src/lib/session';
import { money } from '../../../src/lib/format';
import { color, font, radius } from '../../../src/theme/tokens';

/**
 * Navigator Home: the most recent alert ->
 * Accounts -> Budget -> Send money -> Recent. Newest alert first, like missed
 * calls; the rest live in Activity.
 */
export default function NavigatorHome() {
  const router = useRouter();
  const { otherFirstName, links, activeMemberId } = useSession();
  const { data, isLoading, refetch } = useNavigatorHome();
  // No member linked yet means the query never runs, so guard on that
  // rather than on `!data` — otherwise the screen spins forever.
  const waiting = isLoading && !!activeMemberId;

  useFocusEffect(React.useCallback(() => { refetch(); }, [refetch]));

  const pending = links.filter((l) => l.status === 'invited');

  return (
    <Screen>
      <BrandHeader
        pillLabel={otherFirstName ? `Message ${otherFirstName}` : 'Message'}
        onPillPress={() => router.push('/(navigator)/chat')}
      />

      {waiting ? (
        <Loading />
      ) : !data?.member ? (
        <Card>
          <Empty
            text={
              pending.length
                ? `Waiting for ${pending[0].invite_email} to accept the invite.`
                : 'Nobody is set up yet. Add someone from your Account tab.'
            }
            icon="user"
          />
        </Card>
      ) : (
        <>
          {data.alert ? (
            <Pressable
              onPress={() => router.push({ pathname: '/(navigator)/alert/[id]', params: { id: data.alert!.id } })}
              style={({ pressed }) => [
                {
                  backgroundColor: '#fff',
                  borderRadius: radius.card,
                  borderWidth: 3,
                  borderColor: color.orange,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  marginBottom: 14,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={{ fontFamily: font.extrabold, fontSize: 16, color: color.ink }}>
                {data.alert.title}
              </Text>
              {data.unread_alerts > 1 ? (
                <View style={{ marginTop: 6 }}>
                  <Muted>{data.unread_alerts - 1} more in Activity.</Muted>
                </View>
              ) : null}
            </Pressable>
          ) : null}

          {data.level < 2 ? (
            <Card>
              <Empty
                text={`${otherFirstName} banks on their own. You can send messages, and that is all you see.`}
                icon="user"
              />
            </Card>
          ) : (
            <>
              <Section first={!data.alert}>Accounts</Section>
              <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
                {data.accounts.map((a, i) => (
                  <Row
                    key={a.id}
                    name={a.name}
                    value={money(a.balance)}
                    big
                    last={i === data.accounts.length - 1}
                    onPress={() =>
                      router.push({ pathname: '/(navigator)/account-detail/[id]', params: { id: a.id } })
                    }
                  />
                ))}
              </Card>

              <Section>Budget</Section>
              {data.budget.length === 0 ? (
                <Card>
                  <Empty text="No budget lines yet. Add one from the Plan tab." icon="bars" />
                </Card>
              ) : (
                <BudgetRings
                  lines={data.budget}
                  onPress={(l) =>
                    router.push({ pathname: '/(navigator)/limit/[id]', params: { id: l.id } })
                  }
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
                  <Text style={{ fontFamily: font.extrabold, fontSize: 14, color: color.navy }}>
                    Send money
                  </Text>
                </Pressable>
              </View>

              <Section>Recent</Section>
              <Card style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
                {data.recent.length === 0 ? (
                  <Empty text="Nothing yet." icon="dollar" />
                ) : (
                  data.recent.map((t, i) => (
                    <TxnRow
                      key={t.id}
                      txn={t}
                      navigatorView
                      last={i === data.recent.length - 1}
                      onPress={() => router.push({ pathname: '/(navigator)/txn/[id]', params: { id: t.id } })}
                    />
                  ))
                )}
              </Card>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
