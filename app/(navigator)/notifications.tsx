import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card, Loading, Muted, Row, Screen, Section, SubHeader, Title, Toggle,
} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { navigatorPill } from '../../src/lib/pills';

/**
 * Prototype screen `maria/nnotif` — the PagerDuty model (Appendix A §6.7).
 *
 * Routing configures interruption, not knowledge: every alert still lands in
 * the Activity feed whatever these say. "Card safety and fraud" is Push + Text
 * and is not configurable. There are no gear icons in headers — this screen is
 * reached from the Activity tab and from Account → Settings.
 */
const GROUPS: { key: string; label: string; sub: string }[] = [
  { key: 'declines', label: 'Declined purchases', sub: 'When a purchase does not go through' },
  { key: 'limits', label: 'Limits and budget', sub: 'Going over an agreed amount' },
  { key: 'money', label: 'Money in and out', sub: 'Deposits, moves to savings, emergency money' },
  { key: 'benefits', label: 'Benefit warnings', sub: 'The $2,000 limit, rent deadlines, reports' },
  { key: 'questions', label: 'Questions', sub: 'Messages and requests' },
];

const CHANNELS = [
  { key: 'push', label: 'Push' },
  { key: 'text', label: 'Text' },
  { key: 'email', label: 'Email' },
  { key: 'in_app', label: 'In app' },
] as const;

export default function NavigatorNotifications() {
  const router = useRouter();
  const qc = useQueryClient();
  const { profile, otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['alert_prefs', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const [{ data: prefs }, { data: quiet }] = await Promise.all([
        supabase.from('alert_prefs').select('*').eq('navigator_id', profile!.id),
        supabase.from('quiet_hours').select('*').eq('navigator_id', profile!.id).maybeSingle(),
      ]);
      return { prefs: prefs ?? [], quiet };
    },
  });

  async function toggleChannel(group: string, channel: string, on: boolean) {
    const row = data!.prefs.find((p) => p.grp === group);
    const next = on
      ? [...new Set([...(row?.channels ?? []), channel])]
      : (row?.channels ?? []).filter((c) => c !== channel);
    await supabase
      .from('alert_prefs')
      .upsert({ navigator_id: profile!.id, grp: group as never, channels: next as never });
    qc.invalidateQueries({ queryKey: ['alert_prefs', profile?.id] });
  }

  const pill = navigatorPill(otherFirstName);

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Notifications" />

      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Section first>Always on</Section>
          <Card
            style={{ paddingVertical: 6, paddingHorizontal: 20 }}
            onPress={() => router.push('/(navigator)/always-on')}
          >
            <Row
              name="Card safety and fraud"
              sub="Push and text, day or night. This one cannot be turned off."
              chevron
              last
            />
          </Card>

          {GROUPS.map((g) => {
            const row = data.prefs.find((p) => p.grp === g.key);
            const channels = (row?.channels ?? []) as string[];
            return (
              <React.Fragment key={g.key}>
                <Section>{g.label}</Section>
                <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
                  <Muted>{g.sub}</Muted>
                  {CHANNELS.map((c, i) => (
                    <Row
                      key={c.key}
                      name={c.label}
                      last={i === CHANNELS.length - 1}
                      right={
                        <Toggle
                          on={channels.includes(c.key)}
                          onPress={() => toggleChannel(g.key, c.key, !channels.includes(c.key))}
                        />
                      }
                    />
                  ))}
                </Card>
              </React.Fragment>
            );
          })}

          <Section>Quiet hours</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row
              name="Hold notifications overnight"
              sub={
                data.quiet?.enabled
                  ? `${formatTime(data.quiet.starts_at)} to ${formatTime(data.quiet.ends_at)}`
                  : 'Off'
              }
              right={
                <Toggle
                  on={!!data.quiet?.enabled}
                  onPress={async () => {
                    await supabase.from('quiet_hours').upsert({
                      navigator_id: profile!.id,
                      enabled: !data.quiet?.enabled,
                    });
                    qc.invalidateQueries({ queryKey: ['alert_prefs', profile?.id] });
                  }}
                />
              }
              last
            />
          </Card>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              Card safety and fraud comes through even during quiet hours. Everything else waits
              until morning, and is still timestamped when it happened.
            </Muted>
          </Card>

          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              Whatever you choose here, everything still shows in Activity. These settings only
              decide what interrupts you.
            </Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}
