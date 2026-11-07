import { DEFAULT_REGION } from '@movies/config/regions';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function useWatchProviderSelection(userRegion: string) {
  const [{ with_watch_providers: selectedProviders }, setParams] = useQueryStates({
    with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
    watch_region: parseAsString.withDefault(DEFAULT_REGION),
    page: parseAsString.withDefault('1'),
  });

  function updateProviders(providerIds: number[]) {
    return setParams(
      {
        with_watch_providers: providerIds.length > 0 ? providerIds : null,
        watch_region: providerIds.length > 0 ? userRegion : null,
        page: '1',
      },
      { shallow: false },
    );
  }

  function toggleProvider(providerId: number) {
    const next = selectedProviders.includes(providerId)
      ? selectedProviders.filter((id) => id !== providerId)
      : [...selectedProviders, providerId];
    void updateProviders(next);
  }

  function clearProviders() {
    void updateProviders([]);
  }

  return { selectedProviders, toggleProvider, clearProviders };
}
