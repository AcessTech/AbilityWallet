import React from 'react';
import { Stack } from 'expo-router';
import { SignupProvider } from '../../../src/lib/signup';
import { color } from '../../../src/theme/tokens';

export default function SignUpLayout() {
  return (
    <SignupProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.screenBg } }} />
    </SignupProvider>
  );
}
