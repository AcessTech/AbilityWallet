import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import {
  Btn, Card, Field, Muted, Row, Screen, Section, SubHeader, Title,
} from '../components/ui';
import { supabase } from '../lib/supabase';
import { useSession } from '../lib/session';
import { money } from '../lib/format';
import { color, font } from '../theme/tokens';

/**
 * The testing tools. Reachable from either Account tab while this is a test
 * build (src/lib/testBuild.ts).
 *
 * Every story here runs through the same engine the real app uses — nothing is
 * faked at the screen level, so what a tester sees is what the product does.
 */
const SCENARIOS: { code: string; title: string; note: string }[] = [
  { code: 'A2',  title: 'An everyday purchase',        note: 'Coffee, $4.50. Categorises itself, no question.' },
  { code: 'A5',  title: 'Going over a limit',          note: 'GameStop $72.50 against a $50 line. Declines, then explains.' },
  { code: 'A16', title: 'A blocked shop',              note: 'A gambling block, then a purchase that hits it.' },
  { code: 'A7',  title: 'Out of money for a ride',     note: 'Empties the Getting around line, leaves $150 in emergency money.' },
  { code: 'A10', title: 'The $2,000 warning',          note: 'Puts checking at $2,127.83 and raises the savings question.' },
  { code: 'A11', title: '"Was this for your apartment?"', note: 'Hardware Depot $41.30, with ABLE savings to pay it back from.' },
  { code: 'A12', title: 'Getting paid',                note: 'Two paycheques, which raises the pay-from-work question.' },
  { code: 'A13', title: 'A savings goal',              note: 'A gaming console, $220 of $400.' },
  { code: 'A8',  title: 'Card lost or stolen',         note: 'Cancels the card and issues a new one.' },
  { code: 'A20', title: 'Rent money waiting',          note: '$650 out of ABLE and sitting in checking.' },
  { code: 'B4',  title: 'A limit they have to agree to', note: 'Games $50 down to $40. The old amount stays live.' },
  { code: 'B6',  title: 'More oversight to agree to',  note: 'The level-up question, in behaviour words only.' },
  { code: 'B12', title: 'Money sent from a Navigator', note: '$50 arrives. Needs somebody on the other side.' },
  { code: 'BUDGET', title: 'Add a budget',             note: 'Groceries, Fun and Getting around.' },
];

export function TestTools({ pillLabel, chatHref }: { pillLabel: string; chatHref: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { profile, activeMemberId, otherFirstName, refresh } = useSession();
  const [amount, setAmount] = useState('100');
  const [partnerName, setPartnerName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [said, setSaid] = useState('');
  const [partner, setPartner] = useState<{ email: string; password: string } | null>(null);

  const hasMember = !!activeMemberId;

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key);
    setSaid('');
    try {
      setSaid(await fn());
    } catch (e) {
      setSaid(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
    qc.invalidateQueries();
  }

  return (
    <Screen>
      <SubHeader pillLabel={pillLabel} onPillPress={() => router.push(chatHref as never)} />
      <Title title="Testing" sub="For trying the app out. Not part of the real thing." />

      {!hasMember ? (
        <>
          <Section first>Set up the other side</Section>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              {profile?.role === 'navigator'
                ? 'You are a Navigator with nobody to support yet. This makes a stand-in for the other side so you can see both ends.'
                : 'You are a Member with nobody helping yet. This makes a stand-in Navigator so you can see both ends.'}
            </Muted>
          </Card>
          <Field
            placeholder={profile?.role === 'navigator' ? 'Their first name' : 'Their first name'}
            value={partnerName}
            onChangeText={setPartnerName}
            accessibilityLabel="Their first name"
          />
          <Btn
            label="Make one"
            disabled={partnerName.trim().length < 2}
            busy={busy === 'partner'}
            onPress={() =>
              run('partner', async () => {
                const created = await createCounterpart(partnerName.trim(), profile!.role);
                setPartner(created);
                await refresh();
                return `Made ${partnerName.trim()}. Sign in as them with ${created.email} and the password ${created.password}.`;
              })
            }
          />
          {partner ? (
            <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
              <Text selectable style={{ fontFamily: font.bold, fontSize: 14, color: color.navy }}>
                {partner.email}
              </Text>
              <Text selectable style={{ fontFamily: font.bold, fontSize: 14, color: color.navy, marginTop: 4 }}>
                {partner.password}
              </Text>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <Section first>Add money</Section>
          <Field
            placeholder="How much"
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            accessibilityLabel="How much"
          />
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {(['checking', 'able', 'emergency'] as const).map((kind, i) => (
              <Row
                key={kind}
                name={{ checking: 'Into checking', able: 'Into ABLE savings', emergency: 'Into emergency money' }[kind]}
                chevron
                last={i === 2}
                onPress={() =>
                  run(kind, async () => {
                    const { data, error } = await supabase.rpc('test_add_money', {
                      p_member: activeMemberId!,
                      p_kind: kind,
                      p_amount: Number(amount || '0'),
                      p_source: 'Test money',
                    });
                    if (error) throw error;
                    const r = data as unknown as { balance: number };
                    return `Added ${money(Number(amount))}. That account is now ${money(r.balance)}.`;
                  })
                }
              />
            ))}
          </Card>

          <Section>Try a story</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            {SCENARIOS.map((s, i) => (
              <Row
                key={s.code}
                name={s.title}
                sub={s.note}
                chevron
                last={i === SCENARIOS.length - 1}
                onPress={() =>
                  run(s.code, async () => {
                    const { data, error } = await supabase.rpc('test_run_scenario', {
                      p_member: activeMemberId!,
                      p_code: s.code,
                    });
                    if (error) throw error;
                    const r = data as unknown as { ok: boolean; reason?: string; declined_reason?: string };
                    if (!r.ok) return r.reason ?? 'That one did not run.';
                    if (r.declined_reason) return `Declined — ${r.declined_reason}. Go to Home to see it.`;
                    return 'Done. Go to Home to see it.';
                  })
                }
              />
            ))}
          </Card>

          <Section>Start over</Section>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>
              Clears the money, the history and the questions on this account. Keeps the person,
              their sign-in and who they are connected to.
            </Muted>
          </Card>
          <Btn
            label="Start over"
            kind="red"
            busy={busy === 'reset'}
            onPress={() =>
              run('reset', async () => {
                const { error } = await supabase.rpc('test_reset_account', {
                  p_member: activeMemberId!,
                });
                if (error) throw error;
                return 'Cleared. The account is empty again.';
              })
            }
          />
        </>
      )}

      {said ? (
        <Card style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.ink, lineHeight: 21 }}>
            {said}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

/**
 * Signs a stand-in account up through the ordinary sign-up API, on a throwaway
 * client so the tester's own session is untouched, then links the two.
 */
async function createCounterpart(firstName: string, myRole: 'member' | 'navigator') {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const scratch = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const email = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${Date.now().toString(36)}@abilitywallet.test`;
  const password = 'abilitywallet';
  const role = myRole === 'member' ? 'navigator' : 'member';

  const { data, error } = await scratch.auth.signUp({
    email,
    password,
    options: { data: { role, first_name: firstName, last_name: 'Tester' } },
  });
  if (error) throw error;
  if (!data.user) throw new Error('That did not work. Try a different name.');

  const { error: linkError } = await supabase.rpc('test_link_counterpart', {
    p_other: data.user.id,
    p_level: 4,
  });
  if (linkError) throw linkError;

  return { email, password };
}
