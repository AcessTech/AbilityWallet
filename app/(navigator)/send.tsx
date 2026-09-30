import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Btn, Card, Keypad, Loading, Row, Screen, SubHeader, Title, Toggle, applyKey,
} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { money } from '../../src/lib/format';
import { color, font } from '../../src/theme/tokens';
import { navigatorPill } from '../../src/lib/pills';

/**
 * Prototype screen `maria/nsend` — Send money, plus `n_send_repeat`.
 *
 * The money comes from her LINKED EXTERNAL BANK. Her funds never sit in the
 * system (brief §2 rule 10). The button states the amount.
 */
export default function SendMoney() {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeMemberId, otherFirstName } = useSession();
  const [amount, setAmount] = useState('50');
  const [repeat, setRepeat] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['send_context', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const [{ data: bank }, { data: account }] = await Promise.all([
        supabase.from('linked_banks').select('*').eq('is_default', true).limit(1).maybeSingle(),
        supabase.from('accounts').select('id,name').eq('member_id', activeMemberId!).eq('kind', 'checking').maybeSingle(),
      ]);
      return { bank, account };
    },
  });

  const value = Number(amount || '0');
  const pill = navigatorPill(otherFirstName);

  if (isLoading) {
    return (
      <Screen>
        <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
        <Loading />
      </Screen>
    );
  }

  if (!data?.bank) {
    return (
      <Screen>
        <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
        <Title title="Send money" sub="You need a bank account linked before you can send money." />
        <Btn label="Add a bank account" onPress={() => router.replace('/(navigator)/settings/add-bank')} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Send money" />

      <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 14 }}>
        <Text style={{ fontFamily: font.black, fontSize: 56, color: color.navy, letterSpacing: -1 }}>
          {money(value, { cents: amount.includes('.') })}
        </Text>
      </View>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="From" value={`My bank · ${data.bank.institution} •••• ${data.bank.last4}`} />
        <Row name="To" value={`${otherFirstName} · Checking`} />
        <Row
          name="Repeat every month"
          last
          right={<Toggle on={repeat} onPress={() => setRepeat((v) => !v)} />}
        />
      </Card>

      <Keypad onKey={(k) => setAmount((a) => applyKey(a, k))} />

      <Btn
        label={`Send ${money(value, { cents: amount.includes('.') })}`}
        disabled={value <= 0}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          const { error } = await supabase.rpc('navigator_send_money', {
            p_member: activeMemberId!,
            p_amount: value,
            p_repeat: repeat,
          });
          setBusy(false);
          if (error) return;
          qc.invalidateQueries();
          router.replace({
            pathname: '/(navigator)/send-done',
            params: { amount: String(value), repeat: repeat ? '1' : '' },
          });
        }}
      />
    </Screen>
  );
}
