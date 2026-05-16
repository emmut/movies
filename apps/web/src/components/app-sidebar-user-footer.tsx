import { Skeleton } from '@movies/ui/components/skeleton';
import { authClient } from '@/lib/auth-client';

import { UserLogin } from './app-sidebar-user-login';
import { NavUser } from './nav-user';

export function UserFooter() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-12 w-full" />;
  }

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
