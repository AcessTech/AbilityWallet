import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Card, DetailHero, Loading, Muted, Pill, Row, Screen, SubHeader,
} from '../../../src/components/ui';
import { useTransaction } from '../../../src/data/hooks';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { initials, money, tileColor } from '../../../src/lib/format';
import { color, font } from '../../../src/theme/tokens';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * Navigator transaction detail.
 *
 * Her side of a decline is red and says "Declined", with the reason and the
 * real numbers, plus a row into Plan to adjust the limit.
 */
export default function NavigatorTxnDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeMemberId, otherFirstName } = useSession();
  const { data: t, isLoading } = useTransaction(id);

  const { data: line } = useQuery({
    queryKey: ['txn_line', id, t?.budget_line_id, t?.category],
    enabled: !!t && !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase.rpc('budget_status', { p_member: activeMemberId! });
      const rows = (data ?? []) as {
        id: string; category: string; display_name: string; amount: number;
        spent: number; remaining: number; period: string;
      }[];
      return rows.find((r) => r.id === t!.budget_line_id || r.category === t!.category) ?? null;
    },
  });

  const pill = navigatorPill(otherFirstName);

  if (isLoading || !t) {
    return (
      <Screen>
        <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
        <Loading />
      </Screen>
    );
  }

  const declined = t.status === 'declined';
  const incoming = Number(t.amount) > 0;
  const when = new Date(t.occurred_at);

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />

      <DetailHero
        tileText={initials(t.merchant)}
        tileColor={tileColor(t.merchant)}
        name={t.merchant}
        amount={declined ? money(Math.abs(Number(t.amount))) : money(t.amount, { sign: incoming })}
        amountColor={declined ? color.red : incoming ? color.green : color.navy}
        when={`${when.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
        pill={declined ? <Pill text="Declined" tone="red" /> : undefined}
      />

      {declined ? (
        <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: font.black, fontSize: 16, color: color.ink }}>
            Why it was declined
          </Text>
          <View style={{ marginTop: 6 }}>
            <Muted>{whyDeclined(t.declined_reason, line, otherFirstName, Number(t.amount))}</Muted>
          </View>
        </Card>
      ) : null}

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        {line ? <Row name="Budget" value={line.display_name} /> : null}
        {line ? (
          <Row
            name={`${line.display_name} this month`}
            value={`${money(line.spent)} spent · ${money(line.remaining)} left`}
            last={!line}
          />
        ) : null}
        <Row name="When" value={when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} last={!line} />
      </Card>

      {line ? (
        <Card
          style={{ paddingVertical: 14, paddingHorizontal: 20 }}
          onPress={() => router.push({ pathname: '/(navigator)/limit/[id]', params: { id: line.id } })}
        >
          <Row name="Adjust this limit" icon="bars" chevron last />
        </Card>
      ) : null}
    </Screen>
  );
}

function whyDeclined(
  reason: string | null,
  line: { display_name: string; amount: number; remaining: number } | null | undefined,
  name: string,
  amount: number,
): string {
  const who = name || 'They';
  if (reason === 'not enough money') {
    return `There wasn't enough in checking. The purchase was ${money(Math.abs(amount))}.`;
  }
  if (reason === 'blocked merchant') return 'This merchant is blocked on the account.';
  if (reason === 'card paused') return 'The card is paused.';
  if (reason === 'card reported lost') return 'The card was reported lost or stolen.';
  if (line) {
    return `The ${line.display_name} limit is ${money(line.amount, { cents: false })} a month. ${who} had ${money(line.remaining)} left this month, so this purchase went over.`;
  }
  return reason ?? '';
}
