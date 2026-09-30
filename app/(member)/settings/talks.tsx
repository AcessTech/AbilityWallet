import React from 'react';
import { useRouter } from 'expo-router';
import { Card, Muted, Option, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * Prototype screen `alex/talks` — "How the app talks to me".
 * This swaps body copy only. Decided Sep 23: it does not change how the AI
 * helper writes.
 */
export default function HowTheAppTalks() {
  const router = useRouter();
  const { profile, refresh } = useSession();
  const current = profile?.reading_level ?? 'standard';

  async function pick(level: string) {
    await supabase.from('profiles').update({ reading_level: level }).eq('id', profile!.id);
    await refresh();
  }

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="How the app talks to me" />

      <Option
        label="Shorter"
        desc="Fewer words. Just the important part."
        selected={current === 'short'}
        onPress={() => pick('short')}
      />
      <Option
        label="Normal"
        desc="The way it is now."
        selected={current === 'standard'}
        onPress={() => pick('standard')}
      />
      <Option
        label="More detail"
        desc="A bit more explanation with each thing."
        selected={current === 'detailed'}
        onPress={() => pick('detailed')}
      />

      <Card style={{ paddingVertical: 16, paddingHorizontal: 20, marginTop: 14 }}>
        <Muted>You can change this any time. It only changes the words, never the rules.</Muted>
      </Card>
    </Screen>
  );
}
