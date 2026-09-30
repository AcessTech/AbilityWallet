import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Hero, Loading, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { longDate, money } from '../../../src/lib/format';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * Prototype screens `alex/save_ss` and `alex/save_acme` — one predicted
 * deposit. These are dated predictions, not a restatement of a schedule
 * (Appendix A §2.7).
 */
export default function ComingIn() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['predicted_deposit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predicted_deposits')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Title title={data.source} />
          <Hero amount={money(data.amount, { sign: true })} />
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="Expected" value={longDate(data.expected_on)} last />
          </Card>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              {data.prediction_confidence === 'HIGH'
                ? 'This one arrives on the same schedule every time.'
                : 'This is what we expect based on the last few times. The amount can change.'}
            </Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}
