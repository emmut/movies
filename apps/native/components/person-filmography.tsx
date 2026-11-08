import type { PersonCredit } from '@movies/api/person';
import { getKnownFor, sortPersonTitles, type CreditSort } from '@movies/api/person-filmography';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { ChoiceSheet } from '@native/components/choice-sheet';
import { ChevronDownIcon } from '@native/components/icons';
import { MediaPosterRow } from '@native/components/media-poster';
import type { UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const sorts: { value: CreditSort; label: string }[] = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest first' },
];

function CreditSortControl({
  title,
  sort,
  onChange,
}: {
  title: string;
  sort: CreditSort;
  onChange: (sort: CreditSort) => void;
}) {
  const [open, setOpen] = useState(false);
  function select(value: string) {
    const selection = sorts.find((item) => item.value === value);
    if (selection) {
      onChange(selection.value);
      setOpen(false);
    }
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Sort ' + title}
        className="bg-default min-h-11 flex-row items-center gap-2 rounded-xl border border-border px-3"
        onPress={() => setOpen(true)}
      >
        <Text className="text-sm text-foreground">
          {sorts.find((item) => item.value === sort)?.label}
        </Text>
        <ChevronDownIcon className="size-3 text-muted" accessible={false} />
      </Pressable>
      {open ? (
        <ChoiceSheet
          title={'Sort ' + title}
          options={sorts}
          selected={[sort]}
          multiple={false}
          onClose={() => setOpen(false)}
          onSelect={select}
        />
      ) : null}
    </>
  );
}

function SortedPersonTitles({
  title,
  titles,
  region,
}: {
  title: string;
  titles: PersonCredit[];
  region: string;
}) {
  const [sort, setSort] = useState<CreditSort>('relevance');
  const sorted = sortPersonTitles(titles, sort);
  return (
    <>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
          {title} ({sorted.length})
        </Text>
        <CreditSortControl title={title} sort={sort} onChange={setSort} />
      </View>
      <MediaPosterRow key={sort} items={sorted} region={region} />
    </>
  );
}

export function PersonFilmography({
  title,
  query,
  region,
}: {
  title: string;
  query: UseQueryResult<PersonCredit[]>;
  region: string;
}) {
  if (query.data?.length === 0) {
    return null;
  }
  return (
    <View className="gap-3" accessibilityLabel={title}>
      {query.data ? (
        <SortedPersonTitles title={title} titles={query.data} region={region} />
      ) : (
        <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
          {title}
        </Text>
      )}
      <CatalogSectionState
        label={title}
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    </View>
  );
}

export function PersonKnownFor({ titles, region }: { titles: PersonCredit[]; region: string }) {
  const knownFor = getKnownFor(titles);
  if (knownFor.length === 0) {
    return null;
  }
  return (
    <View className="gap-3" accessibilityLabel="Known for">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Known for
      </Text>
      <Text className="text-sm text-muted">Standout movies and TV roles</Text>
      <MediaPosterRow items={knownFor} region={region} />
    </View>
  );
}
