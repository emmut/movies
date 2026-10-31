import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

// Self-host color emoji for devices without a native emoji font.
export const emoji = localFont({
  src: './fonts/NotoColorEmoji.woff2',
  weight: '400',
  variable: '--font-emoji',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  fallback: [
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Noto Color Emoji"',
    'var(--font-emoji)',
    'sans-serif',
  ],
});
