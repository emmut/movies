import clsx from 'clsx';
import { Inter } from 'next/font/google';
import './globals.css';
import LayoutClient from '@/components/LayoutClient';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en">
      <body
        className={clsx([
          inter.className,
          'bg-neutral-800 desktop:overflow-y-hidden',
        ])}
      >
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
