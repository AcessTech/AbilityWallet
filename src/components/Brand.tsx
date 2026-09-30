import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { color, font } from '../theme/tokens';

/**
 * The brand mark: navy arc, gold arc, gold coin with "A$W".
 * Traced from the inline SVG in the design's screen headers.
 */
export function Mark({ size = 30, white = false }: { size?: number; white?: boolean }) {
  return (
    <Svg viewBox="0 0 96 96" width={size} height={size}>
      <Path
        d="M35 22.5 A26 26 0 0 0 39.1 69.4"
        stroke={white ? '#ffffff' : color.navy}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M61 22.5 A26 26 0 0 1 56.9 69.4"
        stroke={color.gold}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={48} cy={45} r={16.5} fill={color.gold} />
      <SvgText
        x={48}
        y={50.5}
        textAnchor="middle"
        fontFamily={font.black}
        fontSize={13}
        fill={color.navy}
      >
        A$W
      </SvgText>
    </Svg>
  );
}

export function Wordmark({ size = 20, white = false }: { size?: number; white?: boolean }) {
  return (
    <Text style={{ fontFamily: font.black, fontSize: size }}>
      <Text style={{ color: white ? '#ffffff' : color.navy }}>Ability</Text>
      <Text style={{ color: color.gold }}>Wallet</Text>
    </Text>
  );
}

/** Header lockup: mark + wordmark, side by side. */
export function BrandRow({ markSize = 30, wordSize = 20, white = false }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Mark size={markSize} white={white} />
      <Wordmark size={wordSize} white={white} />
    </View>
  );
}

/** Success screens carry the lockup top centre. */
export function BrandLockup() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 22 }}>
      <BrandRow markSize={34} wordSize={22} />
    </View>
  );
}
