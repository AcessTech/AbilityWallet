import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '../theme/tokens';
import { money } from '../lib/format';
import type { MemberHome } from '../data/hooks';

type Line = MemberHome['budget'][number];

/**
 * The Navigator's budget row: name, amount per period, a fill bar, and what
 * has been spent. Stop and alert lines get a plain sub-line under the amount —
 * no badges at all, and the words "Firm limit", "Card stops here" and
 * "Decline" never appear (Appendix A §0.5).
 */
export function modeSubLine(line: Line): string | null {
  if (line.mode === 'stop') {
    return line.category === 'atm'
      ? 'withdrawals over this are declined'
      : 'purchases over this are declined';
  }
  if (line.mode === 'alert') return 'going over sends you an alert';
  return null;
}

export function BudgetBar({ line, last = false }: { line: Line; last?: boolean }) {
  const fill = line.amount > 0 ? Math.min(Number(line.spent) / Number(line.amount), 1) : 0;
  const sub = modeSubLine(line);
  const pending = line.pending_change as { amount?: number } | null;

  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <View style={s.top}>
        <Text style={s.name}>{line.display_name}</Text>
        <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
          <Text style={s.amount}>
            {money(line.amount, { cents: false })} / {line.period}
          </Text>
          {sub ? <Text style={s.mode}>{sub}</Text> : null}
        </View>
      </View>

      <View style={s.track}>
        <View style={[s.fill, { width: `${fill * 100}%` }]} />
      </View>

      <Text style={s.spent}>{money(line.spent, { cents: false })} spent so far</Text>

      {pending?.amount != null ? (
        <Text style={s.waiting}>
          Waiting on an answer about {money(pending.amount, { cents: false })}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: color.line },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  name: { fontFamily: font.extrabold, fontSize: 16, color: color.ink },
  amount: { fontFamily: font.black, fontSize: 15, color: color.navy },
  mode: { fontFamily: font.bold, fontSize: 11, color: color.soft, marginTop: 1 },
  track: { height: 8, backgroundColor: color.ringTrack, borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%', backgroundColor: color.navy, borderRadius: 999 },
  spent: { fontFamily: font.semibold, fontSize: 13, color: color.soft, marginTop: 4 },
  waiting: { fontFamily: font.bold, fontSize: 13, color: color.orange, marginTop: 4 },
});
