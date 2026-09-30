import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Circle } from 'react-native-svg';
import { Card, Loading, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money } from '../../../src/lib/format';
import { color } from '../../../src/theme/tokens';
import { navigatorPill } from '../../../src/lib/pills';

/** Shared savings goals appear on her Plan tab (decided Sep 23). */
export default function NavigatorGoal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const { data } = await supabase.from('savings_goals').select('*').eq('id', id).single();
      return data;
    },
  });

  const pill = navigatorPill(otherFirstName);

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Title title={data.name} />
          <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
            <GoalRing fraction={Number(data.target) > 0 ? Number(data.saved) / Number(data.target) : 0} />
            <View style={{ marginTop: 12 }}>
              <Muted>
                {money(data.saved, { cents: false })} of {money(data.target, { cents: false })}
              </Muted>
            </View>
          </Card>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="Still to go" value={money(Math.max(Number(data.target) - Number(data.saved), 0))} />
            <Row name="Agreed by" value={data.agreed_by.length >= 2 ? `You and ${otherFirstName}` : 'Waiting'} last />
          </Card>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>Goals only exist when you both agree.</Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}

function GoalRing({ fraction }: { fraction: number }) {
  const c = 2 * Math.PI * 34;
  return (
    <Svg viewBox="0 0 84 84" width={140} height={140}>
      <Circle cx={42} cy={42} r={34} fill="none" stroke={color.ringTrack} strokeWidth={9} />
      <Circle
        cx={42}
        cy={42}
        r={34}
        fill="none"
        stroke={color.green}
        strokeWidth={9}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(fraction, 1))}
        transform="rotate(-90 42 42)"
      />
    </Svg>
  );
}
