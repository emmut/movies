import cn from 'classnames';
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
        className={cn([
          inter.className,
          'h-screen max-h-screen bg-neutral-800 desktop:overflow-y-hidden',
        ])}
      >
        <LayoutClient>
          <main>{children}</main>
        </LayoutClient>
      </body>
    </html>
  );
}
