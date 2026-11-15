import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/auth-client', () => ({ deletePasskey: vi.fn(), renamePasskey: vi.fn() }));

import { PasskeyList } from './passkey-list';

describe('PasskeyList', () => {
  it('shows an empty state without passkeys', () => {
    const html = renderToStaticMarkup(<PasskeyList passkeys={[]} />);

    expect(html).toContain('No passkeys found');
    expect(html).not.toContain('<ul');
  });

  it('lists each passkey with rename and delete actions', () => {
    const html = renderToStaticMarkup(
      <PasskeyList
        passkeys={[
          {
            id: 'pk-1',
            name: 'Laptop',
            deviceType: 'multiDevice',
            createdAt: new Date('2026-03-05T12:00:00Z'),
          },
          { id: 'pk-2', name: null, deviceType: 'singleDevice', createdAt: new Date() },
        ]}
      />,
    );

    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html).toContain('Laptop');
    expect(html).toContain('Unnamed passkey');
    expect(html).toContain('Synced');
    expect(html).toContain('This device only');
    expect(html).toContain('Created: 5 Mar 2026');
    expect(html.match(/>Rename</g)).toHaveLength(2);
    expect(html.match(/>Delete</g)).toHaveLength(2);
  });
});
