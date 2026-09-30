import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useQuery } from '@tanstack/react-query';
import { Btn, Card, Loading, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { color, font } from '../../../src/theme/tokens';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * "Show number".
 * Showing the full number is a sensitive action, so it asks for Face ID first.
 */
export default function ShowNumber() {
  const router = useRouter();
  const { activeMemberId } = useSession();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const { data: card } = useQuery({
    queryKey: ['member_card', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase
        .from('member_cards')
        .select('*')
        .eq('member_id', activeMemberId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    (async () => {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) {
        setUnlocked(true);
        setChecking(false);
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Show your card number',
      });
      setUnlocked(res.success);
      setChecking(false);
    })();
  }, []);

  if (checking) return <Loading />;

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Your card number" />

      {!unlocked ? (
        <>
          <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
            <Muted>We need to check it's you before showing the number.</Muted>
          </Card>
          <Btn label="Try again" onPress={() => router.replace('/(member)/card/number')} />
        </>
      ) : (
        <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
          <Row
            name="Number"
            value={card ? `•••• •••• •••• ${card.last4}` : '—'}
          />
          <Row name="Expires" value={card ? formatExpiry(card.expires_on) : '—'} />
          <Row name="Security code" value="•••" last />
        </Card>
      )}

      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>
          This is a simulated card. It does not work at real shops.
        </Muted>
      </Card>
    </Screen>
  );
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
}
