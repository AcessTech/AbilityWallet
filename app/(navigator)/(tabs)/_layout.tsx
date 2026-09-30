import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../../src/components/TabBar';

/** Navigator IA: Home · Activity · Plan · Account. */
export default function NavigatorTabs() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home"     options={{ title: 'Home',     tabBarIconName: 'home' } as never} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIconName: 'bell' } as never} />
      <Tabs.Screen name="plan"     options={{ title: 'Plan',     tabBarIconName: 'bars' } as never} />
      <Tabs.Screen name="account"  options={{ title: 'Account',  tabBarIconName: 'user' } as never} />
    </Tabs>
  );
}
