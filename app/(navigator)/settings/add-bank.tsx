import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Btn, Card, Field, Muted, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * Prototype screens `maria/n_add_bank`, `n_bank_login`, `n_bank_choose`,
 * `n_bank_linked`, and the "Open an account" cross-sell.
 *
 * The real thing is a Plaid-style hand-off. Here it is simulated: no bank
 * credentials are ever collected or stored.
 */
export default function AddBank() {
  const router = useRouter();
  const qc = useQueryClient();
  const { profile, otherFirstName } = useSession();
  const [institution, setInstitution] = useState('');
  const [last4, setLast4] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Add a bank account" sub="This is where money you send comes from." />

      <Field placeholder="Your bank" value={institution} onChangeText={setInstitution} accessibilityLabel="Bank name" />
      <Field
        placeholder="Last 4 digits"
        value={last4}
        onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        accessibilityLabel="Last four digits"
      />

      <Btn
        label="Link it"
        disabled={institution.trim().length < 2 || last4.length !== 4}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          await supabase.from('linked_banks').update({ is_default: false }).eq('owner_id', profile!.id);
          await supabase.from('linked_banks').insert({
            owner_id: profile!.id,
            institution: institution.trim(),
            last4,
            is_default: true,
          });
          setBusy(false);
          qc.invalidateQueries();
          router.replace('/(navigator)/settings/linked-bank');
        }}
      />

      <Card style={{ paddingVertical: 16, paddingHorizontal: 20, marginTop: 14 }}>
        <Muted>
          The money in this build is not real, so no bank sign-in is needed. In the finished app
          this is a secure hand-off to your bank, and Ability Wallet never sees your password.
        </Muted>
      </Card>

      <Btn label="Open an account with our partner bank" kind="grey" onPress={() => router.push('/(navigator)/settings/open-account')} />
    </Screen>
  );
}
