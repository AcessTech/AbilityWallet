import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar, Card, Loading, Muted, Row, Screen, Section, SubHeader, Title,
} from '../../../src/components/ui';
import { LEVEL_NAMES } from '../../../src/features/LevelBar';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { addressLine, longDate, money } from '../../../src/lib/format';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * Prototype screen `maria/nalex` — the person she supports: their info, their
 * card, their benefits, and the offboarding link at the bottom
 * (Appendix A §6.9).
 */
export default function PersonDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      const { data: link } = await supabase.from('member_navigator').select('*').eq('id', id).single();
      if (!link?.member_id) return { link, profile: null, card: null, able: null, ssi: null };
      const [{ data: profile }, { data: card }, { data: accounts }, { data: income }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', link.member_id).maybeSingle(),
        supabase.from('member_cards').select('*').eq('member_id', link.member_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('accounts').select('kind,program_name,balance').eq('member_id', link.member_id),
        supabase.from('income_schedules').select('kind,amount').eq('member_id', link.member_id),
      ]);
      return {
        link,
        profile,
        card,
        able: (accounts ?? []).find((a) => a.kind === 'able') ?? null,
        ssi: (income ?? []).find((i) => i.kind === 'ssi') ?? null,
      };
    },
  });

  const pill = navigatorPill(otherFirstName);
  const p = data?.profile;

  if (isLoading || !data) {
    return (
      <Screen>
        <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
        <Loading />
      </Screen>
    );
  }

  if (!p) {
    return (
      <Screen>
        <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
        <Title title="Invite sent" sub={data.link?.invite_email ?? ''} />
        <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
          <Muted>
            Waiting for them to open the link. It lasts 7 days from{' '}
            {data.link?.invite_sent_at ? longDate(data.link.invite_sent_at) : 'when it was sent'}.
          </Muted>
        </Card>
        <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
          <Row
            name="Send the invite again"
            chevron
            last
            onPress={async () => {
              await supabase.rpc('resend_member_invite', { p_link_id: id });
              router.back();
            }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />

      <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Avatar letter={p.first_name.slice(0, 1).toUpperCase()} size={72} />
        <Title
          title={`${p.first_name} ${p.last_name}`.trim()}
          sub={`Level ${data.link!.level} — ${LEVEL_NAMES[data.link!.level - 1]}`}
        />
      </Card>

      <Section>Their info</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Email" value={p.email ?? ''} />
        <Row name="Date of birth" value={p.dob ?? ''} />
        <Row
          name="Address"
          value={addressLine({ line1: p.address_line1, city: p.city, state: p.state })}
          last
        />
      </Card>

      <Section>Their card</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Status" value={cardStatus(data.card?.status)} />
        <Row name="Number" value={data.card ? `•••• ${data.card.last4}` : '—'} />
        <Row name="Report lost or stolen" chevron onPress={() => router.push('/(navigator)/card-lost')} />
        <Row name="Order a replacement" chevron last onPress={() => router.push('/(navigator)/card-replace')} />
      </Card>

      <Section>Their benefits</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Social Security" value={data.ssi ? money(data.ssi.amount) + ' a month' : 'Not seen yet'} />
        <Row name="ABLE program" value={data.able?.program_name ?? 'Not set'} />
        <Row name="EBT" value="Linked" last />
      </Card>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row
          name={`Stop being ${p.first_name}'s Navigator`}
          danger
          last
          onPress={() => router.push('/(navigator)/stop')}
        />
      </Card>
    </Screen>
  );
}

function cardStatus(status: string | undefined): string {
  return {
    not_ordered: 'Not ordered',
    ordered: 'Ordered',
    shipped: 'On the way',
    delivered: 'Delivered',
    active: 'Working',
    paused: 'Paused',
    lost: 'Reported lost',
    stolen: 'Reported stolen',
    replaced: 'Replaced',
  }[status ?? ''] ?? '—';
}
