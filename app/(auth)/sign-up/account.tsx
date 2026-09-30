import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen, ErrorLine } from '../../../src/components/Onboard';
import { Btn, Field, Hint } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';

/**
 * Create account — email and password. Same shape as the other onboarding
 * screens (question, sub-line, fields, Continue).
 */
export default function CreateAccount() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const [error, setError] = useState('');

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim());
  const passwordOk = draft.password.length >= 8;

  function next() {
    if (!emailOk) return setError('That email address does not look right.');
    if (!passwordOk) return setError('Use at least 8 characters.');
    setError('');
    router.push('/(auth)/sign-up/name');
  }

  return (
    <OnboardScreen
      question="What's your email?"
      sub="You'll use it to sign in."
      footer={<Btn label="Continue" onPress={next} disabled={!emailOk || !passwordOk} />}
    >
      <Field
        placeholder="you@example.com"
        value={draft.email}
        onChangeText={(t) => set({ email: t })}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        accessibilityLabel="Email"
      />
      <Field
        placeholder="Make a password"
        value={draft.password}
        onChangeText={(t) => set({ password: t })}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        accessibilityLabel="Password"
      />
      <Hint>At least 8 characters.</Hint>
      <ErrorLine>{error}</ErrorLine>
    </OnboardScreen>
  );
}
