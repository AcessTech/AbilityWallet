import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar, Btn, Card, Loading, Muted, Note, Row, Screen, SubHeader, Title,
} from '../../src/components/ui';
import { LEVEL_NAMES } from '../../src/features/LevelBar';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { navigatorPill } from '../../src/lib/pills';
import { color } from '../../src/theme/tokens';

/**
 * The support level list with a "Now"
 * marker and plain behaviour descriptions.
 *
 * Up needs his OK. Down takes effect straight away with a notice: a decrease
 * in oversight never needs approval.
 */
const BEHAVIOUR = [
  'Banks alone. You can send messages; you see nothing else.',
  'You see balances and spending. No limits.',
  'Going over a limit sends an alert.',
  'Purchases over a limit are declined.',
  'You manage benefit money. Needs a legal document.',
];

export default function SupportLevelScreen() {
  const router = useRouter();
  const { activeMemberId, otherFirstName, refresh } = useSession();
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: current, isLoading } = useQuery({
    queryKey: ['level', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase.rpc('auth_level_for', { p_member: activeMemberId! });
      return (data as number) ?? 2;
    },
  });

  const pill = navigatorPill(otherFirstName);
  const target = picked ?? current ?? 2;
  const going = target > (current ?? 2) ? 'up' : target < (current ?? 2) ? 'down' : 'same';

  if (isLoading || current == null) {
    return (
      <Screen>
        <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Support level" />

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        {LEVEL_NAMES.map((name, i) => {
          const level = i + 1;
          const isNow = level === current;
          const isPicked = level === target && !isNow;
          return (
            <View key={name} style={level < current ? { opacity: 0.45 } : undefined}>
              <Row
                name={name}
                sub={BEHAVIOUR[i]}
                last={level === 5}
                onPress={level < current ? undefined : () => setPicked(level)}
                right={
                  isNow ? (
                    <Muted>Now</Muted>
                  ) : isPicked ? (
                    <Avatar icon="check" bg={color.gold} fg={color.navy} size={26} />
                  ) : null
                }
              />
            </View>
          );
        })}
      </Card>

      {going === 'up' ? (
        <Note>
          More support means {otherFirstName} gets asked first — it starts when they say OK.
        </Note>
      ) : null}
      {going === 'down' ? (
        <Note>Less support happens right away. {otherFirstName} is told.</Note>
      ) : null}

      <Btn
        label={going === 'up' ? `Ask ${otherFirstName}` : 'Save'}
        disabled={going === 'same'}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          const { data } = await supabase.rpc('propose_level_change', {
            p_member: activeMemberId!,
            p_level: target,
          });
          setBusy(false);
          await refresh();
          const r = data as { needs_consent?: boolean } | null;
          router.replace(r?.needs_consent ? '/(navigator)/waiting' : '/(navigator)/(tabs)/plan');
        }}
      />
    </Screen>
  );
}
