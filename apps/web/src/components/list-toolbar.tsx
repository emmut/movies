import type { ReactNode } from 'react';

import { ListToolbarRow } from '@/components/list-toolbar-row';
import { SelectedFilterChips } from '@/components/selected-filter-chips';
import WatchProviderFilter from '@/components/watch-provider-filter';
import { useWatchProviderSelection } from '@/hooks/use-watch-provider-selection';
import type { WatchProvider } from '@/types/watch-provider';

export function ListToolbar({
  watchProviders,
  userRegion,
  mediaTypeControls,
}: {
  watchProviders: WatchProvider[];
  userRegion: string;
  mediaTypeControls: ReactNode;
}) {
  const { selectedProviders, toggleProvider } = useWatchProviderSelection(userRegion);
  const selected = selectedProviders.map((id) => ({
    id,
    name:
      watchProviders.find((provider) => provider.provider_id === id)?.provider_name ??
      `Provider ${id}`,
  }));

  return (
    <div data-slot="list-toolbar" className="space-y-4">
      <ListToolbarRow>
        {mediaTypeControls}
        <WatchProviderFilter providers={watchProviders} userRegion={userRegion} compact />
      </ListToolbarRow>
      <SelectedFilterChips items={selected} kind="provider" onRemove={toggleProvider} />
    </div>
  );
}
