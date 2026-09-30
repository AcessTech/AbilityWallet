import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { color, font, radius } from '../theme/tokens';
import { BrandRow } from './Brand';
import { Icon } from './Icon';

/**
 * The onboarding screen shell from docs/onboarding_walkthrough_aug7.html:
 * brandbar (back + mark + wordmark), question heading, sub-line, fields,
 * spacer, primary button at the bottom.
 */
export function OnboardScreen({
  question,
  sub,
  children,
  footer,
  onBack,
  showBack = true,
}: {
  question?: string;
  sub?: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.screenBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 20 + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.brandbar}>
          {showBack ? (
            <Pressable
              onPress={onBack ?? (() => router.back())}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={s.back}
            >
              <Icon name="back" size={22} stroke={color.navy} />
            </Pressable>
          ) : (
            <View style={s.back} />
          )}
          <BrandRow markSize={28} wordSize={18} />
          <View style={s.back} />
        </View>

        {question ? <Text style={s.q}>{question}</Text> : null}
        {sub ? <Text style={s.qSub}>{sub}</Text> : null}
        {children}
        <View style={{ flex: 1, minHeight: 24 }} />
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** An inline error line under a field. Plain, short, never defensive. */
export function ErrorLine({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <View style={s.err}>
      <Icon name="info" size={18} stroke={color.red} />
      <Text style={s.errText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  brandbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 },
  back: { width: 28, alignItems: 'flex-start' },
  q: { fontFamily: font.black, fontSize: 27, color: color.ink, lineHeight: 34 },
  qSub: { fontFamily: font.semibold, fontSize: 16, color: color.soft, marginTop: 8, lineHeight: 23 },
  err: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.redTint,
    borderRadius: radius.strip,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  errText: { flex: 1, fontFamily: font.bold, fontSize: 14, color: color.red, lineHeight: 20 },
});
