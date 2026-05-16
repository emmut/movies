import { Toaster } from '@movies/ui/components/sonner';
import { Footer } from '@movies/ui/components/footer';
import { Separator } from '@movies/ui/components/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@movies/ui/components/sidebar';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ThemeProvider } from 'next-themes';

import { AppSidebar } from '@/components/app-sidebar';
import { UserFooter } from '@/components/app-sidebar-user-footer';
import { UserNav } from '@/components/app-sidebar-user-nav';
import { LoginToastHandler } from '@/components/login-toast-handler';
import SearchBar from '@/components/search-bar';
import type { orpc } from '@/utils/orpc';

import appCss from '../index.css?url';

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

function RootPending() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
      <p className="text-sm text-zinc-400">Loading...</p>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  pendingComponent: RootPending,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Movies' },
      { name: 'description', content: 'Find movies to watch' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SidebarProvider>
            <AppSidebar
              userNav={<UserNav />}
              userFooter={<UserFooter />}
            />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4" />
                <SearchBar />
              </header>
              <div className="mx-auto w-full max-w-7xl p-4">
                <Outlet />
              </div>
              <Footer />
            </SidebarInset>
          </SidebarProvider>
          <LoginToastHandler />
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
