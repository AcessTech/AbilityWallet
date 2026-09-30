import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen, ErrorLine } from '../../../src/components/Onboard';
import { Loading, Option } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';
import { supabase } from '../../../src/lib/supabase';

/**
 * The fork: signing up for yourself or for someone else.
 *
 * The answer decides the role, so this is where the account is actually
 * created: "Someone else" makes a Navigator, "Me" makes a Member.
 */
export default function WhoWillUseIt() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function choose(who: 'someone_else' | 'me') {
    set({ who });
    setBusy(true);
    setError('');

    const { data, error: e } = await supabase.auth.signUp({
      email: draft.email.trim().toLowerCase(),
      password: draft.password,
      options: {
        data: {
          role: who === 'someone_else' ? 'navigator' : 'member',
          first_name: draft.firstName.trim(),
          last_name: draft.lastName.trim(),
        },
      },
    });

    setBusy(false);

    if (e) {
      setError(
        e.message.toLowerCase().includes('already registered')
          ? 'There is already an account with that email. Sign in instead.'
          : e.message,
      );
      return;
    }

    if (!data.session) {
      // The project still requires a confirmation email. Tell the truth
      // rather than dropping the person on a screen that cannot load.
      setError('Check your email for a link to confirm this address, then sign in.');
      return;
    }

    router.push(who === 'someone_else'
      ? '/(auth)/sign-up/their-details'
      : '/(auth)/sign-up/my-identity');
  }

  if (busy) return <Loading />;

  return (
    <OnboardScreen question="Who will use the card?" footer={null}>
      <Option label="Someone else" onPress={() => choose('someone_else')} />
      <Option label="Me" onPress={() => choose('me')} />
      <ErrorLine>{error}</ErrorLine>
    </OnboardScreen>
  );
}
