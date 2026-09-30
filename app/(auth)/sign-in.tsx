import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardScreen, ErrorLine } from '../../src/components/Onboard';
import { Btn, Field } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { color, font } from '../../src/theme/tokens';

/**
 * glob-01 Sign in — email and password (decided Sep 29).
 *
 * NOT IN THE PROTOTYPE. screens.md marks glob-01 as SPEC; the only drawn
 * sign-in shape is the old phone-and-texted-code one, which the Sep 29
 * decision replaced. Built here in the onboarding walkthrough's own pattern
 * so the app can be opened; needs Eric's review.
 *
 * ob-30 (wrong email or password) renders as the inline error line.
 */
export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    const { error: e } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (e) {
      setError(
        e.message.toLowerCase().includes('invalid')
          ? "That email and password don't match. Try again."
          : e.message,
      );
      return;
    }
    router.replace('/');
  }

  const ready = email.includes('@') && password.length >= 8;

  return (
    <OnboardScreen
      question="Sign in"
      sub="Use the email and password you set up."
      footer={
        <>
          <Btn label="Sign in" onPress={submit} disabled={!ready} busy={busy} />
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityRole="button"
            style={{ paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: font.extrabold, fontSize: 16, color: color.navy }}>
              Forgot password
            </Text>
          </Pressable>
        </>
      }
    >
      <Field
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        accessibilityLabel="Email"
      />
      <Field
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        accessibilityLabel="Password"
      />
      <ErrorLine>{error}</ErrorLine>
    </OnboardScreen>
  );
}
