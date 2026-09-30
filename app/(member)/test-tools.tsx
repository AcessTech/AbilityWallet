import React from 'react';
import { Redirect } from 'expo-router';
import { TestTools } from '../../src/features/TestTools';
import { IS_TEST_BUILD } from '../../src/lib/testBuild';
import { MEMBER_PILL } from '../../src/lib/pills';

export default function MemberTestTools() {
  if (!IS_TEST_BUILD) return <Redirect href="/(member)/(tabs)/account" />;
  return <TestTools pillLabel={MEMBER_PILL} chatHref="/(member)/chat" />;
}
