import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BrandHeader, Card, Empty, Loading, Muted, Row, Screen, Section,
} from '../../../src/components/ui';
import { BudgetBar } from '../../../src/features/BudgetBar';
import { LevelBar, LevelHeading, levelDescription } from '../../../src/features/LevelBar';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money, monthLabel } from '../../../src/lib/format';
import { color, font } from '../../../src/theme/tokens';
import type { MemberHome } from '../../../src/data/hooks';

interface Plan {
  level: number;
  budget: MemberHome['budget'];
  blocks: { id: string; kind: string; target: string; label: string; status: string; since: string | null; attempts_stopped: number }[];
  goals: { id: string; name: string; target: number; saved: number }[];
  waiting: { id: string; kind: string; payload: Record<string, unknown>; created_at: string }[];
  asked_by_member: { id: string; kind: string; payload: Record<string, unknown>; created_at: string }[];
}

/**
 * Navigator Plan tab: the support level ->
 * the unified budget list -> Blocked -> shared goals -> Analytics rows.
 * This tab is the only place in the app where levels are named.
 */
export default function NavigatorPlan() {
  const router = useRouter();
  const { activeMemberId, otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['navigator_plan', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async (): Promise<Plan> => {
      const { data, error } = await supabase.rpc('navigator_plan', { p_member: activeMemberId! });
      if (error) throw error;
      return data as unknown as Plan;
    },
  });

  const activeBlocks = data?.blocks.filter((b) => b.status === 'active') ?? [];

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
          <Section first>Support level</Section>
          <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }} onPress={() => router.push('/(navigator)/level')}>
            <LevelBar level={data.level} />
            <LevelHeading level={data.level} />
            <View style={{ marginTop: 6 }}>
              <Muted>{levelDescription(data.level, otherFirstName)}</Muted>
            </View>
            <Text style={{ fontFamily: font.semibold, fontSize: 13, color: color.soft, marginTop: 8 }}>
              More involvement needs {otherFirstName || 'their'} OK. Less happens right away.
            </Text>
          </Card>

          {data.asked_by_member.length ? (
            <>
              <Section>{otherFirstName} asked you</Section>
              <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
                {data.asked_by_member.map((c, i) => (
                  <Row
                    key={c.id}
                    name={String(c.payload.headline ?? c.kind)}
                    chevron
                    last={i === data.asked_by_member.length - 1}
                    onPress={() => router.push({ pathname: '/(navigator)/request/[id]', params: { id: c.id } })}
                  />
                ))}
              </Card>
            </>
          ) : null}

          <Section>Budget</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <Text style={{ fontFamily: font.black, fontSize: 16, color: color.navy }}>
                {monthLabel(new Date())}
              </Text>
            </View>
            {data.budget.length === 0 ? (
              <Empty text="No budget lines yet." icon="bars" />
            ) : (
              data.budget.map((l, i) => (
                <Pressable
                  key={l.id}
                  onPress={() => router.push({ pathname: '/(navigator)/limit/[id]', params: { id: l.id } })}
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                  <BudgetBar line={l} last={i === data.budget.length - 1} />
                </Pressable>
              ))
            )}
          </Card>

          <Section>Blocked</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {activeBlocks.length === 0 ? (
              <Empty text="Nothing is blocked. Known scams are always blocked for everyone." icon="ban" />
            ) : (
              activeBlocks.map((b, i) => (
                <Row
                  key={b.id}
                  name={b.label}
                  sub={b.attempts_stopped > 0 ? `${b.attempts_stopped} stopped` : undefined}
                  chevron
                  last={i === activeBlocks.length - 1}
                  onPress={() => router.push({ pathname: '/(navigator)/block/[id]', params: { id: b.id } })}
                />
              ))
            )}
          </Card>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="Add a block" chevron last onPress={() => router.push('/(navigator)/blocks')} />
          </Card>

          <Section>Goals</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.goals.length === 0 ? (
              <Empty text="No goals yet. Goals only exist when you both agree." icon="save" />
            ) : (
              data.goals.map((g, i) => (
                <Row
                  key={g.id}
                  name={g.name}
                  sub={`${money(g.saved, { cents: false })} of ${money(g.target, { cents: false })}`}
                  chevron
                  last={i === data.goals.length - 1}
                  onPress={() => router.push({ pathname: '/(navigator)/goal/[id]', params: { id: g.id } })}
                />
              ))
            )}
          </Card>

          <Section>Analytics</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="Cash flow" chevron onPress={() => router.push('/(navigator)/analytics')} />
            <Row name="Spending" chevron onPress={() => router.push('/(navigator)/analytics')} />
            <Row name="Balance and the $2,000 limit" chevron last onPress={() => router.push('/(navigator)/analytics')} />
          </Card>
        </>
      )}
    </Screen>
  );
}
