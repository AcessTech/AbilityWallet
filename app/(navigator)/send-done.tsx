import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Success } from '../../src/features/Success';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { money } from '../../src/lib/format';

/** Prototype screen `maria/nsenddone` — "Money sent". */
export default function SendDone() {
  const router = useRouter();
  const { amount, repeat } = useLocalSearchParams<{ amount: string; repeat: string }>();
  const { activeMemberId, otherFirstName } = useSession();

  const { data } = useQuery({
    queryKey: ['checking_after', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase
        .from('accounts')
        .select('name,balance')
        .eq('member_id', activeMemberId!)
        .eq('kind', 'checking')
        .maybeSingle();
      return data;
    },
  });

  return (
    <Success
      title="Money sent"
      detail={
        repeat
          ? `${money(Number(amount))} to ${otherFirstName}, and again on this day every month.`
          : `${money(Number(amount))} to ${otherFirstName}.`
      }
      balances={data ? [{ label: `${otherFirstName}'s checking`, amount: Number(data.balance) }] : []}
      onDone={() => router.replace('/(navigator)/(tabs)/home')}
    />
  );
}
