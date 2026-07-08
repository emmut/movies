'use client';

import { Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, useCallback, useState } from 'react';

import Badge from '@/components/badge';
import ClientImage from '@/components/client-image';
import Spinner from '@/components/spinner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSearchMulti } from '@/hooks/use-search-query';
import { useSearchShortcut } from '@/hooks/use-search-shortcut';
import { cn } from '@/lib/utils';

import {
  buildSeeAllHref,
  getSubmitHref,
  moveSelection,
  SearchCommandItem,
  toSearchCommandItems,
} from './search-command-items';

const RESULT_LIMIT = 8;

function SearchCommandThumb({ item }: { item: SearchCommandItem }) {
  if (!item.imageUrls && !item.fallbackSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center text-lg">
        {item.fallbackEmoji}
      </div>
    );
  }

  return (
    <ClientImage
      imageUrls={item.imageUrls}
      fallbackSrc={item.fallbackSrc}
      alt=""
      className="h-full w-full object-cover"
    />
  );
}

type SearchCommandRowProps = {
  item: SearchCommandItem;
  isActive: boolean;
  onSelect: (href: string) => void;
  onHover: () => void;
};

function SearchCommandRow({ item, isActive, onSelect, onHover }: SearchCommandRowProps) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={isActive || undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-2 py-1.5',
          isActive && 'bg-accent text-accent-foreground',
        )}
        onClick={(event) => {
          event.preventDefault();
          onSelect(item.href);
        }}
        onMouseMove={onHover}
      >
        <div className="h-14 w-9 shrink-0 overflow-hidden rounded bg-zinc-800">
          <SearchCommandThumb item={item} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.title}</div>
          {item.subtitle && <div className="text-xs text-muted-foreground">{item.subtitle}</div>}
        </div>
        <Badge variant={item.badgeVariant}>{item.badge}</Badge>
      </Link>
    </li>
  );
}

type SearchCommandBodyProps = {
  query: string;
  isLoading: boolean;
  items: SearchCommandItem[];
  activeIndex: number;
  onSelect: (href: string) => void;
  onHover: (index: number) => void;
};

function SearchCommandBody({
  query,
  isLoading,
  items,
  activeIndex,
  onSelect,
  onHover,
}: SearchCommandBodyProps) {
  if (!query) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        Type to search movies, TV shows, and people.
        <br />
        Tip: add a year to narrow it down — &ldquo;heat 1995&rdquo;
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        No results for &ldquo;{query}&rdquo;
      </p>
    );
  }

  return (
    <ul aria-label="Search results">
      {items.map((item, index) => (
        <SearchCommandRow
          key={item.key}
          item={item}
          isActive={index === activeIndex}
          onSelect={onSelect}
          onHover={() => onHover(index)}
        />
      ))}
    </ul>
  );
}

type SearchCommandInputProps = {
  query: string;
  isFetching: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function SearchCommandInput({ query, isFetching, onChange, onKeyDown }: SearchCommandInputProps) {
  return (
    <div className="relative border-b">
      <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="Search for movies, TV shows, or people"
        placeholder="Search movies, TV shows, people..."
        className="h-12 rounded-none border-0 pl-9 shadow-none focus-visible:ring-0"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {isFetching && <Spinner className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />}
    </div>
  );
}

type SearchCommandFooterProps = {
  itemCount: number;
  href: string;
  query: string;
  onNavigate: (href: string) => void;
};

function SearchCommandFooter({ itemCount, href, query, onNavigate }: SearchCommandFooterProps) {
  if (!query || itemCount === 0) {
    return null;
  }

  return (
    <div className="border-t p-2">
      <Link
        href={href}
        className="block rounded-lg px-2 py-1.5 text-center text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        onClick={(event) => {
          event.preventDefault();
          onNavigate(href);
        }}
      >
        See all results for &ldquo;{query}&rdquo;
      </Link>
    </div>
  );
}

function SearchCommandPanel({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const { data, isLoading, isFetching, isPlaceholderData } = useSearchMulti({
    query: debouncedQuery,
    page: 1,
    keepPrevious: true,
  });

  const items = toSearchCommandItems(data, RESULT_LIMIT);
  const clampedIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
  const trimmedQuery = query.trim();
  const seeAllHref = buildSeeAllHref(trimmedQuery);
  // While the debounce or fetch is behind the input, `items` still shows the
  // previous query's rows; Enter must not navigate to one of those.
  const resultsAreFresh = trimmedQuery === debouncedQuery && !isPlaceholderData;

  function submit() {
    const href = getSubmitHref(items, clampedIndex, resultsAreFresh, seeAllHref, !!trimmedQuery);
    if (href) {
      onNavigate(href);
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
      return;
    }

    const nextIndex = moveSelection(event.key, clampedIndex, items.length);
    if (nextIndex !== clampedIndex) {
      event.preventDefault();
      setActiveIndex(nextIndex);
    }
  }

  function onQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  return (
    <>
      <SearchCommandInput
        query={query}
        isFetching={isFetching}
        onChange={onQueryChange}
        onKeyDown={onInputKeyDown}
      />
      <div className={cn('max-h-96 overflow-y-auto p-2', !resultsAreFresh && 'opacity-60')}>
        <SearchCommandBody
          query={trimmedQuery}
          isLoading={isLoading}
          items={items}
          activeIndex={clampedIndex}
          onSelect={onNavigate}
          onHover={setActiveIndex}
        />
      </div>
      <SearchCommandFooter
        itemCount={items.length}
        href={seeAllHref}
        query={trimmedQuery}
        onNavigate={onNavigate}
      />
    </>
  );
}

/**
 * Header search: a trigger styled like an input that opens a command palette
 * with search-as-you-type results across movies, TV shows, and people.
 *
 * Opens via click, ⌘K/Ctrl+K, or `/`. Arrow keys move the selection, Enter
 * opens the selected result, and "See all results" deep-links to /search.
 */
export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useSearchShortcut(useCallback(() => setOpen(true), []));

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground transition-colors hover:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-xs">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
        <DialogContent
          showCloseButton={false}
          className="top-24 translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <SearchCommandPanel onNavigate={navigate} />
        </DialogContent>
      </Dialog>
    </>
  );
}
