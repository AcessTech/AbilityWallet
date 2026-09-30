import React from 'react';
import {
  Platform,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { color, font, radius, ring as ringGeo, shadow, space } from '../theme/tokens';
import { Icon, IconName } from './Icon';
import { BrandRow, Mark } from './Brand';

/* ------------------------------------------------------------ layout ---- */

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingHorizontal: space.screenH,
    paddingTop: space.screenTop,
    paddingBottom: 8 + insets.bottom,
  };
  if (!scroll) {
    return <View style={[s.screen, pad, style]}>{children}</View>;
  }
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[pad, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/**
 * Tab-screen header: brand mark + wordmark on the left, an action pill on the
 * right, no page title.
 */
export function BrandHeader({
  pillLabel,
  pillIcon = 'chat',
  onPillPress,
}: {
  pillLabel: string;
  pillIcon?: IconName;
  onPillPress?: () => void;
}) {
  return (
    <View style={s.header}>
      <BrandRow />
      <ActionPill label={pillLabel} icon={pillIcon} onPress={onPillPress} />
    </View>
  );
}

/**
 * Page-title header: title + help pill. Used on the Member's Card, Spend, Save
 * and Account tabs; Card also shows the small mark.
 */
export function TitleHeader({
  title,
  showMark = false,
  pillLabel,
  onPillPress,
}: {
  title: string;
  showMark?: boolean;
  pillLabel: string;
  onPillPress?: () => void;
}) {
  return (
    <View style={s.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {showMark ? <Mark size={26} /> : null}
        <Text style={s.pageTitle}>{title}</Text>
      </View>
      <ActionPill label={pillLabel} onPress={onPillPress} />
    </View>
  );
}

/**
 * Sub-page header: a round white back button, the mark and wordmark in the
 * middle, and the action pill on the right (the pill appears on every
 * screen, sub-pages included).
 */
export function SubHeader({
  pillLabel,
  onPillPress,
  onBack,
}: {
  pillLabel: string;
  onPillPress?: () => void;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <View style={s.header}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [s.backCircle, pressed && s.pressed]}
      >
        <Icon name="back" size={20} stroke={color.navy} />
      </Pressable>
      <BrandRow markSize={26} wordSize={16} />
      <ActionPill label={pillLabel} onPress={onPillPress} />
    </View>
  );
}

/** A centred hero for a detail screen: big tile, name, amount, time. */
export function DetailHero({
  tileText,
  tileColor: tint,
  name,
  amount,
  amountColor,
  when,
  pill,
}: {
  tileText: string;
  tileColor: string;
  name: string;
  amount: string;
  amountColor?: string;
  when: string;
  pill?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 20 }}>
      <View style={[s.bigTile, { backgroundColor: tint }]}>
        <Text style={s.bigTileText}>{tileText}</Text>
      </View>
      <Text style={s.detailName}>{name}</Text>
      <Text style={[s.big, amountColor ? { color: amountColor } : null]}>{amount}</Text>
      {pill}
      <Text style={s.detailWhen}>{when}</Text>
    </View>
  );
}

export function ActionPill({
  label,
  icon = 'chat',
  onPress,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.pill, pressed && s.pressed]}
    >
      <Text style={s.pillText}>{label}</Text>
      <Icon name={icon} size={19} stroke="#ffffff" />
    </Pressable>
  );
}

/* -------------------------------------------------------------- cards ---- */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && s.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function Section({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return <Text style={[s.section, first && { marginTop: 0 }]}>{children}</Text>;
}

/** A list row: name (+ sub) on the left, value and/or chevron on the right. */
export function Row({
  name,
  sub,
  value,
  big = false,
  icon,
  chevron = false,
  onPress,
  right,
  last = false,
  danger = false,
}: {
  name: string;
  sub?: string;
  value?: string;
  big?: boolean;
  icon?: IconName;
  chevron?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
  last?: boolean;
  danger?: boolean;
}) {
  const inner = (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <View style={s.rl}>
        {icon ? (
          <View style={s.ric}>
            <Icon name={icon} size={19} stroke={color.navy} />
          </View>
        ) : null}
        <View style={{ flexShrink: 1 }}>
          <Text style={[s.rname, danger && { color: color.red }]}>{name}</Text>
          {sub ? <Text style={s.rsub}>{sub}</Text> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {right}
        {value ? <Text style={[s.rval, big && s.rvalBig]}>{value}</Text> : null}
        {chevron ? <Text style={s.chev}>›</Text> : null}
      </View>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && s.pressed]}
    >
      {inner}
    </Pressable>
  );
}

