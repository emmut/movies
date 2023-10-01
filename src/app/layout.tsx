import clsx from 'clsx';
import { Inter } from 'next/font/google';
import './globals.css';
import LayoutClient from '@/components/layouts/LayoutClient';
import AuthProvider from '@/providers/AuthProvider';

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
    <html lang="en">
      <body
        className={clsx([
          inter.className,
          'bg-neutral-800 desktop:overflow-y-hidden',
        ])}
      >
        <AuthProvider>
          <LayoutClient>{children}</LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
