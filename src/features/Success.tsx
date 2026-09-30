import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandLockup } from '../components/Brand';
import { Btn, Card, Screen } from '../components/ui';
import { color, font } from '../theme/tokens';
import { money } from '../lib/format';

/**
 * Every success screen: brand lockup top centre, a 2–4 word summary, one
 * detail line, then only the balances that changed, and one gold button back.
 * There is never a double-confirm before this — if the ask was a decision
 * card, tapping Yes already executed it.
 */
export function Success({
  title,
  detail,
  balances = [],
  buttonLabel = 'Done',
  onDone,
}: {
  title: string;
  detail: string;
  balances?: { label: string; amount: number }[];
  buttonLabel?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  return (
    <Screen>
      <BrandLockup />
      <View style={s.head}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.detail}>{detail}</Text>
      </View>

      {balances.length ? (
        <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
          {balances.map((b, i) => (
            <View
              key={b.label}
              style={[s.row, i === balances.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Text style={s.rowName}>{b.label}</Text>
              <Text style={s.rowValue}>{money(b.amount)}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <View style={{ flex: 1, minHeight: 20 }} />
      <Btn label={buttonLabel} onPress={onDone ?? (() => router.dismissAll())} />
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { alignItems: 'center', paddingBottom: 26 },
  title: { fontFamily: font.black, fontSize: 30, color: color.ink, textAlign: 'center' },
  detail: {
    fontFamily: font.bold,
    fontSize: 16,
    color: color.soft,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 23,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  rowName: { fontFamily: font.extrabold, fontSize: 16, color: color.ink },
  rowValue: { fontFamily: font.black, fontSize: 20, color: color.navy },
});

/** Balances a success screen should show: only the ones that changed. */
export function useChangedBalances(kinds: string[]) {
  return kinds;
}
