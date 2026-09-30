import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useSession } from '../lib/session';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/demo';
import { color, font, radius } from '../theme/tokens';

/**
 * The demo switch, copied from the prototype's own topbar: two segments,
 * "Alex" and "Maria", gold for the one you are in.
 *
 * It shows whenever the two fake accounts are loaded, whoever is signed in —
 * otherwise there is no way to reach them without hunting for sign-out. It
 * disappears on its own when the accounts are wiped, so a real account never
 * sees it.
 */
export function DemoSwitch() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { session, profile, loading } = useSession();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: loaded } = useQuery({
    queryKey: ['demo_accounts_loaded'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc('demo_accounts_loaded');
      return !!data;
    },
  });

  const email = (session?.user?.email ?? profile?.email ?? '').toLowerCase();
  const signedIn = !!session;

  // Nothing to switch between, or nobody signed in yet — the welcome screen
  // has its own way in.
  if (!loaded || (!signedIn && !loading)) {
    return <View style={{ height: insets.top, backgroundColor: color.screenBg }} />;
  }

  async function switchTo(target: (typeof DEMO_ACCOUNTS)[number]) {
    if (target.email === email) return;
    setBusy(target.email);
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({
      email: target.email,
      password: DEMO_PASSWORD,
    });
    qc.clear();
    setBusy(null);
    if (error) return;
    router.replace(target.role === 'member' ? '/(member)/(tabs)/home' : '/(navigator)/(tabs)/home');
  }

  return (
    <View style={[s.bar, { paddingTop: insets.top + 6 }]}>
      <View style={s.track}>
        {DEMO_ACCOUNTS.map((a) => {
          const on = a.email === email;
          return (
            <Pressable
              key={a.email}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${a.label}'s app`}
              onPress={() => switchTo(a)}
              style={[s.segment, on && s.segmentOn]}
            >
              {busy === a.email ? (
                <ActivityIndicator size="small" color={color.navy} />
              ) : (
                <Text style={[s.label, on && s.labelOn]}>{a.label}&rsquo;s app</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: '#0e1726',
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: color.ink,
    borderRadius: radius.pill,
    padding: 4,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    minWidth: 112,
    alignItems: 'center',
  },
  segmentOn: { backgroundColor: color.gold },
  label: { fontFamily: font.extrabold, fontSize: 14, color: '#8fa1b8' },
  labelOn: { color: color.navy },
});
