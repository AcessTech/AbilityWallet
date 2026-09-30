import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn, Field } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';
import { maskDate, maskSsn, parseMaskedDate } from '../../../src/lib/format';

/**
 * ob-07 Confirm their identity. Onboarding walkthrough frame 7 — date of birth
 * and Social Security number, no explainer line (Eric).
 */
export default function TheirIdentity() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const name = draft.theirFirstName.trim() || 'them';
  const ready = parseMaskedDate(draft.theirDob) !== null && draft.theirSsn.replace(/\D/g, '').length === 9;

  return (
    <OnboardScreen
      question={`Confirm ${name}'s identity`}
      footer={
        <Btn
          label="Continue"
          onPress={() => router.push('/(auth)/sign-up/their-address')}
          disabled={!ready}
        />
      }
    >
      <Field
        placeholder="Date of birth"
        value={draft.theirDob}
        onChangeText={(t) => set({ theirDob: maskDate(t) })}
        keyboardType="number-pad"
        accessibilityLabel="Their date of birth"
      />
      <Field
        placeholder="Social Security number"
        value={draft.theirSsn}
        onChangeText={(t) => set({ theirSsn: maskSsn(t) })}
        keyboardType="number-pad"
        secureTextEntry
        accessibilityLabel="Their Social Security number"
      />
    </OnboardScreen>
  );
}
