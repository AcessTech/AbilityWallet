import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn, Muted } from '../../../src/components/ui';
import { color, font, radius } from '../../../src/theme/tokens';

/**
 * ob-11a Invite sent — pending state.
 * NOT IN THE PROTOTYPE (screens.md marks it SPEC). Needs Eric's review.
 *
 * The link is shown because no mail service is connected to the Supabase
 * project yet, so the email is recorded but not delivered. Once a provider is
 * connected this screen can drop the link and just say the email is on its way.
 */
export default function InviteSent() {
  const router = useRouter();
  const { token, name } = useLocalSearchParams<{ token: string; name: string }>();
  const link = `abilitywallet://invite/${token}`;
  const who = name || 'them';

  return (
    <OnboardScreen
      showBack={false}
      question="Invite sent"
      sub={`${who} has 7 days to open it. You'll know the moment they accept.`}
      footer={
        <>
          <Btn label="Share the link" onPress={() => Share.share({ message: link })} />
          <Btn label="Done" kind="grey" onPress={() => router.replace('/(navigator)/(tabs)/home')} />
        </>
      }
    >
      <View style={s.linkBox}>
        <Text style={s.linkText} selectable>
          {link}
        </Text>
      </View>
      <View style={{ marginTop: 14 }}>
        <Muted>
          No mail service is connected yet, so send this link to {who} yourself for now.
        </Muted>
      </View>
    </OnboardScreen>
  );
}

const s = StyleSheet.create({
  linkBox: {
    backgroundColor: '#fff',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    marginTop: 18,
  },
  linkText: { fontFamily: font.bold, fontSize: 14, color: color.navy },
});
