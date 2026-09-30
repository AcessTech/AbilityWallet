import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Hero, Loading, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { longDate, money } from '../../../src/lib/format';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * One repeating stream, found by the detector after two cycles.
 */
export default function RecurringDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['recurring', id],
    queryFn: async () => {
      const [{ data: stream }, { data: predicted }] = await Promise.all([
        supabase.from('income_schedules').select('*').eq('id', id).single(),
        supabase.from('predicted_deposits').select('*').eq('schedule_id', id).order('expected_on'),
      ]);
      return { stream, predicted: predicted ?? [] };
    },
  });

  const pill = navigatorPill(otherFirstName);
  const s = data?.stream;

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      {isLoading || !s ? (
        <Loading />
      ) : (
        <>
          <Title title={s.source} sub={kindLabel(s.kind)} />
          <Hero amount={money(s.amount)} />

          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row name="Times seen" value={String(s.cycles_seen)} />
            <Row name="Last one" value={s.last_seen_on ? longDate(s.last_seen_on) : '—'} />
            <Row
              name="How sure"
              value={s.prediction_confidence === 'HIGH' ? 'Certain' : 'Fairly sure'}
              last
            />
          </Card>

          {data.predicted.length ? (
            <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
              {data.predicted.map((p, i) => (
                <Row
                  key={p.id}
                  name={longDate(p.expected_on)}
                  value={money(p.amount)}
                  last={i === data.predicted.length - 1}
                />
              ))}
            </Card>
          ) : null}

          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>{explain(s.kind)}</Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}

function kindLabel(kind: string): string {
  return { ssi: 'Social Security (SSI)', ssdi: 'Social Security (SSDI)', wages: 'Pay from work', other: 'Not tagged yet' }[kind] ?? kind;
}

function explain(kind: string): string {
  if (kind === 'ssi') return 'SSI arrives on the 1st of the month, or the business day before if the 1st is a weekend or holiday.';
  if (kind === 'ssdi') return 'SSDI arrives on a Wednesday set by date of birth, or on the 3rd for older claims and for people drawing both.';
  if (kind === 'wages') return 'Learned from the pattern of deposits. Variable hours show the average of the last three.';
  return 'Not tagged yet. The app will ask once whether this is pay from work.';
}
