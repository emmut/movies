import { Suspense } from 'react';
import { AppSidebar } from './app-sidebar';
import { UserNav } from './app-sidebar-user-nav';
import { UserFooter } from './app-sidebar-user-footer';

export async function AppSidebarWrapper() {
  return (
    <AppSidebar
      userNav={
        <Suspense fallback={<UserNav.Ghost />}>
          <UserNav />
        </Suspense>
      }
      userFooter={
        <Suspense fallback={<UserFooter.Ghost />}>
          <UserFooter />
        </Suspense>
      }
    />
  );
}
