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
  actions,
}: {
  watchProviders: WatchProvider[];
  userRegion: string;
  mediaTypeControls: ReactNode;
  actions: ReactNode;
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
      <ListToolbarRow
        filters={
          <>
            {mediaTypeControls}
            <WatchProviderFilter providers={watchProviders} userRegion={userRegion} compact />
          </>
        }
        actions={actions}
      />
      <SelectedFilterChips items={selected} kind="provider" onRemove={toggleProvider} />
    </div>
  );
}
