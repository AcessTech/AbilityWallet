import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen, ErrorLine } from '../../../src/components/Onboard';
import { Option } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';
import { useSession } from '../../../src/lib/session';
import { supabase } from '../../../src/lib/supabase';
import { addressLine, parseMaskedDate } from '../../../src/lib/format';

/**
 * Where to send your card — the self-signup path. "My home" is the
 * default. Same two-option shape as the Navigator's card-address screen.
 */
export default function MyCardAddress() {
  const router = useRouter();
  const { draft } = useSignup();
  const { refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function finish() {
    setBusy(true);
    setError('');
    const { data, error: e } = await supabase.rpc('finish_self_signup', {
      p_dob: parseMaskedDate(draft.theirDob) as string,
      p_address: {
        line1: draft.addressLine1,
        line2: draft.addressLine2,
        city: draft.city,
        state: draft.state,
        postal_code: draft.postalCode,
      },
    });
    if (e) {
      setBusy(false);
      setError(e.message);
      return;
    }
    await refresh();
    setBusy(false);
    router.replace({
      pathname: '/(auth)/card-ready',
      params: { last4: (data as { last4: string } | null)?.last4 ?? '' },
    });
  }

  return (
    <OnboardScreen question="Where should we send your card?" footer={null}>
      <Option
        label="My home"
        desc={addressLine({ line1: draft.addressLine1, city: draft.city, state: draft.state })}
        onPress={finish}
      />
      <Option label="A different address" onPress={finish} />
      {busy ? null : <ErrorLine>{error}</ErrorLine>}
    </OnboardScreen>
  );
}
