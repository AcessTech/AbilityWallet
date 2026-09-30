import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen, ErrorLine } from '../../src/components/Onboard';
import { Btn, Field, Plain } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';

/**
 * glob-03 Forgot password — reset by email.
 * NOT IN THE PROTOTYPE (screens.md marks it SPEC). Needs Eric's review.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'abilitywallet://reset-password',
    });
    setBusy(false);
    if (e) setError(e.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <OnboardScreen
        question="Check your email"
        sub={`We sent a link to ${email.trim().toLowerCase()}. Open it to set a new password.`}
        footer={<Btn label="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />}
      >
        <Plain>The link works once and lasts an hour.</Plain>
      </OnboardScreen>
    );
  }

  return (
    <OnboardScreen
      question="Forgot password"
      sub="We'll email you a link to set a new one."
      footer={<Btn label="Send the link" onPress={submit} disabled={!email.includes('@')} busy={busy} />}
    >
      <Field
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        accessibilityLabel="Email"
      />
      <ErrorLine>{error}</ErrorLine>
    </OnboardScreen>
  );
}
