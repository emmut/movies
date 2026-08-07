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
                    opaque background, since content scrolls underneath. Its
                    height is `--header-height`, which globals.css also uses as
                    the root scroll-padding so anchor jumps and `scrollIntoView`
                    land below it rather than behind it. The z-index only has to
                    clear the page content below, which the `isolate` on that
                    wrapper already contains; the desktop sidebar is `fixed
                    z-10`, so it forms its own stacking context and stays above
                    this regardless.
                  */}
                  <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-4 border-b bg-background px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-4" />
                    <SearchCommand />
                  </header>
                  {/*
                    `isolate` so page content can't paint over the sticky
                    header. Cards decorate themselves with z-index (title
                    overlays, drag badges) and, without a stacking context here,
                    those values compete with the header's directly — a card's
                    z-10 title beat the header's z-10 on DOM order and showed
                    through it while scrolling. Containing them means content
                    can use whatever z-index it likes and never escape the page
                    area. Dialogs and sheets portal to <body>, so they are not
                    descendants of this element and still overlay the header.
                  */}
                  <div className="isolate mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
                    {children}
                  </div>
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
