import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSession } from '../src/lib/session';
import { color } from '../src/theme/tokens';

/** Role-based routing after sign-in (brief §3). */
export default function Index() {
  const { loading, session, profile } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.screenBg }}>
        <ActivityIndicator color={color.navy} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <Redirect href="/(auth)/welcome" />;
  if (!profile.onboarding_done) return <Redirect href="/(auth)/finish-setup" />;

  return profile.role === 'navigator'
    ? <Redirect href="/(navigator)/(tabs)/home" />
    : <Redirect href="/(member)/(tabs)/home" />;
}
