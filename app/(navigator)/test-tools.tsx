import React from 'react';
import { Redirect } from 'expo-router';
import { TestTools } from '../../src/features/TestTools';
import { IS_TEST_BUILD } from '../../src/lib/testBuild';
import { useSession } from '../../src/lib/session';
import { navigatorPill } from '../../src/lib/pills';

export default function NavigatorTestTools() {
  const { otherFirstName } = useSession();
  if (!IS_TEST_BUILD) return <Redirect href="/(navigator)/(tabs)/account" />;
  return <TestTools pillLabel={navigatorPill(otherFirstName)} chatHref="/(navigator)/chat" />;
}
