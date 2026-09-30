import React from 'react';
import { Stack } from 'expo-router';
import { color } from '../../src/theme/tokens';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.screenBg } }} />;
}
