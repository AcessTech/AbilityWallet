import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Circle } from 'react-native-svg';
import {
  Ask, Card, Empty, Loading, Row, Screen, Section, TitleHeader, YesNo, uiStyles,
} from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { useAnswerCard, useMemberHome } from '../../../src/data/hooks';
import { longDate, money, moneyShort } from '../../../src/lib/format';
import { color, gaugeColor } from '../../../src/theme/tokens';

interface Save {
  coming_in: { id: string; source: string; amount: number; expected_on: string; confidence: string }[];
  able_balance: number;
  able_room_this_year: number;
  ssi_room: number;
  projected: number;
  auto_move: boolean;
  goals: { id: string; name: string; target: number; saved: number; reached_at: string | null; agreed: boolean }[];
}

/**
 * Member Save tab. Prototype screen `alex/save`: Coming in -> Tasks (the
 * sentinel card, if one is due) -> ABLE savings -> My goals.
 */
export default function MemberSave() {
  const router = useRouter();
  const { activeMemberId } = useSession();
  const answer = useAnswerCard();
  const home = useMemberHome();

  const { data, isLoading } = useQuery({
    queryKey: ['member_save', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async (): Promise<Save> => {
      const { data, error } = await supabase.rpc('member_save', { p_member: activeMemberId! });
      if (error) throw error;
      return data as unknown as Save;
    },
  });

  const task = home.data?.card?.cls === 'SENTINEL' ? home.data.card : null;

  return (
    <Screen>
      <TitleHeader title="Save" pillLabel="Need help?" onPillPress={() => router.push('/(member)/chat')} />

      {isLoading && !data ? (
        <Loading />
      ) : !data ? (
        <Card>
          <Empty text="Nothing to show yet." />
        </Card>
      ) : (
        <>
          <Section first>Coming in</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.coming_in.length === 0 ? (
              <Empty text="When money starts arriving regularly, what's coming shows here." icon="save" />
            ) : (
              data.coming_in.map((d, i) => (
                <Row
                  key={d.id}
                  name={d.source}
                  sub={longDate(d.expected_on)}
                  last={i === data.coming_in.length - 1}
                  onPress={() => router.push({ pathname: '/(member)/coming-in/[id]', params: { id: d.id } })}
                  right={
                    <Text style={[uiStyles.rval, uiStyles.rvalBig, { color: color.green }]}>
                      {money(d.amount, { sign: true })}
                    </Text>
                  }
                />
              ))
            )}
          </Card>

          {task ? (
            <>
              <Section>Tasks</Section>
              <Ask headline={task.headline} body={task.body}>
                <YesNo
                  busy={answer.isPending}
                  yesLabel={task.suggested_amount ? `Move ${moneyShort(task.suggested_amount)}` : 'Yes'}
                  noLabel="Not now"
                  onYes={() =>
                    answer.mutate({ cardId: task.id, yes: true }, {
                      onSuccess: (r) =>
                        r.moved &&
                        router.push({ pathname: '/(member)/done/moved', params: { amount: String(r.amount ?? '') } }),
                    })
                  }
                  onNo={() => answer.mutate({ cardId: task.id, yes: false })}
                />
              </Ask>
            </>
          ) : null}

          <Section>ABLE savings</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="Saved" value={money(data.able_balance, { cents: false })} big />
            <Row
              name="Room to add this year"
              value={money(data.able_room_this_year, { cents: false })}
              big
              last
              onPress={() => router.push('/(member)/able-room')}
            />
          </Card>

          <Section>My goals</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.goals.length === 0 ? (
              <Empty text="No goals yet. Goals only exist when you and your Navigator both agree." />
            ) : (
              data.goals.map((g, i) => {
                const fraction = g.target > 0 ? Math.min(g.saved / g.target, 1) : 0;
                return (
                  <Row
                    key={g.id}
                    name={g.name}
                    sub={`${money(g.saved, { cents: false })} of ${money(g.target, { cents: false })}`}
                    chevron
                    last={i === data.goals.length - 1}
                    onPress={() => router.push({ pathname: '/(member)/goal/[id]', params: { id: g.id } })}
                    right={<GoalRing fraction={fraction} />}
                  />
                );
              })
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

/** A small filling ring for a savings goal — this one fills as it grows. */
function GoalRing({ fraction }: { fraction: number }) {
  const c = 2 * Math.PI * 34;
  return (
    <Svg viewBox="0 0 84 84" width={44} height={44}>
      <Circle cx={42} cy={42} r={34} fill="none" stroke={color.ringTrack} strokeWidth={12} />
      <Circle
        cx={42}
        cy={42}
        r={34}
        fill="none"
        stroke={gaugeColor(1)}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - fraction)}
        transform="rotate(-90 42 42)"
      />
    </Svg>
  );
}
