import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../../src/components/TabBar';

/** Member IA: Home · Card · Spend · Save · Account (brief §6). */
export default function MemberTabs() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home"    options={{ title: 'Home',    tabBarIconName: 'home' } as never} />
      <Tabs.Screen name="card"    options={{ title: 'Card',    tabBarIconName: 'card' } as never} />
      <Tabs.Screen name="spend"   options={{ title: 'Spend',   tabBarIconName: 'dollar' } as never} />
      <Tabs.Screen name="save"    options={{ title: 'Save',    tabBarIconName: 'save' } as never} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIconName: 'user' } as never} />
    </Tabs>
  );
}
