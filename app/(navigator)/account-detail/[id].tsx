import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Empty, Hero, Loading, Muted, Screen, Section, SubHeader, Title,
} from '../../../src/components/ui';
import { TxnRow } from '../../../src/features/TxnRow';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money } from '../../../src/lib/format';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * Prototype screens `maria/n_acct_checking`, `n_acct_able`,
 * `n_acct_emergency`, `n_acct_ebt` — her view of one account.
 */
export default function NavigatorAccountDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { otherFirstName } = useSession();

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

  const pill = navigatorPill(otherFirstName);
  const a = data?.account;

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      {isLoading || !a ? (
        <Loading />
      ) : (
        <>
          <Title title={a.name} sub={a.program_name ?? undefined} />
          <Hero amount={money(a.balance)} />

          {a.kind === 'able' ? (
            <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
              <Muted>
                ABLE savings are excluded from the $2,000 resource limit, up to $100,000.
              </Muted>
            </Card>
          ) : null}
          {a.kind === 'ebt' ? (
            <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
              <Muted>
                EBT is a benefit, not a resource. It never counts toward the limit, and its
                purchases do not go through our ledger.
              </Muted>
            </Card>
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
                  navigatorView
                  last={i === data.txns.length - 1}
                  onPress={() => router.push({ pathname: '/(navigator)/txn/[id]', params: { id: t.id } })}
                />
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
