import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Card, DetailHero, Loading, Muted, Pill, Plain, Row, Screen, SubHeader,
} from '../../../src/components/ui';
import { useTransaction } from '../../../src/data/hooks';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { initials, money, tileColor } from '../../../src/lib/format';
import { color, font } from '../../../src/theme/tokens';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * Member transaction detail, including declined purchases.
 *
 * A decline on his side is neutral: the pill reads "Didn't go through", never
 * red, never "Declined". One action row: Report a problem,
 * which opens the Help chat with the transaction attached — there is no
 * category sheet.
 */
export default function MemberTxnDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeMemberId } = useSession();
  const { data: t, isLoading } = useTransaction(id);

  const { data: extra } = useQuery({
    queryKey: ['txn_context', id, activeMemberId],
    enabled: !!t && !!activeMemberId,
    queryFn: async () => {
      const [{ data: card }, { data: acct }, { data: line }, { data: spine }] = await Promise.all([
        supabase.from('member_cards').select('last4').eq('member_id', activeMemberId!).limit(1).maybeSingle(),
        supabase.from('accounts').select('name').eq('id', t!.account_id).maybeSingle(),
        t!.budget_line_id
          ? supabase.from('budget_lines').select('display_name,amount,period').eq('id', t!.budget_line_id).maybeSingle()
          : Promise.resolve({ data: null }),
        t!.category
          ? supabase.from('spine_categories').select('member_word').eq('id', t!.category).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { card, acct, line, spine };
    },
  });

  if (isLoading || !t) {
    return (
      <Screen>
        <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
        <Loading />
      </Screen>
    );
  }

  const declined = t.status === 'declined';
  const incoming = Number(t.amount) > 0;
  const when = new Date(t.occurred_at);

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />

      <DetailHero
        tileText={initials(t.merchant)}
        tileColor={tileColor(t.merchant)}
        name={t.merchant}
        amount={declined ? money(Math.abs(Number(t.amount))) : money(t.amount, { sign: incoming })}
        amountColor={declined ? color.ink : color.navy}
        when={`${when.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
        pill={declined ? <Pill text="Didn't go through" /> : undefined}
      />

      {declined ? (
        <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
          <Plain>{declineExplanation(t.declined_reason, extra?.line, Number(t.amount))}</Plain>
          {extra?.line ? (
            <View style={{ marginTop: 6 }}>
              <Muted>Your {extra.line.display_name} money starts over on {nextResetLabel(extra.line.period)}.</Muted>
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        {extra?.line || extra?.spine ? (
          <Row name="Budget" value={extra?.line?.display_name ?? extra?.spine?.member_word ?? ''} />
        ) : null}
        {!declined ? <Row name="Paid from" value={extra?.acct?.name ?? ''} /> : null}
        <Row name="Card" value={extra?.card ? `•••• ${extra.card.last4}` : '—'} last />
      </Card>

      <Card
        style={{ paddingVertical: 14, paddingHorizontal: 20 }}
        onPress={() => router.push({ pathname: '/(member)/chat', params: { txn: t.id, report: '1' } })}
      >
        <Row name="Report a problem" icon="help-circle" chevron last />
      </Card>
    </Screen>
  );
}

/**
 * declined_reason is stored in the alert's exact wording ("over the Games
 * limit"), so this must not prefix it with "more than the" — that produced
 * "more than the over the Games limit" in the first build.
 */
function declineExplanation(
  reason: string | null,
  line: { display_name: string; amount: number } | null | undefined,
  amount: number,
): string {
  const spent = money(Math.abs(amount));
  if (reason === 'not enough money') return `There wasn't enough in checking for this one. It was ${spent}.`;
  if (reason === 'blocked merchant') return 'You and your Navigator agreed not to use this shop.';
  if (reason === 'card paused') return 'Your card is paused right now.';
  if (reason === 'card reported lost') return 'This card was reported lost, so it stopped working.';
  if (line) return `This was more than you had left for ${line.display_name} this month. It was ${spent}.`;
  return `This one was ${spent}.`;
}

function nextResetLabel(period: string): string {
  const now = new Date();
  if (period === 'month') {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  if (period === 'week') return 'Monday';
  return 'tomorrow';
}
