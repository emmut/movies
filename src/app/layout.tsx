import { clsx } from 'cn';
import { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode, Suspense } from 'react';
import { preconnect } from 'react-dom';
import { Toaster } from 'sonner';

import { AppSidebarWrapper } from '@/components/app-sidebar-wrapper';
import { BackScrollRestorer } from '@/components/back-scroll-restorer';
import { Footer } from '@/components/footer';
import { LoginToastHandler } from '@/components/login-toast-handler';
import { SearchCommand, SearchCommandFallback } from '@/components/search-command';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { env } from '@/env';
import { inter } from '@/fonts';
import { IMAGE_CDN_URL } from '@/lib/constants';

import './globals.css';
import { QueryProvider } from '@/providers/query-provider';

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
  // Every page's LCP image comes from one of these third-party origins; warm
  // up DNS+TLS before the first image request is discovered.
  preconnect(new URL(env.NEXT_PUBLIC_IMGPROXY_ENDPOINT).origin);
  preconnect(new URL(IMAGE_CDN_URL).origin);

  return (
    <html lang="en" className="dark">
      <body className={clsx([inter.className])}>
        <QueryProvider>
          <NuqsAdapter>
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
                  {/* useSearchParams is URL data — needs a boundary under cacheComponents. */}
                  <Suspense fallback={<SearchCommandFallback />}>
                    <SearchCommand />
                  </Suspense>
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
          </NuqsAdapter>
        </QueryProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
