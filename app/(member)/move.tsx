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

/** Move money to ABLE savings. */
export default function MoveMoney() {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeMemberId } = useSession();
  const [amount, setAmount] = useState('50');
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['move_accounts', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase
        .from('accounts')
        .select('id,kind,name,balance')
        .eq('member_id', activeMemberId!);
      return data ?? [];
    },
  });

  const checking = data?.find((a) => a.kind === 'checking');
  const able = data?.find((a) => a.kind === 'able');
  const value = Number(amount || '0');
  const tooMuch = checking ? value > Number(checking.balance) : false;

  if (isLoading || !checking || !able) {
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
      <Title title="Move money to savings" />

      <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 14 }}>
        <Text style={{ fontFamily: font.black, fontSize: 56, color: color.navy, letterSpacing: -1 }}>
          {money(value, { cents: amount.includes('.') })}
        </Text>
      </View>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="From" value={`Checking · ${money(checking.balance)}`} />
        <Row name="To" value="ABLE savings" last />
      </Card>

      {tooMuch ? <Muted>That is more than you have in checking.</Muted> : null}

      <Keypad onKey={(k) => setAmount((a) => applyKey(a, k))} />

      <Btn
        label={`Move ${money(value, { cents: amount.includes('.') })}`}
        disabled={value <= 0 || tooMuch}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          await supabase.rpc('move_money', {
            p_member: activeMemberId!,
            p_from: checking.id,
            p_to: able.id,
            p_amount: value,
            p_memo: 'Savings & goals',
            p_actor: activeMemberId!,
          });
          setBusy(false);
          qc.invalidateQueries();
          router.replace({ pathname: '/(member)/done/moved', params: { amount: String(value) } });
        }}
      />
    </Screen>
  );
}
