import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardScreen, ErrorLine } from '../../../src/components/Onboard';
import { Btn } from '../../../src/components/ui';
import { useSignup } from '../../../src/lib/signup';
import { useSession } from '../../../src/lib/session';
import { supabase } from '../../../src/lib/supabase';
import { parseMaskedDate } from '../../../src/lib/format';
import { color, font, radius } from '../../../src/theme/tokens';

/**
 * ob-11 Send the invite. Onboarding walkthrough frame 11 — the exact message
 * is shown before it goes, and nothing sends until this tap.
 * The invite goes by EMAIL (decided Sep 29); frame 11 showed a text message.
 */
export default function SendInvite() {
  const router = useRouter();
  const { draft } = useSignup();
  const { refresh, profile } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const theirName = draft.theirFirstName.trim() || 'them';
  const myName = profile?.first_name || draft.firstName.trim();
  const preview = `${myName} set up an Ability Wallet card for you. Tap here to set it up:`;

  async function send(alsoSend: boolean) {
    setBusy(true);
    setError('');

    const shipping = draft.shipToHome
      ? null
      : {
          line1: draft.shipLine1,
          line2: draft.shipLine2,
          city: draft.shipCity,
          state: draft.shipState,
          postal_code: draft.shipPostalCode,
        };

    const { data, error: e } = await supabase.rpc('create_member_invite', {
      p_first_name: draft.theirFirstName.trim(),
      p_last_name: draft.theirLastName.trim(),
      p_email: draft.theirEmail.trim().toLowerCase(),
      p_dob: parseMaskedDate(draft.theirDob) as string,
      p_address: {
        line1: draft.addressLine1,
        line2: draft.addressLine2,
        city: draft.city,
        state: draft.state,
        postal_code: draft.postalCode,
      },
      p_ship: shipping,
      p_level: draft.level,
      p_send: alsoSend,
    });

    if (e) {
      setBusy(false);
      setError(e.message);
      return;
    }

    await supabase.from('profiles').update({ onboarding_done: true }).eq('id', profile?.id ?? '');
    await refresh();
    setBusy(false);

    if (alsoSend) {
      router.replace({
        pathname: '/(auth)/sign-up/invite-sent',
        params: { token: (data as { token: string }).token, name: theirName },
      });
    } else {
      router.replace('/(navigator)/(tabs)/home');
    }
  }

  return (
    <OnboardScreen
      question={`Send ${theirName}'s invite`}
      sub={`This email goes to ${draft.theirEmail.trim().toLowerCase()}:`}
      footer={
        <>
          <Btn label="Send the invite" onPress={() => send(true)} busy={busy} />
          <Btn label="Do more setup first" kind="grey" onPress={() => send(false)} disabled={busy} />
        </>
      }
    >
      <View style={s.bubble}>
        <Text style={s.bubbleText}>{preview}</Text>
        <Text style={s.bubbleLink}>abilitywallet.com/j/…</Text>
      </View>
      <ErrorLine>{error}</ErrorLine>
    </OnboardScreen>
  );
}

const s = StyleSheet.create({
  bubble: {
    backgroundColor: '#fff',
    borderRadius: radius.card,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: color.line,
  },
  bubbleText: { fontFamily: font.semibold, fontSize: 16, color: color.ink, lineHeight: 23 },
  bubbleLink: { fontFamily: font.bold, fontSize: 16, color: color.navy, marginTop: 4 },
});
