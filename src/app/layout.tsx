import clsx from 'clsx';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PHProvider } from '@/providers/posthog';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Search } from './search';
import { ReactNode, Suspense } from 'react';
import { Footer } from '@/components/footer';

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
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const json = localStorage.theme;
                const theme = json ? JSON.parse(json) : { state: 'system' };
                if (theme.state === 'dark' || ((!('theme' in localStorage) || theme.state === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={clsx([inter.className])}>
        <PHProvider>
          <SidebarProvider>
            <AppSidebar />
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
      </body>
    </html>
  );
}
