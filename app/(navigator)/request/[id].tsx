import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Loading, Plain, Screen, SubHeader, Title, YesNo,
} from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money } from '../../../src/lib/format';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * A change the Member asked for, waiting on her answer (A12). Same card shape
 * as his: the thing, one sentence, static Yes / No.
 */
export default function Request() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { otherFirstName } = useSession();
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['consent', id],
    queryFn: async () => {
      const { data } = await supabase.from('consents').select('*').eq('id', id).single();
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

  const payload = data.payload as { amount?: number; label?: string; level?: number };

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title={describe(data.kind, payload, otherFirstName)} />

      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>{body(data.kind, payload, otherFirstName)}</Plain>
        <YesNo
          busy={busy}
          onYes={async () => {
            setBusy(true);
            await supabase.rpc('answer_consent_as_navigator', { p_consent: id, p_yes: true });
            setBusy(false);
            router.back();
          }}
          onNo={async () => {
            setBusy(true);
            await supabase.rpc('answer_consent_as_navigator', { p_consent: id, p_yes: false });
            setBusy(false);
            router.back();
          }}
        />
      </Card>
    </Screen>
  );
}

function describe(kind: string, p: { amount?: number; label?: string }, name: string): string {
  if (kind === 'LIMIT_CHANGE' && p.amount != null) return `${p.label ?? 'A limit'} — ${money(p.amount, { cents: false })}`;
  if (kind === 'BLOCK_ADD') return p.label ?? 'A new block';
  if (kind === 'BLOCK_REMOVE') return p.label ?? 'Remove a block';
  if (kind === 'AI_HELPER_ON') return 'Turn on the AI helper';
  return `${name} asked for something`;
}

function body(kind: string, p: { amount?: number }, name: string): string {
  if (kind === 'LIMIT_CHANGE') return `${name} asked to change this amount. OK?`;
  if (kind === 'BLOCK_ADD') return `${name} asked to block this. OK?`;
  if (kind === 'BLOCK_REMOVE') return `${name} asked to unblock this. It ends only if you agree too.`;
  if (kind === 'AI_HELPER_ON') return `${name} would like to turn on the AI helper. OK?`;
  return `${name} asked for a change. OK?`;
}
