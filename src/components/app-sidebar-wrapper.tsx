import { Suspense } from 'react';

import { AppSidebar } from './app-sidebar';
import { UserFooter } from './app-sidebar-user-footer';
import { UserNav } from './app-sidebar-user-nav';

export function AppSidebarWrapper() {
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
