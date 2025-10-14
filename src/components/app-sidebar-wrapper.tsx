import { Suspense } from 'react';
import { AppSidebar } from './app-sidebar';
import { UserNav } from './app-sidebar-user-nav';
import { UserFooter } from './app-sidebar-user-footer';
import { headers } from 'next/headers';

function UserNavGhost() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-8 animate-pulse rounded-md bg-gray-200" />
      <div className="h-8 animate-pulse rounded-md bg-gray-200" />
    </div>
  );
}

function UserFooterGhost() {
  return <div className="h-12 animate-pulse rounded-md bg-gray-200" />;
}

export async function AppSidebarWrapper() {
  const headersList = await headers();
  const pathname =
    headersList.get('x-invoke-path') || headersList.get('x-pathname') || '/';

  return (
    <AppSidebar
      userNav={
        <Suspense fallback={<UserNavGhost />}>
          <UserNav pathname={pathname} />
        </Suspense>
      }
      userFooter={
        <Suspense fallback={<UserFooterGhost />}>
          <UserFooter pathname={pathname} />
        </Suspense>
      }
    />
  );
}
