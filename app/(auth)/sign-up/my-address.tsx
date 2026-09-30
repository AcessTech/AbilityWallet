import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn } from '../../../src/components/ui';
import { AddressFields, addressComplete } from '../../../src/components/AddressFields';
import { useSignup } from '../../../src/lib/signup';

/**
 * Your home address — the self-signup path. Uses the same address block as
 * the Navigator's sign-up flow.
 */
export default function MyAddress() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const address = {
    line1: draft.addressLine1,
    line2: draft.addressLine2,
    city: draft.city,
    state: draft.state,
    postal_code: draft.postalCode,
  };

  return (
    <OnboardScreen
      question="What's your home address?"
      footer={
        <Btn
          label="Continue"
          onPress={() => router.push('/(auth)/sign-up/my-card-address')}
          disabled={!addressComplete(address)}
        />
      }
    >
      <AddressFields
        value={address}
        onChange={(p) =>
          set({
            addressLine1: p.line1 ?? draft.addressLine1,
            addressLine2: p.line2 ?? draft.addressLine2,
            city: p.city ?? draft.city,
            state: p.state ?? draft.state,
            postalCode: p.postal_code ?? draft.postalCode,
          })
        }
      />
    </OnboardScreen>
  );
}
