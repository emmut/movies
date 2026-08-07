import clsx from 'clsx';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode, Suspense } from 'react';
import { Toaster } from 'sonner';

import { BackScrollRestorer } from '@/components/back-scroll-restorer';
import { AppSidebarWrapper } from '@/components/app-sidebar-wrapper';
import { Footer } from '@/components/footer';
import { LoginToastHandler } from '@/components/login-toast-handler';
import { SearchCommand } from '@/components/search-command';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { inter } from '@/fonts';
import { PostHogClientProvider } from '@/providers/posthog';
import { QueryProvider } from '@/providers/query-provider';

import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movies',
  description: 'Find movies to watch',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
};

/**
 * Server-side layout component for the application, providing global structure, theming, and context providers.
 *
 * Fetches the current user session and supplies it to the sidebar. Wraps all pages with analytics, sidebar state, and UI scaffolding including header, search, and footer.
 *
 * @param children - The page content to render within the layout.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={clsx([inter.className])}>
        <QueryProvider>
          <NuqsAdapter>
            <PostHogClientProvider>
              <SidebarProvider>
                <AppSidebarWrapper />
                <SidebarInset>
                  {/*
                    Sticky so search stays reachable while scrolling. Needs an
                    opaque background (content scrolls underneath) and a z-index
                    above the page but below the sidebar rail (z-20). Its height
                    is `--header-height`, which globals.css also uses as the
                    root scroll-padding so anchor jumps and `scrollIntoView`
                    land below it rather than behind it.
                  */}
                  <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-4 border-b bg-background px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-4" />
                    <SearchCommand />
                  </header>
                  <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">{children}</div>
                  <Footer />
                </SidebarInset>
              </SidebarProvider>
              <LoginToastHandler />
              {/* usePathname is URL data — needs a boundary under cacheComponents. */}
              <Suspense fallback={null}>
                <BackScrollRestorer />
              </Suspense>
            </PostHogClientProvider>
          </NuqsAdapter>
        </QueryProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
