import React from 'react';
import { useRouter } from 'expo-router';
import { Card, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { useSession } from '../../../src/lib/session';
import { addressLine } from '../../../src/lib/format';
import { MEMBER_PILL } from '../../../src/lib/pills';

/** Prototype screen `alex/my_info`. */
export default function MyInfo() {
  const router = useRouter();
  const { profile, signOut } = useSession();

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="My info" />

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Name" value={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()} />
        <Row name="Email" value={profile?.email ?? ''} />
        <Row
          name="Address"
          value={addressLine({
            line1: profile?.address_line1,
            city: profile?.city,
            state: profile?.state,
          })}
        />
        <Row name="Date of birth" value={profile?.dob ?? ''} last />
      </Card>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Change my password" chevron onPress={() => router.push('/(member)/settings/password')} />
        <Row name="Face ID" value={profile?.face_id_enabled ? 'On' : 'Off'} chevron last onPress={() => router.push('/(member)/settings/security')} />
      </Card>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Sign out" danger last onPress={() => { void signOut(); router.replace('/(auth)/welcome'); }} />
      </Card>
    </Screen>
  );
}
