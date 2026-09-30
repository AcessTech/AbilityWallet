import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Loading, Plain, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * A notice, opened from the strip on Home. No buttons: a decline is a full
 * stop, not a menu, and "Ask to change this" lives in Account, not here.
 */
export default function MemberNotice() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['notice', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('home_cards').select('*').eq('id', id).single();
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
          <Title title={data.headline} />
          <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
            <Plain>{data.body}</Plain>
          </Card>
        </>
      )}
    </Screen>
  );
}
