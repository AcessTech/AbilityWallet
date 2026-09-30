import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  Card, Empty, Loading, Muted, Row, Screen, Section, SubHeader, Title,
} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { money } from '../../src/lib/format';
import { color, font, ssiRoomColor } from '../../src/theme/tokens';
import { navigatorPill } from '../../src/lib/pills';

interface Analytics {
  cash_flow: { month: string; money_in: number; money_out: number }[];
  by_category: { label: string; total: number }[];
  resource_limit: number;
  ssi_room: number;
  balance_now: number;
}

/**
 * Prototype screen `maria/nanalytics` and the `n_anly_*` detail screens:
 * cash flow, a spending donut, and the balance line against the $2,000 limit.
 */
export default function Analytics() {
  const router = useRouter();
  const { activeMemberId, otherFirstName } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async (): Promise<Analytics> => {
      const { data, error } = await supabase.rpc('navigator_analytics', {
        p_member: activeMemberId!,
        p_months: 6,
      });
      if (error) throw error;
      return data as unknown as Analytics;
    },
  });

  const pill = navigatorPill(otherFirstName);
  const total = data?.by_category.reduce((s, c) => s + Number(c.total), 0) ?? 0;

  return (
    <Screen>
      <SubHeader pillLabel={pill} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Analytics" />

      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Section first>Money in and out</Section>
          <Card>
            {data.cash_flow.length === 0 ? (
              <Empty text="Not enough history yet." icon="bars" />
            ) : (
              <CashFlow rows={data.cash_flow} />
            )}
          </Card>

          <Section>Where it went this month</Section>
          <Card>
            {data.by_category.length === 0 ? (
              <Empty text="Nothing spent this month." icon="dollar" />
            ) : (
              <>
                <Donut rows={data.by_category} total={total} />
                <View style={{ marginTop: 14 }}>
                  {data.by_category.map((c, i) => (
                    <Row
                      key={c.label}
                      name={c.label}
                      value={money(c.total)}
                      last={i === data.by_category.length - 1}
                      right={<View style={[s.swatch, { backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }]} />}
                    />
                  ))}
                </View>
              </>
            )}
          </Card>

          <Section>Savings and the $2,000 limit</Section>
          <Card>
            <BalanceLine balance={Number(data.balance_now)} limit={Number(data.resource_limit)} />
            <Row
              name="Room before the limit"
              value={money(data.ssi_room)}
              last
              right={<View style={[s.swatch, { backgroundColor: ssiRoomColor(Number(data.ssi_room)) }]} />}
            />
          </Card>
          <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
            <Muted>Based on the accounts in Ability Wallet. ABLE savings do not count toward the limit.</Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}

const SLICE_COLORS = ['#093870', '#2E7D5B', '#D97706', '#B3261E', '#5b6b80', '#1b6ca8', '#7B4397'];

function CashFlow({ rows }: { rows: { month: string; money_in: number; money_out: number }[] }) {
  const max = Math.max(...rows.flatMap((r) => [Number(r.money_in), Number(r.money_out)]), 1);
  const w = 300;
  const h = 130;
  const band = w / rows.length;
  return (
    <Svg viewBox={`0 0 ${w} ${h + 20}`} width="100%" height={h + 20}>
      {rows.map((r, i) => {
        const inH = (Number(r.money_in) / max) * h;
        const outH = (Number(r.money_out) / max) * h;
        const x = i * band + band * 0.15;
        const bw = band * 0.32;
        return (
          <React.Fragment key={r.month}>
            <Rect x={x} y={h - inH} width={bw} height={inH} rx={3} fill={color.green} />
            <Rect x={x + bw + 4} y={h - outH} width={bw} height={outH} rx={3} fill={color.navy} />
          </React.Fragment>
        );
      })}
      <Line x1={0} y1={h} x2={w} y2={h} stroke={color.line} strokeWidth={1} />
    </Svg>
  );
}

function Donut({ rows, total }: { rows: { label: string; total: number }[]; total: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg viewBox="0 0 84 84" width={150} height={150}>
        <Circle cx={42} cy={42} r={r} fill="none" stroke={color.ringTrack} strokeWidth={12} />
        {rows.map((row, i) => {
          const frac = total > 0 ? Number(row.total) / total : 0;
          const dash = `${c * frac} ${c * (1 - frac)}`;
          const el = (
            <Circle
              key={row.label}
              cx={42}
              cy={42}
              r={r}
              fill="none"
              stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
              strokeWidth={12}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 42 42)"
            />
          );
          offset += c * frac;
          return el;
        })}
      </Svg>
      <Text style={{ fontFamily: font.black, fontSize: 20, color: color.navy, marginTop: -92, marginBottom: 72 }}>
        {money(total, { cents: false })}
      </Text>
    </View>
  );
}

function BalanceLine({ balance, limit }: { balance: number; limit: number }) {
  const w = 300;
  const h = 100;
  const y = h - Math.min(balance / limit, 1.1) * h;
  return (
    <Svg viewBox={`0 0 ${w} ${h + 16}`} width="100%" height={h + 16}>
      <Line x1={0} y1={0} x2={w} y2={0} stroke={color.red} strokeWidth={2} strokeDasharray="6 5" />
      <Path d={`M0 ${h} L ${w * 0.35} ${h * 0.8} L ${w * 0.7} ${y} L ${w} ${y}`} stroke={color.navy} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Line x1={0} y1={h} x2={w} y2={h} stroke={color.line} strokeWidth={1} />
    </Svg>
  );
}

const s = StyleSheet.create({
  swatch: { width: 12, height: 12, borderRadius: 3 },
});
