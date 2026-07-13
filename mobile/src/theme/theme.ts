// Design language: "time clock / punch card" — a nod to the physical object
// this app replaces. Warm paper background, ink-dark text, a single confident
// teal accent standing in for the "stamp" of a punch clock, monospace for
// anything numeric (time, codes) to evoke a digital clock readout.

export const colors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceSunken: '#F1ECE3',

  ink: '#201F1D',
  inkSoft: '#6B655C',
  inkFaint: '#A39C90',

  accent: '#1F6F5C',
  accentSoft: '#E1EDE8',
  accentDeep: '#164F41',

  amber: '#C97C2C',
  amberSoft: '#F6E9D8',

  danger: '#B3432B',
  dangerSoft: '#F5E1DC',

  violet: '#6B4FA0',
  violetSoft: '#EDE7F6',

  border: '#E7E1D8',
  white: '#FFFFFF',
} as const;

export const statusStyles = {
  present: { fg: colors.accentDeep, bg: colors.accentSoft, label: 'Present' },
  late: { fg: colors.amber, bg: colors.amberSoft, label: 'Late' },
  absent: { fg: colors.danger, bg: colors.dangerSoft, label: 'Absent' },
  half_day: { fg: colors.violet, bg: colors.violetSoft, label: 'Half day' },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

// Monospace stack renders consistently on both platforms for numeric/time display.
export const monoFont = 'Courier New';

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
} as const;
