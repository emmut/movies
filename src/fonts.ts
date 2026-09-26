import { Oxanium, Roboto } from 'next/font/google';

export const roboto = Roboto({
  subsets: ['latin'],
  fallback: ['sans-serif'],
  variable: '--font-sans',
});

export const oxaniumHeading = Oxanium({
  subsets: ['latin'],
  fallback: ['sans-serif'],
  variable: '--font-heading',
});
