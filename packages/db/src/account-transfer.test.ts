import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createAnonymousAccountTransfer } from './account-transfer';

const systemTransfer = vi.hoisted(() => vi.fn());
const customTransfer = vi.hoisted(() => vi.fn());
vi.mock('./system-lists', () => ({
  createSystemListStore: () => ({ transferSystemListItems: systemTransfer }),
}));
vi.mock('./custom-list-transfer', () => ({ transferCustomListOwnership: customTransfer }));
beforeEach(() => {
  vi.resetAllMocks();
});
describe('anonymous account transfer completion', () => {
  it('transfers both list families before allowing guest cleanup', async () => {
    const db = {} as never;
    await createAnonymousAccountTransfer(db)('guest', 'account');
    expect(systemTransfer).toHaveBeenCalledWith('guest', 'account');
    expect(customTransfer).toHaveBeenCalledWith(db, 'guest', 'account');
  });
  it('does not reassign data when the same account is retained', async () => {
    await createAnonymousAccountTransfer({} as never)('guest', 'guest');
    expect(systemTransfer).not.toHaveBeenCalled();
    expect(customTransfer).not.toHaveBeenCalled();
  });
  it('propagates a system-list failure so the auth hook cannot delete the source', async () => {
    systemTransfer.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(createAnonymousAccountTransfer({} as never)('guest', 'account')).rejects.toThrow(
      'database unavailable',
    );
    expect(customTransfer).not.toHaveBeenCalled();
  });
  it('propagates a custom-list failure and permits an idempotent retry', async () => {
    customTransfer.mockRejectedValueOnce(new Error('transfer failed'));
    const transfer = createAnonymousAccountTransfer({} as never);
    await expect(transfer('guest', 'account')).rejects.toThrow('transfer failed');
    await expect(transfer('guest', 'account')).resolves.toBeUndefined();
    expect(customTransfer).toHaveBeenCalledTimes(2);
  });
});
