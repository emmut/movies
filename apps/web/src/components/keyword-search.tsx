'use client';

import { Combobox } from '@base-ui/react/combobox';
import { Button } from '@movies/ui/components/button';
import { Input } from '@movies/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { Search, Tag } from 'lucide-react';
import { useState } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { searchKeywords } from '@/lib/keyword-search';
import { queryKeys } from '@/lib/query-keys';
import type { Keyword } from '@/types/keyword';

export function KeywordSearch({
  selectedIds,
  onSelect,
}: {
  selectedIds: number[];
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const trimmedQuery = query.trim();
  const { data, pending, error, refetch } = useKeywordSuggestions(trimmedQuery, open);
  const items = pending ? [] : data.filter((keyword) => !selectedIds.includes(keyword.id));

  function handleSelect(keyword: Keyword | null) {
    if (!keyword) {
      return;
    }
    onSelect(keyword.id);
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
      itemToStringLabel={(keyword: Keyword) => keyword.name}
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
          aria-label="Search tags"
          placeholder="Search tags…"
          maxLength={100}
        />
      </div>
      <KeywordSearchPopup
        query={trimmedQuery}
        pending={pending}
        error={error}
        onRetry={() => void refetch()}
      />
    </Combobox.Root>
  );
}

function useKeywordSuggestions(query: string, open: boolean) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const {
    data = [],
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.search.keywords(debouncedQuery),
    queryFn: () => searchKeywords(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
    retry: false,
  });
  const pending = query !== debouncedQuery || isFetching;
  return { data, pending, error: isError && !pending, refetch };
}

type KeywordSearchStatusProps = { query: string; pending: boolean; error: boolean };

function KeywordSearchPopup({
  onRetry,
  ...status
}: KeywordSearchStatusProps & { onRetry: () => void }) {
  return (
    <Combobox.Portal>
      <Combobox.Positioner align="start" sideOffset={8} className="z-50">
        <Combobox.Popup className="w-(--anchor-width) rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <Combobox.Empty>
            <div className="p-3 text-muted-foreground">
              <KeywordSearchStatus {...status} />
              {status.error && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
                  Try again
                </Button>
              )}
            </div>
          </Combobox.Empty>
          <Combobox.List className="max-h-64 scroll-py-1 overflow-y-auto">
            {(keyword: Keyword) => (
              <Combobox.Item
                key={keyword.id}
                value={keyword}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground max-md:min-h-11"
              >
                <Tag className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="wrap-anywhere">{keyword.name}</span>
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  );
}

function KeywordSearchStatus({ query, pending, error }: KeywordSearchStatusProps) {
  if (query.length < 2) {
    return 'Type at least 2 characters to find tags.';
  }
  if (pending) {
    return 'Searching tags…';
  }
  if (error) {
    return 'Tags could not be loaded.';
  }
  return 'No matching tags found.';
}
