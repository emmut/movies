import { AppSidebar } from '@/components/app-sidebar';
import { Footer } from '@/components/footer';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth-server';
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
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en" className="dark">
      <body className={clsx([inter.className])}>
        <NuqsAdapter>
          <PHProvider>
            <SidebarProvider>
              <AppSidebar initialSession={session} />
              <SidebarInset>
                <header className="px flex h-16 shrink-0 items-center gap-4 border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="h-4" />
                  <Suspense>
                    <Search />
                  </Suspense>
                </header>
                <div className="mx-auto w-full max-w-screen-xl p-4">
                  {children}
                </div>
                <Footer />
              </SidebarInset>
            </SidebarProvider>
          </PHProvider>
          <Analytics />
          <SpeedInsights />
        </NuqsAdapter>
      </body>
    </html>
  );
}
