import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn, Field } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';
import { maskDate, maskSsn, parseMaskedDate } from '../../../src/lib/format';

/** Confirm your identity — the self-signup path. */
export default function MyIdentity() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const ready =
    parseMaskedDate(draft.theirDob) !== null && draft.theirSsn.replace(/\D/g, '').length === 9;

  return (
    <OnboardScreen
      question="Confirm your identity"
      footer={
        <Btn
          label="Continue"
          onPress={() => router.push('/(auth)/sign-up/my-address')}
          disabled={!ready}
        />
      }
    >
      <Field
        placeholder="Date of birth"
        value={draft.theirDob}
        onChangeText={(t) => set({ theirDob: maskDate(t) })}
        keyboardType="number-pad"
        accessibilityLabel="Date of birth"
      />
      <Field
        placeholder="Social Security number"
        value={draft.theirSsn}
        onChangeText={(t) => set({ theirSsn: maskSsn(t) })}
        keyboardType="number-pad"
        secureTextEntry
        accessibilityLabel="Social Security number"
      />
    </OnboardScreen>
  );
}
