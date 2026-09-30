import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card, Empty, Field, Loading, Muted, Row, Screen, Section, SubHeader, Title, Toggle,
} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { merchantKey } from '../../src/lib/format';
import { navigatorPill } from '../../src/lib/pills';

/**
 * Prototype screens `maria/nblocks`, `n_known_scams` and `n_search`.
 *
 * Two layers (Appendix A §6.5): category toggles backed by merchant codes, and
 * specific merchants. Adding a block follows the tighten rule, so it becomes a
 * question on his Home. "Known scams" is always on and is not configurable.
 */
const CATEGORY_BLOCKS = [
  { key: 'gambling', label: 'Gambling and casinos' },
  { key: 'bars', label: 'Bars and liquor stores' },
  { key: 'dating', label: 'Dating services' },
  { key: 'smoke', label: 'Smoke shops' },
  { key: 'money_transfer', label: 'Money transfers' },
];

export default function Blocks() {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeMemberId, otherFirstName } = useSession();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['blocks', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const [{ data: blocks }, { data: scams }, { data: merchants }] = await Promise.all([
        supabase.from('blocks').select('*').eq('member_id', activeMemberId!).neq('status', 'ended'),
        supabase.from('known_scams').select('*').order('label'),
        supabase
          .from('transactions')
          .select('merchant,merchant_key')
          .eq('member_id', activeMemberId!)
          .order('occurred_at', { ascending: false })
          .limit(100),
      ]);
      const seen = new Map<string, string>();
      for (const m of merchants ?? []) if (!seen.has(m.merchant_key)) seen.set(m.merchant_key, m.merchant);
      return { blocks: blocks ?? [], scams: scams ?? [], merchants: [...seen.entries()] };
    },
  });

  async function propose(kind: 'category' | 'merchant', target: string, label: string) {
    await supabase.rpc('propose_block', {
      p_member: activeMemberId!,
      p_kind: kind,
      p_target: target,
      p_label: label,
    });
    qc.invalidateQueries({ queryKey: ['blocks', activeMemberId] });
    router.push('/(navigator)/waiting');
  }

  const pill = navigatorPill(otherFirstName);
  const matches = (data?.merchants ?? []).filter(
    ([, name]) => search.length > 1 && name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Blocked" />

      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Section first>Kinds of shop</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {CATEGORY_BLOCKS.map((c, i) => {
              const existing = data.blocks.find((b) => b.kind === 'category' && b.target === c.key);
              const on = existing?.status === 'active';
              const pending = existing?.status === 'pending_add' || existing?.status === 'pending_remove';
              return (
                <Row
                  key={c.key}
                  name={c.label}
                  sub={pending ? `Waiting on ${otherFirstName}` : undefined}
                  last={i === CATEGORY_BLOCKS.length - 1}
                  right={
                    <Toggle
                      on={on}
                      onPress={() => {
                        if (pending) return;
                        if (on) {
                          supabase
                            .rpc('propose_block_removal', { p_block: existing!.id })
                            .then(() => router.push('/(navigator)/waiting'));
                        } else {
                          propose('category', c.key, c.label);
                        }
                      }}
                    />
                  }
                />
              );
            })}
          </Card>

          <Section>Always blocked</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {data.scams.map((s, i) => (
              <Row key={s.id} name={s.label} last={i === data.scams.length - 1} />
            ))}
          </Card>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              Known scams are blocked for everyone, all the time. This list is not something you
              turn off.
            </Muted>
          </Card>

          <Section>A shop in particular</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Field
              placeholder="Search a shop"
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Search a shop"
            />
            {matches.length === 0 && search.length > 1 ? (
              <Empty text="No shop by that name in the history." icon="search" />
            ) : (
              matches.slice(0, 8).map(([key, name], i) => {
                const blocked = data.blocks.some((b) => b.kind === 'merchant' && b.target === key);
                return (
                  <Row
                    key={key}
                    name={name}
                    sub={blocked ? 'Blocked' : undefined}
                    chevron={!blocked}
                    last={i === Math.min(matches.length, 8) - 1}
                    onPress={blocked ? undefined : () => propose('merchant', key, name)}
                  />
                );
              })
            )}
          </Card>

          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              Blocking something asks {otherFirstName} first. Unblocking needs you both to agree.
            </Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}
