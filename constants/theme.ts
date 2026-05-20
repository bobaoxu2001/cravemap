// Minimalist palette — 2 brand colors (primary orange + verified green) on
// a cool neutral scale. Yellow accent demoted to muted amber; warm tinted
// secondary background cooled toward off-white. Keys are unchanged so all
// consumers continue to compile.
export const Colors = {
  primary: '#E8450A',         // brand orange — primary CTAs only
  primaryLight: '#FF7849',    // hover/pressed state of primary
  secondary: '#F7F4F0',       // soft off-white tint (was warm beige)
  accent: '#D97706',          // muted amber (was vivid yellow #FFB800)
  green: '#10B981',           // verified / success — cleaner modern green
  text: '#18181B',            // high-contrast for essential info
  textSecondary: '#52525B',   // cool neutral grey for secondary info
  textMuted: '#A1A1AA',       // muted for de-emphasis only
  background: '#FAFAFA',      // app background (cool neutral)
  card: '#FFFFFF',
  border: '#E5E5E5',          // hairline divider
  error: '#E8450A',           // reuse primary so we don't introduce a 4th hue
};

// Wider whitespace bias — sm/md/lg the workhorse trio.
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// One geometry: 8/12/16/20 + full. Tighter than 8/12/16/24.
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// Slightly lighter heading weights for an "airy" feel.
export const Typography = {
  h1: { fontSize: 28, fontWeight: '600' as const },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const },
};

// Shared elevation tokens. Spread into a StyleSheet entry like:
//   card: { ...Shadows.md }
// Keeps iOS shadow params and Android elevation in lockstep so cards look the
// same on both platforms. Use sparingly — flat is good.
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
