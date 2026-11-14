import type { SearchItem, SearchPage } from '@movies/api/search';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

function Suggestion({ item }: { item: SearchItem }) {
  const title = item.type === 'person' ? item.name : item.title;
  const label = { movie: 'Movie', tv: 'TV Show', person: 'Person' }[item.type];
  return (
    <Link
      href={{ pathname: '/search/[type]/[id]', params: { type: item.type, id: item.id } }}
      asChild
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={'Open ' + title + ', ' + label}
        className="min-h-14 justify-center gap-1 border-b border-border px-4 py-3"
      >
        <Text numberOfLines={2} className="font-semibold text-foreground">
          {title}
        </Text>
        <Text className="text-sm text-muted">{label}</Text>
      </Pressable>
    </Link>
  );
}

export function SearchSuggestions({ draft, submit }: { draft: string; submit: () => void }) {
  const [query, setQuery] = useState('');
  const trimmed = draft.trim();
  useEffect(() => {
    const timer = setTimeout(() => setQuery(trimmed), 250);
    return () => clearTimeout(timer);
  }, [trimmed]);
  const results = useQuery(
    orpc.search.suggestions.queryOptions({
      input: { query },
      enabled: query.length > 0 && query === trimmed,
      retry: false,
    }),
  );
  // Never expose a destination from a previous query while the debounce/request catches up.
  const current = query === trimmed;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-6">
      <View className="mx-4 overflow-hidden rounded-xl border border-border">
        <SuggestionResults
          pending={!current || results.isPending}
          failed={results.isError}
          data={current ? results.data : undefined}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See all results"
          onPress={submit}
          className="min-h-12 justify-center px-4 py-3"
        >
          <Text className="font-semibold text-foreground">See all results for “{trimmed}”</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SuggestionResults({
  pending,
  failed,
  data,
}: {
  pending: boolean;
  failed: boolean;
  data?: SearchPage;
}) {
  if (pending) {
    return <Text className="p-4 text-muted">Searching…</Text>;
  }
  if (failed) {
    return (
      <Text className="p-4 text-muted">
        Suggestions unavailable. Search all results to try again.
      </Text>
    );
  }
  if (!data?.items.length) {
    return <Text className="p-4 text-muted">No suggestions found.</Text>;
  }
  return data.items.map((item) => <Suggestion key={item.type + ':' + item.id} item={item} />);
}
