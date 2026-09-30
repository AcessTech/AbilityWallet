import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn, Plain } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';

/**
 * Fiduciary requires SSA documents. The paperwork screens themselves are
 * reachable later from Plan.
 */
export default function FiduciaryDocs() {
  const router = useRouter();
  const { draft } = useSignup();
  const name = draft.theirFirstName.trim() || 'they';

  return (
    <OnboardScreen
      question="Fiduciary needs SSA paperwork"
      sub={`Social Security has to name you as ${name}'s representative payee before you can manage benefit money.`}
      footer={
        <>
          <Btn label="Send the invite first" onPress={() => router.push('/(auth)/sign-up/invite')} />
          <Btn
            label="Start the paperwork"
            kind="grey"
            onPress={() => router.push('/(auth)/sign-up/invite')}
          />
        </>
      }
    >
      <Plain>
        You can send the invite now and do the paperwork afterwards. Until it is approved, the
        account runs at Firm limits.
      </Plain>
    </OnboardScreen>
  );
}
