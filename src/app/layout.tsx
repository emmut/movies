import Navigation from '@/components/Navigation';
import './globals.css';
import { Inter } from 'next/font/google';

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
      <body className={inter.className}>
        <div className="grid min-h-screen grid-cols-12 grid-rows-[repeat(12,minmax(0,1fr))] bg-neutral-800 text-neutral-50">
          <Navigation />

          <main className="container col-span-10 col-start-3 row-start-2 row-end-[13] mx-auto overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
