import React from 'react';
import { Stack } from 'expo-router';
import { color } from '../../src/theme/tokens';

/**
 * The Member's stack. The five tabs live in (tabs); everything else is a
 * sub-page pushed on top of them, with its own back button and no tab bar —
 * which is how the design draws sub-pages.
 */
export default function MemberLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.screenBg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
