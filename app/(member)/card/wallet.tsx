import React from 'react';
import { useRouter } from 'expo-router';
import { Btn, Card, Muted, Plain, Screen, SubHeader, Title } from '../../../src/components/ui';
import { MEMBER_PILL } from '../../../src/lib/pills';

/** Tap to pay. */
export default function TapToPay() {
  const router = useRouter();
  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Tap to pay" sub="Pay with your phone instead of the card." />
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>Add your card to Apple Wallet, then hold your phone near the reader.</Plain>
      </Card>
      <Btn label="Add to Apple Wallet" kind="dark" onPress={() => router.back()} />
      <Card style={{ paddingVertical: 16, paddingHorizontal: 20, marginTop: 14 }}>
        <Muted>This is a simulated card, so it cannot be added to a real wallet yet.</Muted>
      </Card>
    </Screen>
  );
}
