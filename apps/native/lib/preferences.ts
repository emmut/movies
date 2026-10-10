import { createRegionStore } from '@native/lib/region-store';
import { useSyncExternalStore } from 'react';

// Account persistence replaces this session store during the identity slice.
const regionStore = createRegionStore();
export function useRegion() {
  const region = useSyncExternalStore(
    regionStore.subscribe,
    regionStore.getSnapshot,
    regionStore.getSnapshot,
  );
  return { region, setRegion: regionStore.setRegion };
}
