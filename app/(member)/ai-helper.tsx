import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Btn, Card, Muted, Note, Plain, Screen, SubHeader, Title } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Setting up and turning on the AI helper.
 *
 * Turning it on: at Firm limits and Fiduciary the Navigator has to agree
 * (a consent on her side); at Monitored and Flexible she is told (A14); at
 * Independent nothing happens.
 */
export default function AiHelper() {
  const router = useRouter();
  const { profile, activeLink, otherFirstName, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const on = profile?.ai_helper_enabled ?? false;
  const level = activeLink?.level ?? 1;
  const needsHerOk = level >= 4;

  async function toggle() {
    setBusy(true);
    if (!on && needsHerOk) {
      await supabase.rpc('propose_consent', {
        p_member: profile!.id,
        p_kind: 'AI_HELPER_ON',
        p_headline: 'Turn on the AI helper',
        p_body: `${otherFirstName} would like to know before you turn this on.`,
        p_payload: { enabled: true } as never,
      });
      setBusy(false);
      router.push('/(member)/ask-sent');
      return;
    }
    await supabase.from('profiles').update({ ai_helper_enabled: !on }).eq('id', profile!.id);
    await supabase.rpc('raise_alert', {
      p_member: profile!.id,
      p_code: 'A14',
      p_title: `${profile!.first_name} turned ${!on ? 'on' : 'off'} the AI Navigator`,
      p_payload: {} as never,
    });
    await refresh();
    setBusy(false);
  }

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title
        title="AI Navigator"
        sub="Answers questions about your money, anytime."
      />

      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>It can tell you what you have left, what you bought, and what is coming in.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>It never moves your money on its own. It asks you first, every time.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>It only ever sees your account. It never sees anyone else's.</Plain>
      </Card>

      {!on && needsHerOk ? (
        <Note>{otherFirstName} will be asked first. It starts once they say OK.</Note>
      ) : null}

      <Btn label={on ? 'Turn off' : 'Turn on'} kind={on ? 'grey' : 'gold'} busy={busy} onPress={toggle} />
    </Screen>
  );
}
