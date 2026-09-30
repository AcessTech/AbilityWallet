import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { OnboardScreen } from '../../src/components/Onboard';
import { Btn, CardArt } from '../../src/components/ui';
import { useSession } from '../../src/lib/session';

/**
 * ob-14 Your card is ready. Onboarding walkthrough frame 14 — card art, "Add
 * to Apple Wallet", "Not now". No back button.
 */
export default function CardReady() {
  const router = useRouter();
  const { last4 } = useLocalSearchParams<{ last4: string }>();
  const { profile } = useSession();
  const name = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();

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
      <CardArt name={name} last4={last4 || '0000'} />
    </OnboardScreen>
  );
}
