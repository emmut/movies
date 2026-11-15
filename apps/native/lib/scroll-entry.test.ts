import { scrollEntryIdentity } from '@native/lib/scroll-entry';
import { expect, it } from 'vite-plus/test';

it('restores a browser entry after Expo recreates its route key and isolates fresh openings', () => {
  expect(scrollEntryIdentity('original-route', { id: 'entry-a' })).toBe(
    scrollEntryIdentity('recreated-route', { id: 'entry-a' }),
  );
  expect(scrollEntryIdentity('original-route', { id: 'entry-b' })).not.toBe(
    scrollEntryIdentity('original-route', { id: 'entry-a' }),
  );
});

it.each([undefined, null, 1, '', {}, { id: null }, { id: '' }, { id: 5 }])(
  'falls back to native route identity for %j',
  (state) => {
    expect(scrollEntryIdentity('native-route', state)).toBe('native-route');
  },
);
