import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Success } from '../../../src/features/Success';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money } from '../../../src/lib/format';

/** Success screen after using emergency money. */
export default function EmergencyMoved() {
  const router = useRouter();
  const { amount } = useLocalSearchParams<{ amount: string }>();
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
  const emergency = data?.find((a) => a.kind === 'emergency');

  return (
    <Success
      title="Money moved"
      detail={`${money(Number(amount))} is in your checking now.`}
      balances={[
        ...(checking ? [{ label: 'Checking', amount: Number(checking.balance) }] : []),
        ...(emergency ? [{ label: 'Emergency money', amount: Number(emergency.balance) }] : []),
      ]}
      onDone={() => router.replace('/(member)/(tabs)/home')}
    />
  );
}
