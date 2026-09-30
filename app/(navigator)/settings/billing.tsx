import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Loading, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { longDate, money } from '../../../src/lib/format';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * Prototype screen `maria/n_billing` — subscription and billing live in her
 * Account section (decided Sep 23).
 */
export default function Billing() {
  const router = useRouter();
  const { profile, otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('navigator_id', profile!.id)
        .maybeSingle();
      return data;
    },
  });

  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Subscription" />
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="Plan" value={data?.plan ?? 'Family'} />
            <Row name="Price" value={data ? money(data.price_cents / 100) + ' a month' : 'Free while we build'} />
            <Row name="Renews" value={data?.renews_on ? longDate(data.renews_on) : '—'} last />
          </Card>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>Nothing is being charged while the app is in testing.</Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}
