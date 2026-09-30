import React from 'react';
import { View } from 'react-native';
import { Card, Ring } from '../components/ui';
import { gaugeColor } from '../theme/tokens';
import { moneyShort } from '../lib/format';
import type { MemberHome } from '../data/hooks';

type Line = MemberHome['budget'][number];

/**
 * Budget rings. Both roles use rings (decided Sep 23). Gauges show money LEFT
 * and drain green -> orange -> red. The Member's side shows rings only: no
 * mode tags ever (Appendix A §0.5).
 */
export function BudgetRings({
  lines,
  onPress,
}: {
  lines: Line[];
  onPress?: (line: Line) => void;
}) {
  const shown = lines.slice(0, 3);
  return (
    <Card style={{ flexDirection: 'row', paddingTop: 14, paddingBottom: 10, paddingHorizontal: 6 }}>
      {shown.map((l) => (
        <Ring
          key={l.id}
          label={l.display_name}
          amountText={moneyShort(l.remaining)}
          fraction={Number(l.fraction_left)}
          strokeColor={gaugeColor(Number(l.fraction_left))}
          onPress={onPress ? () => onPress(l) : undefined}
        />
      ))}
      {shown.length === 0 ? <View style={{ height: 88 }} /> : null}
    </Card>
  );
}
