import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn } from '../../../src/components/ui';
import { AddressFields, addressComplete } from '../../../src/components/AddressFields';
import { useSignup } from '../../../src/lib/signup';

/**
 * ob-10a Enter a different shipping address.
 * NOT IN THE PROTOTYPE (screens.md marks it SPEC). Built as the same address
 * block as frame 8. Needs Eric's review.
 */
export default function DifferentAddress() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const address = {
    line1: draft.shipLine1,
    line2: draft.shipLine2,
    city: draft.shipCity,
    state: draft.shipState,
    postal_code: draft.shipPostalCode,
  };

  return (
    <OnboardScreen
      question="Where should we send it?"
      footer={
        <Btn
          label="Continue"
          onPress={() => router.push('/(auth)/sign-up/level')}
          disabled={!addressComplete(address)}
        />
      }
    >
      <AddressFields
        value={address}
        onChange={(p) =>
          set({
            shipLine1: p.line1 ?? draft.shipLine1,
            shipLine2: p.line2 ?? draft.shipLine2,
            shipCity: p.city ?? draft.shipCity,
            shipState: p.state ?? draft.shipState,
            shipPostalCode: p.postal_code ?? draft.shipPostalCode,
          })
        }
      />
    </OnboardScreen>
  );
}
