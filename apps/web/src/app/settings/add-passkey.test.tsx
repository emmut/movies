import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/auth-client', () => ({ addPasskey: vi.fn() }));

import { AddPasskey } from './add-passkey';

describe('AddPasskey', () => {
  it('renders a closed dialog behind an Add Passkey trigger', () => {
    const html = renderToStaticMarkup(<AddPasskey />);

    expect(html).toContain('Add Passkey');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain('Add New Passkey');
  });
});
