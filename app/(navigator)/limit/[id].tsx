import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Btn, Card, Loading, Muted, Note, Row, Screen, Section, Stepper, SubHeader, Title,
} from '../../../src/components/ui';
import { modeSubLine } from '../../../src/features/BudgetBar';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { money } from '../../../src/lib/format';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * Prototype screen `maria/nlimit` — edit a limit.
 *
 * TIGHTEN = ask first: the button becomes "Ask {name}" with a gold notice, and
 * the old value stays live until he answers. LOOSEN = the button stays "Save"
 * and it applies immediately with a notice to him (Appendix A §6.4).
 */
export default function EditLimit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeMemberId, otherFirstName } = useSession();
  const [amount, setAmount] = useState<number | null>(null);
  const [mode, setMode] = useState<'guide' | 'alert' | 'stop' | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: line, isLoading } = useQuery({
    queryKey: ['budget_line', id, activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase.rpc('budget_status', { p_member: activeMemberId! });
      return ((data ?? []) as {
        id: string; display_name: string; amount: number; period: string;
        mode: 'guide' | 'alert' | 'stop'; spent: number; remaining: number;
      }[]).find((l) => l.id === id) ?? null;
    },
  });

  const { data: level } = useQuery({
    queryKey: ['level', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data } = await supabase.rpc('auth_level_for', { p_member: activeMemberId! });
      return (data as number) ?? 2;
    },
  });

  useEffect(() => {
    if (line && amount === null) {
      setAmount(Number(line.amount));
      setMode(line.mode);
    }
  }, [line, amount]);

  if (isLoading || !line || amount === null || mode === null) {
    return (
      <Screen>
        <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
        <Loading />
      </Screen>
    );
  }

  const rank = { guide: 0, alert: 1, stop: 2 } as const;
  const tightening = rank[mode] > rank[line.mode] || (line.mode !== 'guide' && amount < Number(line.amount));
  const changed = amount !== Number(line.amount) || mode !== line.mode;

  async function save() {
    setBusy(true);
    const { data } = await supabase.rpc('propose_budget_change', {
      p_line: id,
      p_amount: amount!,
      p_mode: mode!,
    });
    setBusy(false);
    const r = data as { needs_consent?: boolean } | null;
    if (r?.needs_consent) router.replace('/(navigator)/waiting');
    else router.back();
  }

  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title={line.display_name} sub={subtitleFor(mode)} />

      <Card style={{ paddingVertical: 22, paddingHorizontal: 20, alignItems: 'center' }}>
        <Section>Each {line.period}</Section>
        <Stepper value={amount} step={10} onChange={setAmount} format={(n) => money(n, { cents: false })} />
        <Muted>Now: {money(line.amount, { cents: false })}</Muted>
      </Card>

      <Section>What happens at the line</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row
          name="Just a guide"
          sub="Nothing stops. It only shows on the ring."
          onPress={() => setMode('guide')}
          right={mode === 'guide' ? <Muted>Now</Muted> : null}
        />
        {(level ?? 2) >= 3 ? (
          <Row
            name="Send me an alert"
            sub="Going over sends you an alert."
            onPress={() => setMode('alert')}
            right={mode === 'alert' ? <Muted>Now</Muted> : null}
          />
        ) : null}
        {(level ?? 2) >= 4 ? (
          <Row
            name="Stop at the register"
            sub="Purchases over this are declined."
            last
            onPress={() => setMode('stop')}
            right={mode === 'stop' ? <Muted>Now</Muted> : null}
          />
        ) : null}
      </Card>

      {tightening ? (
        <Note>
          This is tighter. {otherFirstName} gets asked first — it starts when they say OK.
        </Note>
      ) : null}

      <Btn
        label={tightening ? `Ask ${otherFirstName}` : 'Save'}
        disabled={!changed}
        busy={busy}
        onPress={save}
      />
    </Screen>
  );
}

function subtitleFor(mode: 'guide' | 'alert' | 'stop'): string {
  const sub = modeSubLine({ mode, category: '', display_name: '', amount: 0, id: '', period: 'month', spent: 0, remaining: 0, fraction_left: 0, pending_change: null });
  return sub ? `Limit · ${sub}` : 'Guide';
}
