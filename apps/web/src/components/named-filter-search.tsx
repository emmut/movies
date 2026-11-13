'use client';

import { Combobox } from '@base-ui/react/combobox';
import { Button } from '@movies/ui/components/button';
import { Input } from '@movies/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { Search, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
type NamedItem = { id: number; name: string };

export function NamedFilterSearch({
  selectedIds,
  onSelect,
  search,
  queryKey,
  label,
  icon: Icon,
}: {
  selectedIds: number[];
  onSelect: (id: number) => void;
  search: (query: string) => Promise<NamedItem[]>;
  queryKey: (query: string) => readonly unknown[];
  label: string;
  icon: LucideIcon;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const trimmedQuery = query.trim();
  const { data, pending, error, refetch } = useNamedSuggestions(
    trimmedQuery,
    open,
    search,
    queryKey,
  );
  const items = pending ? [] : data.filter((item) => !selectedIds.includes(item.id));

  function handleSelect(item: NamedItem | null) {
    if (!item) {
      return;
    }
    onSelect(item.id);
    setQuery('');
    setOpen(false);
  }

  return (
    <Combobox.Root
      items={items}
      filter={null}
      value={null}
      onValueChange={handleSelect}
      inputValue={query}
      onInputValueChange={(value, details) =>
        setQuery(details.reason === 'item-press' ? '' : value)
      }
      itemToStringLabel={(item: NamedItem) => item.name}
      open={open}
      onOpenChange={setOpen}
    >
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Combobox.Input
          render={<Input className="h-9 pl-9 max-md:min-h-11" />}
          aria-label={`Search ${label}`}
          placeholder={`Search ${label}…`}
          maxLength={100}
        />
      </div>
      <NamedFilterSearchPopup
        label={label}
        icon={Icon}
        query={trimmedQuery}
        pending={pending}
        error={error}
        onRetry={() => void refetch()}
      />
    </Combobox.Root>
  );
}

function useNamedSuggestions(
  query: string,
  open: boolean,
  search: (query: string) => Promise<NamedItem[]>,
  queryKey: (query: string) => readonly unknown[],
) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const {
    data = [],
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKey(debouncedQuery),
    queryFn: () => search(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
    retry: false,
  });
  const pending = query !== debouncedQuery || isFetching;
  return { data, pending, error: isError && !pending, refetch };
}

type NamedFilterSearchStatusProps = {
  query: string;
  pending: boolean;
  error: boolean;
  label: string;
};

function NamedFilterSearchPopup({
  onRetry,
  icon: Icon,
  ...status
}: NamedFilterSearchStatusProps & { onRetry: () => void; icon: LucideIcon }) {
  return (
    <Combobox.Portal>
      <Combobox.Positioner align="start" sideOffset={8} className="z-50">
        <Combobox.Popup className="w-(--anchor-width) rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <Combobox.Empty>
            <div className="p-3 text-muted-foreground">
              <NamedFilterSearchStatus {...status} />
              {status.error && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
                  Try again
                </Button>
              )}
            </div>
          </Combobox.Empty>
          <Combobox.List className="max-h-64 scroll-py-1 overflow-y-auto">
            {(item: NamedItem) => (
              <Combobox.Item
                key={item.id}
                value={item}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground max-md:min-h-11"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="wrap-anywhere">{item.name}</span>
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  );
}

function NamedFilterSearchStatus({ query, pending, error, label }: NamedFilterSearchStatusProps) {
  if (query.length < 2) {
    return `Type at least 2 characters to find ${label}.`;
  }
  if (pending) {
    return `Searching ${label}…`;
  }
  if (error) {
    return `${label[0].toUpperCase()}${label.slice(1)} could not be loaded.`;
  }
  return `No matching ${label} found.`;
}
