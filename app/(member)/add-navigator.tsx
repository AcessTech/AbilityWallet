import React, { useState } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorLine } from '../../src/components/Onboard';
import { Btn, Card, Field, Muted, Plain, Screen, Section, SubHeader, Title } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Prototype screens `alex/add_nav`, `add_nav_2` and `add_nav_sent`.
 * He asks someone to help; they see what the second screen describes.
 */
export default function AddNavigator() {
  const router = useRouter();
  const { activeMemberId } = useSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [first, setFirst] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ready = first.trim().length > 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  if (step === 2) {
    return (
      <Screen>
        <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} onBack={() => setStep(1)} />
        <Title title={`What ${first.trim()} will see`} />
        <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
          <Plain>Your balances and what you spend.</Plain>
        </Card>
        <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
          <Plain>A note when money comes in or a purchase does not go through.</Plain>
        </Card>
        <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
          <Plain>They cannot spend your money or move it anywhere.</Plain>
        </Card>
        <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
          <Plain>You can take them off your account whenever you want.</Plain>
        </Card>
        <ErrorLine>{error}</ErrorLine>
        <Btn
          label={`Ask ${first.trim()}`}
          busy={busy}
          onPress={async () => {
            setBusy(true);
            setError('');
            const { data, error: e } = await supabase.rpc('invite_navigator', {
              p_first_name: first.trim(),
              p_email: email.trim().toLowerCase(),
            });
            setBusy(false);
            if (e) return setError(e.message);
            await Share.share({ message: (data as { link: string }).link });
            router.replace('/(member)/ask-sent');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Add a Navigator" sub="Someone you trust to help with money." />
      <Field placeholder="Their first name" value={first} onChangeText={setFirst} accessibilityLabel="Their first name" />
      <Field
        placeholder="Their email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Their email"
      />
      <Btn label="Next" disabled={!ready} onPress={() => setStep(2)} />
      <Card style={{ paddingVertical: 16, paddingHorizontal: 20, marginTop: 14 }}>
        <Muted>They see your money only after you both agree.</Muted>
      </Card>
    </Screen>
  );
}
