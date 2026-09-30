import React from 'react';
import { useRouter } from 'expo-router';
import { Btn, Card, Muted, Screen, SubHeader, Title } from '../../src/components/ui';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Voice chat — talking instead of typing.
 *
 * NOT BUILT: transcription is a separate service and is not specified yet.
 * Rendered as a calm state rather than a dead tap.
 */
export default function ChatVoice() {
  const router = useRouter();
  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Talking" sub="Not switched on yet." />
      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>Typing works for now. Talking is coming.</Muted>
      </Card>
      <Btn label="Back to the conversation" onPress={() => router.back()} />
    </Screen>
  );
}
