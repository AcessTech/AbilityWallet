import React from 'react';
import { Stack } from 'expo-router';
import { color } from '../../src/theme/tokens';

/** The Navigator's stack. Four tabs in (tabs); sub-pages push on top. */
export default function NavigatorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.screenBg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
