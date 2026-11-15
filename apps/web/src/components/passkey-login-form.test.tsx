import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/lib/auth-client', () => ({ signInPasskey: vi.fn() }));

import { PasskeyLoginForm } from './passkey-login-form';

describe('PasskeyLoginForm', () => {
  it('renders a single usernameless sign-in button', () => {
    const html = renderToStaticMarkup(<PasskeyLoginForm redirectUrl="/watchlist" />);

    expect(html).toContain('Authenticate with Passkey');
    expect(html).toContain('type="button"');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<form');
  });
});
