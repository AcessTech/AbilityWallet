import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '../theme/tokens';

/**
 * The support-level bar. This is the ONE place in the whole app where levels
 * are named or numbered, and it exists only on the Navigator's Plan tab
 * (brief §2 rule 1).
 */
export const LEVEL_NAMES = [
  'Independent',
  'Monitored',
  'Flexible limits',
  'Firm limits',
  'Fiduciary',
] as const;

export function levelDescription(level: number, memberName: string): string {
  const who = memberName || 'They';
  switch (level) {
    case 1:
      return `${who} banks alone. You can send messages, and that is all you see.`;
    case 2:
      return `You see ${who}'s balances and spending, and you get alerts.`;
    case 3:
      return `Limits you set together. Going over still works — you get a heads-up.`;
    case 4:
      return `Purchases that would pass a limit you both agreed to stop at the register. You see ${who}'s balances and spending, and you get alerts.`;
    case 5:
      return `You look after ${who}'s benefit money and file the Social Security reports.`;
    default:
      return '';
  }
}

export function LevelBar({ level }: { level: number }) {
  return (
    <View style={s.bar}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={[s.seg, n <= level && { backgroundColor: color.navy }]} />
      ))}
    </View>
  );
}

export function LevelHeading({ level }: { level: number }) {
  return (
    <Text style={s.heading}>
      Level {level} — {LEVEL_NAMES[level - 1]}
    </Text>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  seg: { flex: 1, height: 10, borderRadius: 999, backgroundColor: color.line },
  heading: { fontFamily: font.extrabold, fontSize: 17, color: color.ink },
});
