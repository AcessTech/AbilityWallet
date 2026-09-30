import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ErrorLine } from '../../../src/components/Onboard';
import { Btn, Field, Hint, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { MEMBER_PILL } from '../../../src/lib/pills';

export default function ChangePassword() {
  const router = useRouter();
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Change my password" />
      <Field
        placeholder="New password"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        autoCapitalize="none"
        textContentType="newPassword"
        accessibilityLabel="New password"
      />
      <Hint>At least 8 characters.</Hint>
      <ErrorLine>{error}</ErrorLine>
      <Btn
        label="Save"
        disabled={next.length < 8}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          const { error: e } = await supabase.auth.updateUser({ password: next });
          setBusy(false);
          if (e) return setError(e.message);
          router.back();
        }}
      />
    </Screen>
  );
}
