import { AppSidebar } from '@/components/app-sidebar';
import { Footer } from '@/components/footer';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { PHProvider } from '@/providers/posthog';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import clsx from 'clsx';
import { Inter } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode, Suspense } from 'react';
import './globals.css';
import { Search } from './search';

const inter = Inter({ subsets: ['latin'], fallback: ['sans-serif'] });

export const metadata = {
  title: 'Movies',
  description: 'Find movies to watch',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={clsx(inter.className, 'bg-black text-neutral-100')}>
        <NuqsAdapter>
          <PHProvider>
            <SidebarProvider defaultOpen>
              <AppSidebar />

              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="mr-2 h-4" />

                    <Suspense>
                      <Search />
                    </Suspense>
                  </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                  {children}
                  <Footer />
                </div>
              </SidebarInset>
            </SidebarProvider>

            <Analytics />
            <SpeedInsights />
          </PHProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
