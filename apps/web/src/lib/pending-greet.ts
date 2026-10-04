import {
  readSessionStorageValue,
  removeSessionStorageValue,
  writeSessionStorageValue,
} from '@/lib/session-storage';

const PENDING_GREET_KEY = 'pendingGreet';

export function hasPendingGreet(): boolean {
  return readSessionStorageValue(PENDING_GREET_KEY) === '1';
}

export function markPendingGreet() {
  writeSessionStorageValue(PENDING_GREET_KEY, '1');
}

export function clearPendingGreet() {
  removeSessionStorageValue(PENDING_GREET_KEY);
}
