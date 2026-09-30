import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Hero, Loading, Muted, Row, Screen, SubHeader, Title } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { money } from '../../src/lib/format';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Prototype screen `alex/able_room` — "Room to add this year".
 * The 2026 ABLE contribution cap is $20,000 (prd.md §5.5); the number lives in
 * app_config because it changes annually.
 */
export default function AbleRoom() {
  const router = useRouter();
  const { activeMemberId } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['member_save', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('member_save', { p_member: activeMemberId! });
      if (error) throw error;
      return data as unknown as { able_balance: number; able_room_this_year: number };
    },
  });

  const cap = 20000;

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Room to add this year" />
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Hero amount={money(data.able_room_this_year, { cents: false })} />
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="Added this year" value={money(cap - data.able_room_this_year, { cents: false })} />
            <Row name="Most you can add" value={money(cap, { cents: false })} last />
          </Card>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              There is a limit on how much can go into ABLE savings each year. It starts over
              on January 1.
            </Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}
