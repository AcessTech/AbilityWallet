import React from 'react';
import { useRouter } from 'expo-router';
import { Card, Muted, Row, Screen, SubHeader, Title } from '../../src/components/ui';
import { useSession } from '../../src/lib/session';
import { navigatorPill } from '../../src/lib/pills';

/**
 * Prototype screen `maria/n_always_on` — "Card safety and fraud".
 * Push + Text, not configurable (Appendix A §6.7 item 1).
 */
export default function AlwaysOn() {
  const router = useRouter();
  const { otherFirstName } = useSession();
  return (
    <Screen>
      <SubHeader
        pillLabel={navigatorPill(otherFirstName)}
        onPillPress={() => router.push('/(navigator)/chat')}
      />
      <Title title="Card safety and fraud" sub="Push and text. Always on." />

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Unusual activity" sub="Patterns that look like a scam" />
        <Row name="Card reported lost or stolen" />
        <Row name="A problem reported with a purchase" />
        <Row name="Card locked" last />
      </Card>

      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>
          These reach you day or night, even during quiet hours. They cannot be turned off.
        </Muted>
      </Card>
    </Screen>
  );
}
