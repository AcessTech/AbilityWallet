import React from 'react';
import { useRouter } from 'expo-router';
import { Card, Row, Screen, Section, SubHeader, Title } from '../../src/components/ui';
import { useSession } from '../../src/lib/session';
import { navigatorPill } from '../../src/lib/pills';

/** Prototype screen `maria/nmaria` — "My info": contact and sign-in. */
export default function NavigatorMyInfo() {
  const router = useRouter();
  const { profile, otherFirstName } = useSession();
  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="My info" />

      <Section first>Contact</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Name" value={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()} />
        <Row name="Email" value={profile?.email ?? ''} last />
      </Card>

      <Section>Signing in</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Password" value="••••••••" chevron onPress={() => router.push('/(navigator)/settings/password')} />
        <Row name="Face ID" value={profile?.face_id_enabled ? 'On' : 'Off'} chevron last onPress={() => router.push('/(navigator)/settings/security')} />
      </Card>
    </Screen>
  );
}
