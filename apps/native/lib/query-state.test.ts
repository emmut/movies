import { combineQueryStates } from '@native/lib/query-state';
import { describe, expect, it, vi } from 'vite-plus/test';

describe('dependent account queries', () => {
  it('shows a recoverable failure even while another dependency is pending', () => {
    const error = new Error('offline');
    const refetch = vi.fn().mockResolvedValue(undefined);
    const waiting = vi.fn().mockResolvedValue(undefined);
    const state = combineQueryStates([
      { isPending: false, error, refetch },
      { isPending: true, error: null, refetch: waiting },
    ]);
    expect(state).toMatchObject({ error, pending: false, ready: false });
    state.retry();
    expect(refetch).toHaveBeenCalledOnce();
    expect(waiting).toHaveBeenCalledOnce();
  });
  it('loads until every dependency is available, then allows saving', () => {
    const query = { isPending: true, error: null, refetch: vi.fn() };
    expect(combineQueryStates([query])).toMatchObject({ pending: true, ready: false });
    expect(combineQueryStates([{ ...query, isPending: false }])).toMatchObject({
      pending: false,
      ready: true,
      error: null,
    });
  });
});
