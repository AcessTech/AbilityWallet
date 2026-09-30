import React, { useState } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorLine } from '../../src/components/Onboard';
import { AddressFields, addressComplete } from '../../src/components/AddressFields';
import {
  Btn, Card, Field, Muted, Option, Screen, Section, SubHeader, Title,
} from '../../src/components/ui';
import { LEVELS } from '../../src/lib/signup';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { maskDate, parseMaskedDate } from '../../src/lib/format';
import { navigatorPill } from '../../src/lib/pills';

/**
 * Add someone — a Navigator supporting more than one person. Same invite flow
 * as sign-up.
 */
export default function AddSomeone() {
  const router = useRouter();
  const { otherFirstName, refresh } = useSession();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [level, setLevel] = useState(2);
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', postal_code: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ready =
    first.trim() && last.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) &&
    parseMaskedDate(dob) && addressComplete(address);

  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Add someone" />

      <Field placeholder="First name" value={first} onChangeText={setFirst} accessibilityLabel="First name" />
      <Field placeholder="Last name" value={last} onChangeText={setLast} accessibilityLabel="Last name" />
      <Field
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Email address"
      />
      <Field
        placeholder="Date of birth"
        value={dob}
        onChangeText={(t) => setDob(maskDate(t))}
        keyboardType="number-pad"
        accessibilityLabel="Date of birth"
      />

      <Section>Their address</Section>
      <AddressFields value={address} onChange={(p) => setAddress((a) => ({ ...a, ...p }))} />

      <Section>How much support to start with</Section>
      {LEVELS.map((l) => (
        <Option
          key={l.level}
          compact
          label={l.name}
          desc={l.desc.replace('{name}', first.trim() || 'They')}
          selected={level === l.level}
          onPress={() => setLevel(l.level)}
        />
      ))}

      <ErrorLine>{error}</ErrorLine>

      <Btn
        label="Send the invite"
        disabled={!ready}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          setError('');
          const { data, error: e } = await supabase.rpc('create_member_invite', {
            p_first_name: first.trim(),
            p_last_name: last.trim(),
            p_email: email.trim().toLowerCase(),
            p_dob: parseMaskedDate(dob) as string,
            p_address: address as never,
            p_ship: null as never,
            p_level: level,
            p_send: true,
          });
          setBusy(false);
          if (e) return setError(e.message);
          await refresh();
          const link = (data as { link: string }).link;
          await Share.share({ message: link });
          router.replace('/(navigator)/(tabs)/account');
        }}
      />

      <Card style={{ paddingVertical: 16, paddingHorizontal: 20, marginTop: 14 }}>
        <Muted>
          No mail service is connected yet, so the link is handed to you to send on.
        </Muted>
      </Card>
    </Screen>
  );
}
