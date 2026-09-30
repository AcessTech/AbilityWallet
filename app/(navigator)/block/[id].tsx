import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Btn, Card, Loading, Muted, Row, Screen, SubHeader, Title,
} from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { longDate } from '../../../src/lib/format';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * Prototype screens `maria/nblockdetail`, `n_block_cat` and `n_remove_block`.
 *
 * Shows blocked-since, attempts stopped and who agreed. Removal is dual
 * consent: neither side can unilaterally unprotect (Appendix A §6.5).
 */
export default function BlockDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['block', id],
    queryFn: async () => {
      const { data } = await supabase.from('blocks').select('*').eq('id', id).single();
      return data;
    },
  });

  const pill = navigatorPill(otherFirstName);

  if (isLoading || !data) {
    return (
      <Screen>
        <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
        <Loading />
      </Screen>
    );
  }

  const pending = data.status === 'pending_remove';

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title={data.label} />

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Blocked since" value={data.since ? longDate(data.since) : '—'} />
        <Row name="Purchases stopped" value={String(data.attempts_stopped)} />
        <Row name="Agreed by" value={`You and ${otherFirstName}`} last />
      </Card>

      {pending ? (
        <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
          <Muted>Waiting on {otherFirstName}. It stays blocked until you both agree.</Muted>
        </Card>
      ) : (
        <>
          <Btn
            label="Ask to unblock"
            kind="grey"
            onPress={async () => {
              await supabase.rpc('propose_block_removal', { p_block: id });
              router.replace('/(navigator)/waiting');
            }}
          />
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              A block ends only when you and {otherFirstName} both agree. Neither of you can
              remove it alone.
            </Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}
