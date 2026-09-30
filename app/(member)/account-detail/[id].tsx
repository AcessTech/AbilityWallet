import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Btn, Card, Empty, Hero, Loading, Muted, Row, Screen, Section, SubHeader, Title,
} from '../../../src/components/ui';
import { TxnRow } from '../../../src/features/TxnRow';
import { supabase } from '../../../src/lib/supabase';
import { money } from '../../../src/lib/format';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * One account: checking, ABLE, emergency or EBT. Account rows open account
 * detail screens.
 */
export default function MemberAccountDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['account_detail', id],
    queryFn: async () => {
      const [{ data: account }, { data: txns }] = await Promise.all([
        supabase.from('accounts').select('*').eq('id', id).single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('account_id', id)
          .neq('rail', 'internal')
          .order('occurred_at', { ascending: false })
          .limit(30),
      ]);
      return { account, txns: txns ?? [] };
    },
  });

  const a = data?.account;

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />

      {isLoading || !a ? (
        <Loading />
      ) : (
        <>
          <Title title={a.name} />
          <Hero amount={money(a.balance)} />

          {a.kind === 'able' ? (
            <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
              <Muted>
                Money here does not count against the $2,000 limit on your Social Security
                savings.
              </Muted>
            </Card>
          ) : null}

          {a.kind === 'emergency' ? (
            <Btn label="Use emergency money" onPress={() => router.push('/(member)/emergency')} />
          ) : null}

          {a.kind === 'checking' ? (
            <Btn label="Move money to savings" onPress={() => router.push('/(member)/move')} />
          ) : null}

          <Section>Recent</Section>
          <Card style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
            {data.txns.length === 0 ? (
              <Empty text="Nothing here yet." icon="dollar" />
            ) : (
              data.txns.map((t, i) => (
                <TxnRow
                  key={t.id}
                  txn={t}
                  last={i === data.txns.length - 1}
                  onPress={() => router.push({ pathname: '/(member)/txn/[id]', params: { id: t.id } })}
                />
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
