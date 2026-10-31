import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

// Outline glyphs work even on TV browsers without color-emoji font support.
export const emoji = localFont({
  src: './fonts/NotoEmoji.ttf',
  weight: '300 700',
  variable: '--font-emoji',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  fallback: ['var(--font-emoji)', 'sans-serif'],
});
