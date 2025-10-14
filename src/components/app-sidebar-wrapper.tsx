import { Suspense } from 'react';
import { AppSidebar } from './app-sidebar';
import { UserNav } from './app-sidebar-user-nav';
import { UserFooter } from './app-sidebar-user-footer';
import { headers } from 'next/headers';

export async function AppSidebarWrapper() {
  const headersList = await headers();
  const pathname =
    headersList.get('x-invoke-path') || headersList.get('x-pathname') || '/';

  return (
    <AppSidebar
      userNav={
        <Suspense fallback={<div>Loading...</div>}>
          <UserNav pathname={pathname} />
        </Suspense>
      }
      userFooter={
        <Suspense fallback={<div>Loading...</div>}>
          <UserFooter pathname={pathname} />
        </Suspense>
      }
    />
  );
}
