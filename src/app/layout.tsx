import './globals.css';
import { Inter } from 'next/font/google';
import LayoutClient from '@/components/LayoutClient';
import cn from 'classnames';

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
      <body className={cn([inter.className, 'bg-neutral-800'])}>
        <LayoutClient>
          <main>{children}</main>
        </LayoutClient>
      </body>
    </html>
  );
}
