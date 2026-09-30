import React from 'react';
import { useRouter } from 'expo-router';
import { Card, Muted, Plain, Screen, SubHeader, Title } from '../../../src/components/ui';
import { useSession } from '../../../src/lib/session';
import { navigatorPill } from '../../../src/lib/pills';

/**
 * The partner-bank cross-sell.
 * Optional, never required.
 */
export default function OpenAccount() {
  const router = useRouter();
  const { otherFirstName } = useSession();
  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Open an account" sub="With our partner bank." />
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>Sending money is instant when both accounts are at the same bank.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>You do not need one. Any bank works.</Plain>
      </Card>
      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>Not open for applications yet.</Muted>
      </Card>
    </Screen>
  );
}
