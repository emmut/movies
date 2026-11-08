import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { signInGoogle, signInAnonymous, signInGoogleSettings, push, refresh, errorToast, clicks } =
  vi.hoisted(() => ({
    signInGoogle: vi.fn(),
    signInAnonymous: vi.fn(),
    signInGoogleSettings: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    errorToast: vi.fn(),
    clicks: [] as (() => Promise<void>)[],
  }));
vi.mock('@/lib/auth-client', () => ({
  signInGoogle,
  signInAnonymous,
  signInGoogleSettings,
  signInDiscord: vi.fn(),
  signInGitHub: vi.fn(),
  signInSettings: vi.fn(),
  signInGitHubSettings: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock('sonner', () => ({ toast: { error: errorToast } }));
vi.mock('@movies/ui/components/button', () => ({
  Button: ({ onClick, ...props }: React.ComponentProps<'button'>) => {
    clicks.push(onClick as () => Promise<void>);
    return <button {...props} />;
  },
}));
vi.mock('@/components/passkey-login-form', () => ({ PasskeyLoginForm: () => null }));

import { LinkAccount } from '@/app/settings/link-account';
import { LoginForm } from '@/components/login-form';
import { OAuthLoginButton } from '@/components/oauth-login-button';

describe('Google OAuth entry points', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clicks.length = 0;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('offers Google on the login form and starts Google rather than guest sign-in', async () => {
    signInGoogle.mockResolvedValue({ error: null });
    const html = renderToStaticMarkup(<LoginForm redirectUrl="/watchlist" />);
    expect(html).toContain('Continue with Google');
    await clicks[0]();
    expect(signInGoogle).toHaveBeenCalledWith('/watchlist');
    expect(signInAnonymous).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('shows Google failures without navigating', async () => {
    signInGoogle.mockResolvedValue({ error: 'denied' });
    renderToStaticMarkup(<OAuthLoginButton provider="google" />);
    await clicks[0]();
    expect(errorToast).toHaveBeenCalledWith('Failed to sign in with Google');
    expect(push).not.toHaveBeenCalled();
  });

  it('offers Google guest-account linking through the settings flow', async () => {
    const html = renderToStaticMarkup(<LinkAccount />);
    expect(html).toContain('Link using Google');
    await clicks[0]();
    expect(signInGoogleSettings).toHaveBeenCalledWith('/');
    expect(signInGoogle).not.toHaveBeenCalled();
  });
});
