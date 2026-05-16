import { getSession } from '@movies/auth';

import { UserLogin } from './app-sidebar-user-login';
import { NavUser } from './nav-user';
import { Skeleton } from './ui/skeleton';

export async function UserFooter() {
  const session = await getSession();

  if (session?.user) {
    return (
      <NavUser
        user={{
          name: session.user.name ?? '',
          email: session.user.email ?? '',
          avatar: session.user.image ?? '',
        }}
      />
    );
  }

  return <UserLogin />;
}

function UserFooterGhost() {
  return <Skeleton className="h-12 w-full" />;
}

UserFooter.Ghost = UserFooterGhost;
