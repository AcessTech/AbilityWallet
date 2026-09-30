import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Btn, Card, Keypad, Loading, Muted, Row, Screen, SubHeader, Title, applyKey,
} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { money } from '../../src/lib/format';
import { color, font } from '../../src/theme/tokens';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Use emergency money.
 *
 * He never needs permission to reach his emergency money. There is no approval
 * step: the alert to his Navigator (A10) is the whole mechanism.
 */
export default function UseEmergencyMoney() {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeMemberId } = useSession();
  const [amount, setAmount] = useState('25');
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['emergency_accounts', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase
        .from('accounts')
        .select('id,kind,name,balance')
        .eq('member_id', activeMemberId!);
      return data ?? [];
    },
  });

  const emergency = data?.find((a) => a.kind === 'emergency');
  const checking = data?.find((a) => a.kind === 'checking');
  const value = Number(amount || '0');
  const tooMuch = emergency ? value > Number(emergency.balance) : false;

  if (isLoading || !emergency || !checking) {
    return (
      <Screen>
        <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Use emergency money" />

      <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 14 }}>
        <Text style={{ fontFamily: font.black, fontSize: 56, color: color.navy, letterSpacing: -1 }}>
          {money(value, { cents: amount.includes('.') })}
        </Text>
      </View>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="From" value={`Emergency money · ${money(emergency.balance)}`} />
        <Row name="To" value="Checking" last />
      </Card>

      {tooMuch ? <Muted>That is more than you have set aside.</Muted> : null}

      <Keypad onKey={(k) => setAmount((a) => applyKey(a, k))} />

      <Btn
        label={`Move ${money(value, { cents: amount.includes('.') })}`}
        disabled={value <= 0 || tooMuch}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          await supabase.rpc('use_emergency_money', {
            p_member: activeMemberId!,
            p_amount: value,
          });
          setBusy(false);
          qc.invalidateQueries();
          router.replace({ pathname: '/(member)/done/emergency', params: { amount: String(value) } });
        }}
      />
    </Screen>
  );
}
