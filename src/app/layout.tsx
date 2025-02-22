import clsx from 'clsx';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PHProvider } from '@/contexts/PosthogProvider';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Search } from './search';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], fallback: ['sans-serif'] });

export const metadata = {
  title: 'Movies',
  description: 'Find movies to watch',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={clsx([inter.className])}>
        <PHProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="px flex h-16 shrink-0 items-center gap-4 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4" />
                <Search />
              </header>
              <div className="mx-auto w-full max-w-screen-xl p-4">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </PHProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
