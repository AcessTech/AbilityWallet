import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Card, Muted, Row, Screen, SubHeader, Title, Toggle } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { MEMBER_PILL } from '../../../src/lib/pills';

/** Face ID after first sign-in. */
export default function MemberSecurity() {
  const router = useRouter();
  const { profile, refresh } = useSession();
  const [busy, setBusy] = useState(false);

  async function toggleFaceId() {
    setBusy(true);
    const on = !profile?.face_id_enabled;
    if (on) {
      const ok = await LocalAuthentication.authenticateAsync({ promptMessage: 'Turn on Face ID' });
      if (!ok.success) {
        setBusy(false);
        return;
      }
    }
    await supabase.from('profiles').update({ face_id_enabled: on }).eq('id', profile!.id);
    await refresh();
    setBusy(false);
  }

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Getting in" />
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Email" value={profile?.email ?? ''} />
        <Row name="Change my password" chevron onPress={() => router.push('/(member)/settings/password')} />
        <Row
          name="Use Face ID"
          last
          right={<Toggle on={!!profile?.face_id_enabled} onPress={busy ? undefined : toggleFaceId} />}
        />
      </Card>
      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>With Face ID on, you can open the app with your face instead of your password.</Muted>
      </Card>
    </Screen>
  );
}
