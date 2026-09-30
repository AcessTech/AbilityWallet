import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, font } from '../theme/tokens';
import { Icon, IconName } from './Icon';

/**
 * The prototype's navbar: icon, 11px label, and a gold dot under the active
 * tab. Member tabs: Home · Card · Spend · Save · Account.
 * Navigator tabs: Home · Activity · Plan · Account.
 */
/** Only the parts of the tab-bar props this bar actually uses. Typed here so
 *  the file does not depend on which copy of the navigator types wins. */
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; tabBarIconName?: IconName } }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(6, insets.bottom) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = options.title ?? route.name;
        const icon: IconName = options.tabBarIconName ?? 'home';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={s.tab}
          >
            <Icon name={icon} size={22} stroke={focused ? color.navy : color.soft} />
            <Text style={[s.label, { color: focused ? color.navy : color.soft }]}>{label}</Text>
            <View style={[s.dot, focused && { backgroundColor: color.gold }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: color.line,
    backgroundColor: '#fff',
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 8, gap: 3 },
  label: { fontFamily: font.extrabold, fontSize: 11 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'transparent' },
});
