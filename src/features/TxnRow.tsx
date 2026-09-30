import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font } from '../theme/tokens';
import { initials, money, shortDate, tileColor } from '../lib/format';
import { Logo } from '../components/ui';

export interface TxnLike {
  id: string;
  merchant: string;
  amount: number;
  status: string;
  occurred_at: string;
  declined_reason?: string | null;
}

/**
 * One transaction row, as the prototype draws it: logo tile, name, date,
 * amount. A decline on the Member's side is neutral — "Didn't go through",
 * never red, never "Declined" (brief §2 rule 8).
 */
export function TxnRow({
  txn,
  last = false,
  navigatorView = false,
  onPress,
}: {
  txn: TxnLike;
  last?: boolean;
  navigatorView?: boolean;
  onPress?: () => void;
}) {
  const declined = txn.status === 'declined';
  const incoming = txn.amount > 0;

  const body = (
    <View style={[s.txn, last && { borderBottomWidth: 0 }]}>
      <Logo text={initials(txn.merchant)} bg={tileColor(txn.merchant)} />
      <View style={{ flexShrink: 1 }}>
        <Text style={s.tname}>{txn.merchant}</Text>
        <Text style={s.tsub}>
          {shortDate(txn.occurred_at)}
          {declined ? (navigatorView ? ' · Declined' : " · Didn't go through") : ''}
        </Text>
      </View>
      <Text
        style={[
          s.tamt,
          incoming && { color: color.green },
          declined && navigatorView && { color: color.red },
          declined && !navigatorView && { color: color.soft },
        ]}
      >
        {money(txn.amount, { sign: incoming })}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
      {body}
    </Pressable>
  );
}

const s = StyleSheet.create({
  txn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  tname: { fontFamily: font.extrabold, fontSize: 15, color: color.ink },
  tsub: { fontFamily: font.semibold, fontSize: 12, color: color.soft, marginTop: 1 },
  tamt: { marginLeft: 'auto', fontFamily: font.black, fontSize: 16, color: color.ink },
});
