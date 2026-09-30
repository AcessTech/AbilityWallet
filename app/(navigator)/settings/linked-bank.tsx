import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Btn, Card, Empty, Loading, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * Her linked bank.
 * Money she sends comes from here. Her funds never sit in the system.
 */
export default function LinkedBank() {
  const router = useRouter();
  const { profile, otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['linked_banks', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('linked_banks').select('*').eq('owner_id', profile!.id);
      return data ?? [];
    },
  });

  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Linked bank" />
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.length === 0 ? (
              <Empty text="No bank linked yet." icon="bank" />
            ) : (
              data.map((b, i) => (
                <Row
                  key={b.id}
                  icon="bank"
                  name={b.institution}
                  sub={`${b.account_type} •••• ${b.last4}`}
                  value={b.is_default ? 'Default' : undefined}
                  last={i === data.length - 1}
                />
              ))
            )}
          </Card>
          <Btn label="Add a bank account" kind="grey" onPress={() => router.push('/(navigator)/settings/add-bank')} />
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20, marginTop: 14 }}>
            <Muted>
              Money you send comes straight from your own bank. It never sits in Ability Wallet.
            </Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}
