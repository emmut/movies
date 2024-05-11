import clsx from 'clsx';
import { Inter } from 'next/font/google';
import './globals.css';
import LayoutClient from '@/components/LayoutClient';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'], fallback: ['sans-serif'] });

export const metadata = {
  title: 'Movies',
  description: 'Find movies to watch',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="desktop:h-full desktop:overflow-hidden">
      <body
        className={clsx([
          inter.className,
          'bg-neutral-800 desktop:h-full desktop:overflow-y-hidden',
        ])}
      >
        <LayoutClient>{children}</LayoutClient>
        <Analytics />
      </body>
    </html>
  );
}
