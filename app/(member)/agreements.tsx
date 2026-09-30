import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Loading, Muted, Row, Screen, Section, SubHeader, Title } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { longDate, money } from '../../src/lib/format';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * "What we agreed" — every merchant rule and every block, visible to both
 * parties. Member-facing words only; no mode tags, so a stop
 * line reads the same as a guide.
 */
export default function Agreements() {
  const router = useRouter();
  const { activeMemberId, otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['agreements', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const [{ data: rules }, { data: blocks }, { data: log }] = await Promise.all([
        supabase.from('merchant_rules').select('*').eq('member_id', activeMemberId!).order('created_at', { ascending: false }),
        supabase.from('blocks').select('*').eq('member_id', activeMemberId!).eq('status', 'active'),
        supabase.from('activity_log').select('*').eq('member_id', activeMemberId!).order('created_at', { ascending: false }).limit(40),
      ]);
      return { rules: rules ?? [], blocks: blocks ?? [], log: log ?? [] };
    },
  });

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="What we agreed" />

      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Section first>Shops we settled</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.rules.length === 0 ? (
              <Empty text="Nothing yet. When you answer a question about a shop, it goes here." />
            ) : (
              data.rules.map((r, i) => (
                <Row
                  key={r.id}
                  name={r.merchant_label}
                  sub={r.auto_reimburse ? 'Paid back from ABLE savings' : 'Not asked about again'}
                  value={longDate(r.created_at)}
                  last={i === data.rules.length - 1}
                />
              ))
            )}
          </Card>

          <Section>Shops that will not work</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.blocks.length === 0 ? (
              <Empty text="Nothing is blocked." icon="ban" />
            ) : (
              data.blocks.map((b, i) => (
                <Row
                  key={b.id}
                  name={b.label}
                  sub={b.since ? `Since ${longDate(b.since)}` : undefined}
                  last={i === data.blocks.length - 1}
                />
              ))
            )}
          </Card>

          <Section>Everything that happened</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.log.length === 0 ? (
              <Empty text="Nothing yet." />
            ) : (
              data.log.map((l, i) => (
                <Row
                  key={l.id}
                  name={l.detail || l.event.replace(/_/g, ' ')}
                  sub={longDate(l.created_at)}
                  last={i === data.log.length - 1}
                />
              ))
            )}
          </Card>

          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>Everything {otherFirstName} does on your account is written down here.</Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}
