import Navigation from '@/components/Navigation';
import './globals.css';
import { Inter } from 'next/font/google';
import Brand from '@/components/Brand';
import Header from '@/components/Header';

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
        <div className="grid min-h-screen grid-cols-12 grid-rows-6 bg-neutral-800 text-neutral-50">
          <aside className="col-span-2 row-span-full flex flex-col items-center border-r border-zinc-600 bg-neutral-900 p-1 md:p-3">
            <Brand />
            <Navigation />
          </aside>
          <Header />

          <main className="container col-span-10 col-start-3 row-start-2 row-end-7 mx-auto overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