/* ------------------------------------------------------------ buttons ---- */

export function Btn({
  label,
  kind = 'gold',
  icon,
  onPress,
  disabled,
  busy,
}: {
  label: string;
  kind?: 'gold' | 'grey' | 'red' | 'dark';
  icon?: IconName;
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const tint =
    kind === 'gold' ? color.navy : kind === 'red' ? color.red : kind === 'dark' ? '#fff' : color.navy;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        s.btn,
        kind === 'gold' && { backgroundColor: color.gold },
        kind === 'grey' && { backgroundColor: color.greyBtnBg, marginTop: 10 },
        kind === 'red' && { backgroundColor: color.redTint, marginTop: 10 },
        kind === 'dark' && { backgroundColor: '#000' },
        (disabled || busy) && { opacity: 0.5 },
        pressed && s.pressed,
      ]}
    >
      {busy ? <ActivityIndicator color={tint} /> : null}
      <Text style={[s.btnText, { color: tint }]}>{label}</Text>
      {icon ? <Icon name={icon} size={19} stroke={tint} /> : null}
    </Pressable>
  );
}

/** Static Yes / No pair. Never dynamic per-purchase button text. */
export function YesNo({
  onYes,
  onNo,
  yesLabel = 'Yes',
  noLabel = 'No',
  busy,
}: {
  onYes: () => void;
  onNo: () => void;
  yesLabel?: string;
  noLabel?: string;
  busy?: boolean;
}) {
  return (
    <View style={s.btnRow}>
      <Pressable
        onPress={onYes}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={yesLabel}
        style={({ pressed }) => [s.smallBtn, { backgroundColor: color.gold }, pressed && s.pressed]}
      >
        <Text style={[s.smallBtnText, { color: color.navy }]}>{yesLabel}</Text>
      </Pressable>
      <Pressable
        onPress={onNo}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={noLabel}
        style={({ pressed }) => [s.smallBtn, { backgroundColor: color.greyBtnBg }, pressed && s.pressed]}
      >
        <Text style={[s.smallBtnText, { color: color.navy }]}>{noLabel}</Text>
      </Pressable>
    </View>
  );
}

/* --------------------------------------------------------------- bits ---- */

/** The gold-bordered question card at the top of Home. */
export function Ask({
  logo,
  headline,
  body,
  children,
}: {
  logo?: React.ReactNode;
  headline: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={s.ask}>
      {logo}
      <View style={{ flex: 1 }}>
        <Text style={s.askHead}>{headline}</Text>
        <Text style={s.askSub}>{body}</Text>
        {children}
      </View>
    </View>
  );
}

/** A notice strip. Never competes with a question for the slot. */
export function Strip({ text, onPress }: { text: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.strip, pressed && s.pressed]}>
      <Icon name="info" size={18} stroke={color.ink} />
      <Text style={s.stripText}>{text}</Text>
    </Pressable>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={[s.card, s.note]}>
      <Icon name="info" size={20} stroke={color.navy} />
      <Text style={s.noteText}>{children}</Text>
    </View>
  );
}

