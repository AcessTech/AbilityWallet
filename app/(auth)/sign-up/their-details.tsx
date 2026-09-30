import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn, Field } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';

/**
 * ob-06 Their name and email. Onboarding walkthrough frame 6, with the phone
 * number replaced by an email address (decided Sep 29 — the invite goes by
 * email). Nothing is sent from this screen.
 */
export default function TheirDetails() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const ready =
    draft.theirFirstName.trim().length > 0 &&
    draft.theirLastName.trim().length > 0 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.theirEmail.trim());

  return (
    <OnboardScreen
      question="What's their name and email?"
      footer={
        <Btn
          label="Continue"
          onPress={() => router.push('/(auth)/sign-up/their-identity')}
          disabled={!ready}
        />
      }
    >
      <Field
        placeholder="First name"
        value={draft.theirFirstName}
        onChangeText={(t) => set({ theirFirstName: t })}
        accessibilityLabel="Their first name"
      />
      <Field
        placeholder="Last name"
        value={draft.theirLastName}
        onChangeText={(t) => set({ theirLastName: t })}
        accessibilityLabel="Their last name"
      />
      <Field
        placeholder="Email address"
        value={draft.theirEmail}
        onChangeText={(t) => set({ theirEmail: t })}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Their email address"
      />
    </OnboardScreen>
  );
}
