import React from 'react';
import { useRouter } from 'expo-router';
import { Card, Muted, Row, Screen, SubHeader, Title } from '../../../src/components/ui';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * The Member's notification settings.
 *
 * There are no Member quiet hours — the phone's own settings control timing
 * for him. His lock screen never shows amounts, merchants or declines.
 */
export default function MemberNotifications() {
  const router = useRouter();
  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Notifications" />

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Questions for me" sub="When the app needs an answer" />
        <Row name="Money arriving" sub="When money comes in" />
        <Row name="Messages" sub="From your Navigator or the AI helper" />
        <Row name="Your card" sub="When a card ships or arrives" last />
      </Card>

      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>
          Notifications never show how much money you have or where you shopped on your lock
          screen. Those only show inside the app.
        </Muted>
      </Card>

      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>To turn notifications on or off, use your phone's Settings app.</Muted>
      </Card>
    </Screen>
  );
}
