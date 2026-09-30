import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Btn, Card, Loading, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { navigatorPill } from '../../../src/lib/pills';

/** One alert, opened from Home or Activity. */
export default function AlertDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['alert', id],
    queryFn: async () => {
      const { data } = await supabase.from('alerts').select('*').eq('id', id).single();
      return data;
    },
  });

  useEffect(() => {
    if (data && !data.read_at) {
      supabase.from('alerts').update({ read_at: new Date().toISOString() }).eq('id', id).then(() => {});
    }
  }, [data, id]);

  const pill = navigatorPill(otherFirstName);
  const txnId = (data?.payload as { transaction_id?: string } | null)?.transaction_id;

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Title title={data.title} />
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="When" value={new Date(data.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} />
            <Row name="Group" value={groupLabel(data.grp)} last />
          </Card>

          {txnId ? (
            <Btn
              label="See the purchase"
              onPress={() => router.push({ pathname: '/(navigator)/txn/[id]', params: { id: txnId } })}
            />
          ) : null}

          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>Everything that happens on the account is kept, whether or not it reached you.</Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}

function groupLabel(grp: string): string {
  return {
    card_safety: 'Card safety and fraud',
    declines: 'Declined purchases',
    limits: 'Limits and budget',
    money: 'Money in and out',
    benefits: 'Benefit warnings',
    questions: 'Questions',
    setup: 'Setting up',
  }[grp] ?? grp;
}
