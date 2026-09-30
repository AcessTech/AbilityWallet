import React from 'react';
import { useRouter } from 'expo-router';
import { Card, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { useSession } from '../../../src/lib/session';
import { navigatorPill } from '../../../src/lib/pills';

/** Prototype screens `maria/n_security` and `n_password`. */
export default function Security() {
  const router = useRouter();
  const { profile, otherFirstName } = useSession();
  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Security" />
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Email" value={profile?.email ?? ''} />
        <Row name="Change password" chevron onPress={() => router.push('/(navigator)/settings/password')} />
        <Row name="Face ID" value={profile?.face_id_enabled ? 'On' : 'Off'} last />
      </Card>
      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>Two-step sign-in is coming.</Muted>
      </Card>
    </Screen>
  );
}
