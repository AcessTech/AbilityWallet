import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Success } from '../../../src/features/Success';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money } from '../../../src/lib/format';

/** "Paid back from ABLE" success screen. */
export default function QdePaidBack() {
  const router = useRouter();
  const { amount, merchant } = useLocalSearchParams<{ amount: string; merchant: string }>();
  const { activeMemberId } = useSession();

  const { data } = useQuery({
    queryKey: ['balances_after', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase
        .from('accounts')
        .select('kind,name,balance')
        .eq('member_id', activeMemberId!);
      return data ?? [];
    },
  });

  const checking = data?.find((a) => a.kind === 'checking');
  const able = data?.find((a) => a.kind === 'able');

  return (
    <Success
      title="Paid back"
      detail={`${money(Number(amount))} came out of your ABLE savings for ${merchant}.`}
      balances={[
        ...(checking ? [{ label: 'Checking', amount: Number(checking.balance) }] : []),
        ...(able ? [{ label: 'ABLE savings', amount: Number(able.balance) }] : []),
      ]}
      onDone={() => router.replace('/(member)/(tabs)/home')}
    />
  );
}
