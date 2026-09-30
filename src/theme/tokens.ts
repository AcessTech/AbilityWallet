/**
 * Design tokens, taken from the shared <style> block in
 * docs/ability_wallet_prototype_v5.html. Every screen in the prototype uses
 * the same stylesheet, so these values are the whole visual vocabulary.
 * Brief §6.
 */

export const color = {
  navy: '#093870',
  gold: '#F8AA12',
  ink: '#1b2a41',
  soft: '#5b6b80',
  line: '#e2e8f0',
  green: '#2E7D5B',
  orange: '#D97706',
  red: '#B3261E',

  // Surfaces, from the prototype's .phone / .screen / .card rules.
  screenBg: '#f4f6f9',
  cardBg: '#ffffff',
  statusBg: '#ffffff',
  fieldBg: '#f6f8fb',
  greyBtnBg: '#eef2f7',
  ringTrack: '#e9edf2',
  chev: '#a8b3c2',

  // Tinted pills and notes.
  noteBg: '#fff8ea',
  redTint: '#fdeceb',
  greenTint: '#e6f2ec',
  toggleOff: '#d5dce5',
} as const;

/**
 * Nunito Sans weights in use. The prototype asks for 1000; Google ships static
 * cuts only to 900, and React Native cannot select a variable-font axis, so
 * 900 Black stands in for the heaviest weight.
 */
export const font = {
  regular: 'NunitoSans_400Regular',
  semibold: 'NunitoSans_600SemiBold',
  bold: 'NunitoSans_700Bold',
  extrabold: 'NunitoSans_800ExtraBold',
  black: 'NunitoSans_900Black',
} as const;

export const radius = {
  card: 20,
  field: 18,
  button: 16,
  smallButton: 14,
  tile: 13,
  icon: 12,
  strip: 14,
  pill: 999,
} as const;

export const space = {
  screenH: 20,
  screenTop: 18,
  cardGap: 14,
  rowV: 13,
} as const;

/** Budget ring geometry is fixed by the prototype: r=34 in an 84-box, stroke 9. */
export const ring = {
  box: 84,
  radius: 34,
  stroke: 9,
  circumference: 2 * Math.PI * 34, // 213.6 in the markup
  renderSize: 88,
} as const;

/**
 * Gauges show money LEFT and drain green -> orange -> red (brief §6).
 * Thresholds are the fraction of the budget line still unspent.
 */
export function gaugeColor(fractionLeft: number): string {
  if (fractionLeft >= 0.5) return color.green;
  if (fractionLeft >= 0.2) return color.orange;
  return color.red;
}

/** SSI room bands, Appendix A §2.3 a2: green >= $300, orange $100-299, red < $100. */
export function ssiRoomColor(room: number): string {
  if (room >= 300) return color.green;
  if (room >= 100) return color.orange;
  return color.red;
}

export const shadow = {
  card: {
    shadowColor: '#093870',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;
