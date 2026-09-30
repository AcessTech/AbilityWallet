import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Btn, Card, Loading, Option, Screen, Section, Stepper, SubHeader, Title,
} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { money } from '../../src/lib/format';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Prototype screen `alex/ask_change` — the calm path to asking for a change.
 * It lives in Account, never on a decline (Appendix A §2.6).
 */
export default function AskToChange() {
  const router = useRouter();
  const { activeMemberId, otherFirstName } = useSession();
  const [pick, setPick] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: lines, isLoading } = useQuery({
    queryKey: ['budget_status', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase.rpc('budget_status', { p_member: activeMemberId! });
      return (data ?? []) as { id: string; display_name: string; amount: number }[];
    },
  });

  const chosen = lines?.find((l) => l.id === pick);

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Ask to change something" sub={`${otherFirstName} answers. Nothing changes until they do.`} />

      {isLoading || !lines ? (
        <Loading />
      ) : (
        <>
          <Section first>What would you like to change?</Section>
          {lines.map((l) => (
            <Option
              key={l.id}
              label={l.display_name}
              desc={`${money(l.amount, { cents: false })} a month now`}
              selected={pick === l.id}
              onPress={() => {
                setPick(l.id);
                setAmount(Number(l.amount));
              }}
            />
          ))}

          {chosen && amount != null ? (
            <>
              <Card style={{ paddingVertical: 22, paddingHorizontal: 20, alignItems: 'center', marginTop: 14 }}>
                <Stepper value={amount} step={10} onChange={setAmount} format={(n) => money(n, { cents: false })} />
              </Card>
              <Btn
                label={`Ask ${otherFirstName}`}
                busy={busy}
                disabled={amount === Number(chosen.amount)}
                onPress={async () => {
                  setBusy(true);
                  await supabase.rpc('propose_consent', {
                    p_member: activeMemberId!,
                    p_kind: 'LIMIT_CHANGE',
                    p_headline: `${chosen.display_name} — ${money(amount, { cents: false })}`,
                    p_body: 'They asked to change this amount.',
                    p_payload: {
                      budget_line_id: chosen.id,
                      amount,
                      label: chosen.display_name,
                    } as never,
                  });
                  setBusy(false);
                  router.replace('/(member)/ask-sent');
                }}
              />
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