export function Empty({ text, icon = 'info' }: { text: string; icon?: IconName }) {
  return (
    <View style={s.empty}>
      <Icon name={icon} size={22} stroke={color.soft} />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

export function Pill({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'red' | 'green' }) {
  const bg = tone === 'red' ? color.redTint : tone === 'green' ? color.greenTint : color.greyBtnBg;
  const fg = tone === 'red' ? color.red : tone === 'green' ? color.green : color.navy;
  return (
    <View style={[s.pillN, { backgroundColor: bg }]}>
      <Text style={[s.pillNText, { color: fg }]}>{text}</Text>
    </View>
  );
}

/** Merchant tile: two initials on a coloured rounded square. */
export function Logo({ text, bg, size = 40 }: { text: string; bg: string; size?: number }) {
  return (
    <View style={[s.logo, { width: size, height: size, backgroundColor: bg }]}>
      <Text style={[s.logoText, { fontSize: size * 0.33 }]}>{text}</Text>
    </View>
  );
}

/** A budget ring. Geometry fixed by the design: r=34, stroke 9. */
export function Ring({
  label,
  sub = 'left',
  amountText,
  fraction,
  strokeColor,
  onPress,
}: {
  label: string;
  sub?: string;
  amountText: string;
  fraction: number; // 0..1 of the line still unspent
  strokeColor: string;
  onPress?: () => void;
}) {
  const c = ringGeo.circumference;
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}, ${amountText} ${sub}`}
      style={({ pressed }) => [s.ring, pressed && s.pressed]}
    >
      <Svg viewBox="0 0 84 84" width={ringGeo.renderSize} height={ringGeo.renderSize}>
        <Circle cx={42} cy={42} r={ringGeo.radius} fill="none" stroke={color.ringTrack} strokeWidth={ringGeo.stroke} />
        <Circle
          cx={42}
          cy={42}
          r={ringGeo.radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={ringGeo.stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform="rotate(-90 42 42)"
        />
        <SvgText x={42} y={48} textAnchor="middle" fontSize={19} fontFamily={font.extrabold} fill={color.navy}>
          {amountText}
        </SvgText>
      </Svg>
      <Text style={s.ringName}>{label}</Text>
      <Text style={s.ringSub}>{sub}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={color.chev}
        style={[s.input, focused && s.inputFocus, props.value ? s.inputFilled : null]}
      />
    </View>
  );
}

export function Toggle({ on, onPress }: { on: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={[s.tog, { backgroundColor: on ? color.green : color.toggleOff }]}
    >
      <View style={[s.togKnob, on ? { right: 3 } : { left: 3 }]} />
    </Pressable>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <Text style={s.hint}>{children}</Text>;
}

export function Plain({ children }: { children: React.ReactNode }) {
  return <Text style={s.plain}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={s.muted}>{children}</Text>;
}

export function Title({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={s.title}>
      <Text style={s.titleH1}>{title}</Text>
      {sub ? <Text style={s.titleP}>{sub}</Text> : null}
    </View>
  );
}

export function Hero({ label, amount }: { label?: string; amount: string }) {
  return (
    <View style={s.hero}>
      {label ? <Text style={s.rsub}>{label}</Text> : null}
      <Text style={s.big}>{amount}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <ActivityIndicator color={color.navy} />
    </View>
  );
}

/* ------------------------------------------------------------- styles ---- */

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.screenBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  bigTile: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bigTileText: { color: '#fff', fontFamily: font.black, fontSize: 26 },
  detailName: { fontFamily: font.black, fontSize: 22, color: color.ink, textAlign: 'center' },
  detailWhen: { fontFamily: font.bold, fontSize: 14, color: color.soft, marginTop: 8 },
  pageTitle: { fontFamily: font.black, fontSize: 26, color: color.navy },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.pill,
    backgroundColor: color.navy,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pillText: { color: '#fff', fontFamily: font.extrabold, fontSize: 15 },
  pressed: { opacity: 0.7 },

  card: {
    backgroundColor: color.cardBg,
    borderRadius: radius.card,
    padding: 20,
    marginBottom: space.cardGap,
    ...shadow.card,
  },
  section: {
    fontFamily: font.extrabold,
    fontSize: 13,
    color: color.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.rowV,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    gap: 12,
  },
  rl: { flexDirection: 'row', alignItems: 'center', gap: 13, flexShrink: 1 },
  rname: { fontFamily: font.extrabold, fontSize: 16, color: color.ink },
  rsub: { fontFamily: font.semibold, fontSize: 13, color: color.soft, marginTop: 1 },
  rval: { fontFamily: font.bold, fontSize: 15, color: color.soft, textAlign: 'right' },
  rvalBig: { fontFamily: font.black, fontSize: 20, color: color.navy },
  chev: { color: color.chev, fontSize: 20, fontFamily: font.bold },
  ric: {
    width: 38,
    height: 38,
    borderRadius: radius.icon,
    backgroundColor: color.greyBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btn: {
    width: '100%',
    borderRadius: radius.button,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: { fontFamily: font.extrabold, fontSize: 17 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallBtn: { flex: 1, borderRadius: radius.smallButton, paddingVertical: 13, alignItems: 'center' },
  smallBtnText: { fontFamily: font.extrabold, fontSize: 16 },

  ask: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: color.gold,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: space.cardGap,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  askHead: { fontFamily: font.extrabold, fontSize: 17, color: color.ink },
  askSub: { fontFamily: font.semibold, fontSize: 15, color: color.soft, marginTop: 3, lineHeight: 21 },

  strip: {
    backgroundColor: color.greyBtnBg,
    borderRadius: radius.strip,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stripText: { fontFamily: font.bold, fontSize: 14, color: color.ink, flex: 1 },

  note: {
    backgroundColor: color.noteBg,
    borderWidth: 2,
    borderColor: color.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  noteText: { fontFamily: font.semibold, fontSize: 15, color: color.ink, lineHeight: 22, flex: 1 },

  empty: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, gap: 8 },
  emptyText: { fontFamily: font.semibold, fontSize: 14, color: color.soft, textAlign: 'center' },

  pillN: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  pillNText: { fontFamily: font.extrabold, fontSize: 14 },

  logo: { borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontFamily: font.black },

  ring: { flex: 1, alignItems: 'center', gap: 4 },
  ringName: { fontFamily: font.extrabold, fontSize: 13, color: color.ink, textAlign: 'center' },
  ringSub: { fontFamily: font.semibold, fontSize: 11, color: color.soft },

  fieldLabel: { fontFamily: font.extrabold, fontSize: 14, color: color.soft, marginTop: 14 },
  input: {
    backgroundColor: color.fieldBg,
    borderWidth: 3,
    borderColor: color.line,
    borderRadius: radius.field,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 18,
    fontFamily: font.bold,
    color: color.ink,
    marginTop: 12,
  },
  inputFocus: { borderColor: color.gold, backgroundColor: '#fff' },
  inputFilled: { color: color.ink },

  tog: { width: 50, height: 30, borderRadius: radius.pill, justifyContent: 'center' },
  togKnob: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },

  hint: { fontFamily: font.semibold, fontSize: 13, color: color.soft, textAlign: 'center', marginTop: 12 },
  plain: { fontFamily: font.semibold, fontSize: 16, color: color.ink, lineHeight: 24 },
  muted: { fontFamily: font.semibold, fontSize: 14, color: color.soft, lineHeight: 21 },

  title: { alignItems: 'center', paddingTop: 6, paddingBottom: 18 },
  titleH1: { fontFamily: font.black, fontSize: 24, color: color.ink, textAlign: 'center' },
  titleP: { fontFamily: font.bold, fontSize: 15, color: color.soft, marginTop: 4, textAlign: 'center', lineHeight: 22 },

  hero: { alignItems: 'center', paddingBottom: 18 },
  big: { fontFamily: font.black, fontSize: 46, color: color.navy, letterSpacing: -1, marginTop: 2 },
});

export { s as uiStyles };

/* ------------------------------------------------- option buttons -------- */

/** An option button: big tappable choice, optional
 *  description line, navy border when selected. */
export function Option({
  label,
  desc,
  selected = false,
  compact = false,
  onPress,
}: {
  label: string;
  desc?: string;
  selected?: boolean;
  compact?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={desc ? `${label}. ${desc}` : label}
      style={({ pressed }) => [
        o.opt,
        compact && { paddingVertical: 12 },
        selected && o.optSel,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={o.optLabel}>{label}</Text>
        {desc ? <Text style={o.optDesc}>{desc}</Text> : null}
      </View>
    </Pressable>
  );
}

/** A selectable chip, e.g. the category picker. */
export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        o.chip,
        selected && { backgroundColor: color.navy },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[o.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/** Two small stat tiles side by side (the `.kpi` block). */
export function Kpi({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
      {items.map((it) => (
        <View key={it.label} style={o.kpi}>
          <Text style={o.kpiLabel}>{it.label}</Text>
          <Text style={o.kpiValue}>{it.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** The card art used on the Card tab and the acceptance screens. */
export function CardArt({ name, last4 }: { name: string; last4: string }) {
  return (
    <View style={o.cardArt}>
      <Text style={o.cardArtBrand}>
        Ability<Text style={{ color: color.gold }}>Wallet</Text>
      </Text>
      <Text style={o.cardArtNumber}>{`•••• •••• •••• ${last4}`}</Text>
      <Text style={o.cardArtName}>{name.toUpperCase()}</Text>
    </View>
  );
}

const o = StyleSheet.create({
  opt: {
    backgroundColor: color.fieldBg,
    borderWidth: 3,
    borderColor: color.line,
    borderRadius: radius.field,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optSel: { borderColor: color.navy, backgroundColor: '#fff' },
  optLabel: { fontFamily: font.extrabold, fontSize: 17, color: color.navy },
  optDesc: { fontFamily: font.semibold, fontSize: 13, color: color.soft, marginTop: 2, lineHeight: 19 },

  chip: {
    backgroundColor: color.greyBtnBg,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontFamily: font.extrabold, fontSize: 14, color: color.navy },

  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, ...shadow.card },
  kpiLabel: { fontFamily: font.bold, fontSize: 12, color: color.soft },
  kpiValue: { fontFamily: font.black, fontSize: 20, color: color.navy, marginTop: 2 },

  cardArt: {
    marginTop: 26,
    backgroundColor: color.navy,
    borderRadius: 20,
    padding: 22,
    minHeight: 190,
    justifyContent: 'flex-start',
  },
  cardArtBrand: { fontFamily: font.black, fontSize: 17, color: '#fff' },
  cardArtNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 19,
    letterSpacing: 3,
    marginTop: 52,
    color: '#fff',
  },
  cardArtName: { fontSize: 14, letterSpacing: 1, marginTop: 16, color: '#fff', fontFamily: font.bold },
});

/** The round avatar used for people: gold for the Navigator, navy for the AI. */
export function Avatar({
  letter,
  bg = color.gold,
  fg = color.navy,
  size = 44,
  icon,
}: {
  letter?: string;
  bg?: string;
  fg?: string;
  size?: number;
  icon?: IconName;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon ? (
        <Icon name={icon} size={size * 0.45} stroke={fg} />
      ) : (
        <Text style={{ fontFamily: font.black, fontSize: size * 0.4, color: fg }}>{letter}</Text>
      )}
    </View>
  );
}

/** A small grey button that sits at the right of a row ("Turn on"). */
export function RowButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          backgroundColor: color.greyBtnBg,
          borderRadius: 12,
          paddingVertical: 9,
          paddingHorizontal: 14,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={{ fontFamily: font.extrabold, fontSize: 14, color: color.navy }}>{label}</Text>
    </Pressable>
  );
}

/** The +/− stepper from the edit-a-limit screen. */
export function Stepper({
  value,
  step = 10,
  min = 0,
  onChange,
  format,
}: {
  value: number;
  step?: number;
  min?: number;
  onChange: (next: number) => void;
  format: (n: number) => string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Less"
        onPress={() => onChange(Math.max(min, value - step))}
        style={({ pressed }) => [st.stepBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={st.stepText}>−</Text>
      </Pressable>
      <Text style={st.stepValue}>{format(value)}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More"
        onPress={() => onChange(value + step)}
        style={({ pressed }) => [st.stepBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={st.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

/** The amount keypad on Send money. */
export function Keypad({ onKey }: { onKey: (key: string) => void }) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫'],
  ];
  return (
    <View style={{ marginTop: 2, marginBottom: 10 }}>
      {rows.map((row) => (
        <View key={row.join()} style={{ flexDirection: 'row' }}>
          {row.map((k) => (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={k === '⌫' ? 'Delete' : k}
              onPress={() => onKey(k)}
              style={({ pressed }) => [st.key, pressed && { opacity: 0.5 }]}
            >
              <Text style={st.keyText}>{k}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Applies a keypad press to an amount string. */
export function applyKey(current: string, key: string): string {
  if (key === '⌫') return current.slice(0, -1);
  if (key === '.') return current.includes('.') ? current : (current || '0') + '.';
  if (current.includes('.') && current.split('.')[1].length >= 2) return current;
  if (current === '0') return key;
  return current + key;
}

const st = StyleSheet.create({
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: color.greyBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontFamily: font.extrabold, fontSize: 24, color: color.navy },
  stepValue: { fontFamily: font.black, fontSize: 46, color: color.navy, letterSpacing: -1 },

  key: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  keyText: { fontFamily: font.extrabold, fontSize: 26, color: color.ink },
});
