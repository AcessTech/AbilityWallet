import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Mark, Wordmark } from '../../src/components/Brand';
import { Btn } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../src/lib/demo';
import { color, font } from '../../src/theme/tokens';

/**
 * Welcome screen: big mark + wordmark, "Get started", "Sign in", FDIC footnote.
 */
export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<string | null>(null);

  // The shortcut into the two fake accounts, shown only while they are
  // loaded. It disappears by itself when they are wiped.
  const { data: demoLoaded } = useQuery({
    queryKey: ['demo_accounts_loaded'],
    queryFn: async () => {
      const { data } = await supabase.rpc('demo_accounts_loaded');
      return !!data;
    },
  });

  async function signInAs(account: (typeof DEMO_ACCOUNTS)[number]) {
    setBusy(account.email);
    await supabase.auth.signInWithPassword({
      email: account.email,
      password: DEMO_PASSWORD,
    });
    setBusy(null);
    router.replace('/');
  }
  return (
    <View style={[s.wrap, { paddingTop: 40 + insets.top, paddingBottom: 24 + insets.bottom }]}>
      <View style={s.logoWrap}>
        <Mark size={96} />
        <Wordmark size={30} />
      </View>
      <View style={{ flex: 1 }} />
      <Btn label="Get started" onPress={() => router.push('/(auth)/sign-up/account')} />
      <Btn label="Sign in" kind="grey" onPress={() => router.push('/(auth)/sign-in')} />

      {demoLoaded ? (
        <View style={s.demo}>
          <Text style={s.demoLabel}>Take a look around</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <View key={a.email} style={{ flex: 1 }}>
                <Btn
                  label={a.label}
                  kind="grey"
                  busy={busy === a.email}
                  onPress={() => signInAs(a)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <Text style={s.footnote}>
        Ability Wallet is a financial technology company, not a bank. Banking services provided by
        Partner Bank, Member FDIC.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: color.screenBg, paddingHorizontal: 20 },
  logoWrap: { alignItems: 'center', gap: 14, marginTop: 60 },
  demo: { marginTop: 22, gap: 8 },
  demoLabel: {
    fontFamily: font.extrabold,
    fontSize: 13,
    color: color.soft,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footnote: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: color.soft,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
