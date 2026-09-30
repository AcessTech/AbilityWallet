import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Option } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';
import { addressLine } from '../../../src/lib/format';

/** ob-09 Where to send the card. Their home is the default. Frame 9. */
export default function CardAddress() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const name = draft.theirFirstName.trim() || 'their';

  return (
    <OnboardScreen question={`Where should we send ${name}'s card?`} footer={null}>
      <Option
        label={`${name}'s home`}
        desc={addressLine({ line1: draft.addressLine1, city: draft.city, state: draft.state })}
        onPress={() => {
          set({ shipToHome: true });
          router.push('/(auth)/sign-up/level');
        }}
      />
      <Option
        label="A different address"
        onPress={() => {
          set({ shipToHome: false });
          router.push('/(auth)/sign-up/different-address');
        }}
      />
    </OnboardScreen>
  );
}
