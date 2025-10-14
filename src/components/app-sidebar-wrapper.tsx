import { Suspense } from 'react';
import { AppSidebar } from './app-sidebar';
import { UserFooter } from './app-sidebar-user-footer';
import { UserNav } from './app-sidebar-user-nav';

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
  return (
    <AppSidebar
      userNav={
        <Suspense fallback={<UserNavGhost />}>
          <UserNav />
        </Suspense>
      }
      userFooter={
        <Suspense fallback={<UserFooterGhost />}>
          <UserFooter />
        </Suspense>
      }
    />
  );
}
