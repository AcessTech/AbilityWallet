import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { OnboardScreen, ErrorLine } from '../../../src/components/Onboard';
import { Btn, CardArt, Field, Hint, Loading, Muted } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { maskDate, parseMaskedDate } from '../../../src/lib/format';
import { color, font } from '../../../src/theme/tokens';

type Peek =
  | { state: 'ok'; navigator_first_name: string; member_first_name: string; member_last_name: string; email: string }
  | { state: 'not_found' | 'expired' | 'already_used' | 'locked' };

type Step = 'loading' | 'password' | 'dob' | 'accept' | 'card' | 'dead';

/**
 * The Member's side of the invite: create a password, confirm the date of
 * birth (an inline miss, then locked after two), the consent moment, then the
 * card.
 */
export default function AcceptInvite() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { refresh } = useSession();

  const [peek, setPeek] = useState<Peek | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(2);
  const [last4, setLast4] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.rpc('peek_invite', { p_token: token }).then(({ data }) => {
      const p = data as Peek | null;
      setPeek(p);
      setStep(p?.state === 'ok' ? 'password' : 'dead');
    });
  }, [token]);

  if (step === 'loading' || !peek) return <Loading />;

  /* The dead ends. */
  if (step === 'dead' || peek.state !== 'ok') {
    const copy = {
      not_found: ['This link doesn’t work', 'Ask for a new one.'],
      expired: ['This link has expired', 'Links last 7 days. Ask for a new one.'],
      already_used: ['This link was already used', 'Sign in instead.'],
      locked: ['We couldn’t check it was you', 'Call us and we’ll sort it out.'],
    }[peek.state as 'not_found' | 'expired' | 'already_used' | 'locked'];

    return (
      <OnboardScreen
        showBack={false}
        question={copy[0]}
        sub={copy[1]}
        footer={<Btn label="Go to sign in" onPress={() => router.replace('/(auth)/sign-in')} />}
      />
    );
  }

  const navName = peek.navigator_first_name || 'Someone';
  const myName = `${peek.member_first_name} ${peek.member_last_name}`.trim();

  /* Create a password. */
  if (step === 'password') {
    return (
      <OnboardScreen
        showBack={false}
        question="Make a password"
        sub={`You'll use it with ${peek.email} to sign in.`}
        footer={
          <Btn
            label="Continue"
            disabled={password.length < 8}
            busy={busy}
            onPress={async () => {
              setBusy(true);
              setError('');
              const { data, error: e } = await supabase.auth.signUp({
                email: peek.email,
                password,
                options: {
                  data: {
                    role: 'member',
                    first_name: peek.member_first_name,
                    last_name: peek.member_last_name,
                  },
                },
              });
              setBusy(false);
              if (e) return setError(e.message);
              if (!data.session) return setError('Check your email to confirm this address, then open the link again.');
              setStep('dob');
            }}
          />
        }
      >
        <Field
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
          accessibilityLabel="Password"
        />
        <Hint>At least 8 characters.</Hint>
        <ErrorLine>{error}</ErrorLine>
      </OnboardScreen>
    );
  }

  /* Confirm the date of birth. A miss shows inline. */
  if (step === 'dob') {
    return (
      <OnboardScreen
        showBack={false}
        question="Confirm your date of birth"
        footer={
          <Btn
            label="Continue"
            disabled={parseMaskedDate(dob) === null}
            busy={busy}
            onPress={async () => {
              setBusy(true);
              setError('');
              const { data } = await supabase.rpc('verify_invite_dob', {
                p_token: token,
                p_dob: parseMaskedDate(dob) as string,
              });
              const r = data as { ok: boolean; state?: string; attempts_left?: number };
              if (r?.ok) {
                const { data: acc } = await supabase.rpc('accept_member_invite', { p_token: token });
                setBusy(false);
                if (!(acc as { ok: boolean })?.ok) {
                  setError('That invite is no longer good. Ask for a new one.');
                  return;
                }
                await refresh();
                const { data: card } = await supabase
                  .from('member_cards')
                  .select('last4')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                setLast4(card?.last4 ?? '');
                setStep('accept');
                return;
              }
              setBusy(false);
              if (r?.state === 'locked') {
                setPeek({ state: 'locked' });
                setStep('dead');
                return;
              }
              setAttemptsLeft(r?.attempts_left ?? 1);
              setError("That date doesn't match. Try again.");
              setDob('');
            }}
          />
        }
      >
        <Field
          placeholder="MM / DD / YYYY"
          value={dob}
          onChangeText={(t) => setDob(maskDate(t))}
          keyboardType="number-pad"
          accessibilityLabel="Date of birth"
        />
        <ErrorLine>{error}</ErrorLine>
        {error && attemptsLeft === 1 ? (
          <View style={{ marginTop: 10 }}>
            <Muted>One more try.</Muted>
          </View>
        ) : null}
      </OnboardScreen>
    );
  }

  /* The consent moment. No capability text, no extra links. */
  if (step === 'accept') {
    return (
      <OnboardScreen
        showBack={false}
        question={`${navName} set up a card for you`}
        footer={
          <>
            <Btn label="OK" onPress={() => setStep('card')} />
            <Text style={{
              marginTop: 14,
              fontFamily: font.semibold,
              fontSize: 13,
              color: color.soft,
              textAlign: 'center',
              lineHeight: 19,
            }}>
              By tapping OK you agree to the Terms of Service and Account Agreement.
            </Text>
          </>
        }
      >
        <CardArt name={myName} last4={last4 || '0000'} />
      </OnboardScreen>
    );
  }

  /* The card. */
  return (
    <OnboardScreen
      showBack={false}
      question="Your card is ready"
      footer={
        <>
          <Btn label="Add to Apple Wallet" kind="dark" onPress={() => router.replace('/(member)/(tabs)/home')} />
          <Btn label="Not now" kind="grey" onPress={() => router.replace('/(member)/(tabs)/home')} />
        </>
      }
    >
      <CardArt name={myName} last4={last4 || '0000'} />
    </OnboardScreen>
  );
}
