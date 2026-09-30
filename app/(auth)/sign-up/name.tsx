import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn, Field } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';

/** Sign-up: your name. */
export default function YourName() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const ready = draft.firstName.trim().length > 0 && draft.lastName.trim().length > 0;

  return (
    <OnboardScreen
      question="What's your name?"
      footer={
        <Btn label="Continue" onPress={() => router.push('/(auth)/sign-up/who')} disabled={!ready} />
      }
    >
      <Field
        placeholder="First name"
        value={draft.firstName}
        onChangeText={(t) => set({ firstName: t })}
        autoComplete="given-name"
        textContentType="givenName"
        accessibilityLabel="First name"
      />
      <Field
        placeholder="Last name"
        value={draft.lastName}
        onChangeText={(t) => set({ lastName: t })}
        autoComplete="family-name"
        textContentType="familyName"
        accessibilityLabel="Last name"
      />
    </OnboardScreen>
  );
}
