import { Platform } from 'react-native';

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const typography = {
  hero: {
    fontSize: 34,
    fontWeight: '200',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 1.5,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mono: {
    fontSize: 13,
    fontFamily: monoFont,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
};
