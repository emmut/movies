// @vitest-environment happy-dom
import { PASSKEY_NAME_FORMS, type PasskeyFailure } from '@movies/api/passkeys';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { PasskeyLoginForm } from '@/components/passkey-login-form';
import { addPasskey, deletePasskey, renamePasskey, signInPasskey } from '@/lib/auth-client';

import { AddPasskey } from './add-passkey';
import { PasskeyList } from './passkey-list';
import { PasskeyNameDialog } from './passkey-name-dialog';

const { refresh, push } = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push }) }));
vi.mock('@/lib/auth-client', () => ({
  addPasskey: vi.fn(),
  deletePasskey: vi.fn(),
  renamePasskey: vi.fn(),
  signInPasskey: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
let root: Root;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});
async function render(node: ReactNode) {
  await act(async () => root.render(node));
}
function button(label: string, selector = 'button') {
  const element = Array.from(document.querySelectorAll<HTMLButtonElement>(selector)).find(
    (item) => item.textContent?.trim() === label,
  );
  if (!element) {
    throw new Error(`Button not found: ${label}`);
  }
  return element;
}
async function click(label: string, selector?: string) {
  await act(async () => button(label, selector).click());
}
function input() {
  const field = document.querySelector<HTMLInputElement>('[role="dialog"] input');
  if (!field) {
    throw new Error('Passkey name input not found');
  }
  return field;
}
async function name(value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input(), value);
    input().dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function submit() {
  await act(async () => {
    document.querySelector<HTMLFormElement>('[role="dialog"] form')?.requestSubmit();
  });
}
function dialog(onSubmit: (name: string) => Promise<boolean>) {
  return (
    <PasskeyNameDialog
      trigger={<button aria-label="Rename" />}
      triggerLabel="Rename"
      form={PASSKEY_NAME_FORMS.rename}
      initialName="Laptop"
      onSubmit={onSubmit}
    />
  );
}
const passkey = { id: 'key-1', name: 'Laptop', deviceType: 'multiDevice', createdAt: null };

describe('passkey name dialog interactions', () => {
  it('validates, trims, keeps a failed submission open and resets the name when reopened', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    await render(dialog(onSubmit));
    await click('Rename');
    expect(input().value).toBe('Laptop');
    await name(' ');
    await submit();
    expect(toast.error).toHaveBeenCalledWith('Please enter a name for your passkey.');
    expect(onSubmit).not.toHaveBeenCalled();
    await name('  Desk  ');
    await submit();
    expect(onSubmit).toHaveBeenCalledWith('Desk');
    expect(input().disabled).toBe(false);
    await click('Cancel', '[role="dialog"] button');
    await click('Rename');
    expect(input().value).toBe('Laptop');
    await name('Unsaved draft');
    await click('Close', '[role="dialog"] button');
    await click('Rename');
    expect(input().value).toBe('Laptop');
  });
  it('disables controls while saving and closes only after success', async () => {
    let complete!: (close: boolean) => void;
    const pending = new Promise<boolean>((resolve) => {
      complete = resolve;
    });
    await render(dialog(() => pending));
    await click('Rename');
    await submit();
    expect(input().disabled).toBe(true);
    expect(button('Saving...').disabled).toBe(true);
    expect(button('Cancel', '[role="dialog"] button').disabled).toBe(true);
    await act(async () => complete(true));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
  it('recovers from unexpected rejection without leaving the dialog permanently pending', async () => {
    await render(dialog(vi.fn().mockRejectedValue(new Error('offline'))));
    await click('Rename');
    await submit();
    expect(input().disabled).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(PASSKEY_NAME_FORMS.rename.failureMessage);
  });
});

describe('passkey settings operations', () => {
  it('adds a named passkey and refreshes only after success', async () => {
    vi.mocked(addPasskey).mockResolvedValue({ ok: true });
    await render(<AddPasskey />);
    await click('Add Passkey');
    await name(' My phone ');
    await submit();
    expect(addPasskey).toHaveBeenCalledWith('My phone');
    expect(toast.success).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
  it.each<PasskeyFailure>(['cancelled', 'already-registered', 'no-credentials', 'failed'])(
    'keeps adding open after %s and suppresses only cancellation',
    async (reason) => {
      vi.mocked(addPasskey).mockResolvedValue({ ok: false, reason });
      await render(<AddPasskey />);
      await click('Add Passkey');
      await submit();
      expect(input().disabled).toBe(false);
      expect(refresh).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledTimes(reason === 'cancelled' ? 0 : 1);
    },
  );
  it('keeps rename failures editable and refreshes a successful rename', async () => {
    vi.mocked(renamePasskey)
      .mockResolvedValueOnce({ ok: false, reason: 'failed' })
      .mockResolvedValueOnce({ ok: true });
    await render(<PasskeyList passkeys={[passkey]} />);
    await click('Rename');
    await name('Desktop');
    await submit();
    expect(renamePasskey).toHaveBeenCalledWith('key-1', 'Desktop');
    expect(refresh).not.toHaveBeenCalled();
    expect(input().disabled).toBe(false);
    expect(toast.error).toHaveBeenCalled();
    await submit();
    expect(refresh).toHaveBeenCalledOnce();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
  it('keeps failed deletes open, disables pending controls and closes after success', async () => {
    vi.mocked(deletePasskey).mockResolvedValueOnce({ ok: false, reason: 'failed' });
    await render(<PasskeyList passkeys={[passkey]} />);
    await click('Delete');
    await click('Delete Passkey', '[role="dialog"] button');
    expect(deletePasskey).toHaveBeenCalledWith('key-1');
    expect(toast.error).toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    let complete!: (value: { ok: true }) => void;
    vi.mocked(deletePasskey).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    await click('Delete Passkey', '[role="dialog"] button');
    expect(button('Deleting...', '[role="dialog"] button').disabled).toBe(true);
    await act(async () => complete({ ok: true }));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(refresh).toHaveBeenCalledOnce();
  });
});

it('never deletes a passkey when confirmation is cancelled', async () => {
  await render(<PasskeyList passkeys={[passkey]} />);
  await click('Delete');
  await click('Cancel', '[role="dialog"] button');
  expect(deletePasskey).not.toHaveBeenCalled();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
it.each<PasskeyFailure>(['cancelled', 'failed'])(
  'handles login %s through the shared browser feedback',
  async (reason) => {
    vi.mocked(signInPasskey).mockResolvedValue({ ok: false, reason });
    await render(<PasskeyLoginForm />);
    await click('Authenticate with Passkey');
    expect(toast.error).toHaveBeenCalledTimes(reason === 'cancelled' ? 0 : 1);
    expect(push).not.toHaveBeenCalled();
    expect(button('Authenticate with Passkey').disabled).toBe(false);
  },
);
it('navigates only after passkey sign-in succeeds', async () => {
  vi.mocked(signInPasskey).mockResolvedValue({ ok: true });
  await render(<PasskeyLoginForm redirectUrl="/watchlist" />);
  await click('Authenticate with Passkey');
  expect(push).toHaveBeenCalledWith('/watchlist');
  expect(refresh).toHaveBeenCalledOnce();
});
