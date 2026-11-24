import 'server-only';
import type { AppContext, AppServices } from '@movies/api/router';
import type { Auth } from '@movies/auth';

/** Keep public catalog reads database-free; private procedures resolve the Better Auth session. */
export function createContext(
  services: AppServices,
  headers: Headers,
  auth?: Pick<Auth, 'api'>,
  onMutation?: AppContext['onMutation'],
): AppContext {
  const context: AppContext = { ...services, onMutation };
  if (auth) {
    context.session = {
      async current() {
        const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
        if (!session) {
          return null;
        }
        const { id, name, email, image, isAnonymous } = session.user;
        return { id, name, email, image: image ?? null, isAnonymous: isAnonymous ?? false };
      },
    };
  }
  return context;
}
