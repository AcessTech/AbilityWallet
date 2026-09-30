import React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '../../src/lib/session';

/**
 * A signed-in account whose sign-up never finished. The Navigator's account is
 * usable straight away; a Member who has not accepted an invite has nothing to
 * open, so send him back to the welcome screen.
 */
export default function FinishSetup() {
  const { profile } = useSession();
  if (!profile) return <Redirect href="/(auth)/welcome" />;
  if (profile.role === 'navigator') return <Redirect href="/(navigator)/(tabs)/home" />;
  return <Redirect href="/(member)/(tabs)/home" />;
}
