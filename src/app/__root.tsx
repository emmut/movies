import clsx from 'clsx';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import { Suspense } from 'react';
import { Toaster } from 'sonner';

import { AppSidebarWrapper } from '@/components/app-sidebar-wrapper';
import { Footer } from '@/components/footer';
import { LoginToastHandler } from '@/components/login-toast-handler';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PostHogClientProvider } from '@/providers/posthog';
import { QueryProvider } from '@/providers/query-provider';

import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { Search } from '@/components/header-search';

import './globals.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Movies' },
      { name: 'description', content: 'Find movies to watch' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  component: RootLayout,
});

function RootLayout() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryProvider>
          <NuqsAdapter>
            <PostHogClientProvider>
              <SidebarProvider>
                <AppSidebarWrapper />
                <SidebarInset>
                  <header className="px flex h-16 shrink-0 items-center gap-4 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-4" />
                    <Suspense>
                      <Search />
                    </Suspense>
                  </header>
                  <div className="mx-auto w-full max-w-7xl p-4">
                    <Outlet />
                  </div>
                  <Footer />
                </SidebarInset>
              </SidebarProvider>
              <LoginToastHandler />
            </PostHogClientProvider>
          </NuqsAdapter>
        </QueryProvider>
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  );
}
