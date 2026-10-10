import type { SearchInput, SearchItem } from '@movies/api/search';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CatalogPagination } from '@native/components/catalog-pagination';
import { ChoiceSheet } from '@native/components/choice-sheet';
import { MediaPoster } from '@native/components/media-poster';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { SearchPerson } from '@native/components/search-person-card';
import { orpc } from '@native/lib/api';
import { readSearchState } from '@native/lib/search-state';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
const types = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'person', label: 'People' },
];

function SearchForm({
  initialQuery,
  onSearch,
}: {
  initialQuery: string;
  onSearch: (query: string) => void;
}) {
  const [draft, setDraft] = useState(initialQuery);
  function submit() {
    Keyboard.dismiss();
    onSearch(draft.trim());
  }
  return (
    <View className="flex-row gap-2">
      <TextInput
        accessibilityLabel="Search movies, TV shows and people"
        placeholder="Search movies, TV shows and people"
        placeholderTextColorClassName="accent-muted"
        className="bg-default min-h-12 flex-1 rounded-xl border border-border px-4 text-foreground"
        value={draft}
        onChangeText={setDraft}
        maxLength={500}
        returnKeyType="search"
        autoCorrect={false}
        onSubmitEditing={submit}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Submit search"
        className="min-h-12 justify-center rounded-xl bg-yellow-400 px-4"
        onPress={submit}
      >
        <Text className="font-semibold text-zinc-900">Search</Text>
      </Pressable>
    </View>
  );
}
function renderResult({ item }: { item: SearchItem }) {
  return (
    <View className="flex-1 items-center pb-5">
      {item.type === 'person' ? <SearchPerson item={item} /> : <MediaPoster item={item} />}
    </View>
  );
}
function resultKey(item: SearchItem) {
  return item.type + ':' + item.id;
}
function SearchResults({ input, onPage }: { input: SearchInput; onPage: (page: number) => void }) {
  const query = useQuery(orpc.search.list.queryOptions({ input }));
  const {
    ref,
    onScroll,
    onLayout,
    onContentSizeChange,
    onScrollBeginDrag,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  } = useRememberedScroll<FlatList<SearchItem>>('search:' + JSON.stringify(input));
  if (query.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator accessibilityLabel="Loading search results" />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View className="flex-1 items-start gap-3 p-5">
        <Text className="text-foreground">Couldn’t load search results.</Text>
        <Pressable
          accessibilityRole="button"
          className="bg-default min-h-11 justify-center rounded-xl px-4"
          onPress={() => {
            void query.refetch();
          }}
        >
          <Text className="text-foreground">Try again</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation} cancel={cancelBeforeNavigation}>
      <FlatList
        testID="search-scroll"
        className="flex-1"
        ref={ref}
        data={query.data.items}
        renderItem={renderResult}
        keyExtractor={resultKey}
        numColumns={2}
        onScroll={onScroll}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        onScrollBeginDrag={onScrollBeginDrag}
        onTouchMove={onScrollBeginDrag}
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
        ListEmptyComponent={<Text className="p-5 text-muted">No results for “{input.query}”.</Text>}
        ListFooterComponent={
          <CatalogPagination
            page={input.page}
            totalPages={query.data.totalPages}
            onChange={onPage}
          />
        }
      />
    </ScrollNavigationProvider>
  );
}
function SearchBody({ input, onPage }: { input: SearchInput; onPage: (page: number) => void }) {
  if (!input.query) {
    return (
      <View className="flex-1 p-5">
        <Text className="text-muted">Find movies, TV shows and people.</Text>
      </View>
    );
  }
  return <SearchResults key={JSON.stringify(input)} input={input} onPage={onPage} />;
}
export function SearchScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const state = readSearchState(params);
  const [typeOpen, setTypeOpen] = useState(false);
  const query = state.query;
  const type = state.type;
  function search(value: string) {
    router.setParams({ q: value, page: '1' });
  }
  function page(value: number) {
    router.setParams({ page: String(value) });
  }
  function selectType(value: string) {
    router.setParams({ mediaType: value, page: '1' });
    setTypeOpen(false);
  }
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
      collapsable={false}
    >
      <View className="gap-3 p-4">
        <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
          Search
        </Text>
        <SearchForm key={query} initialQuery={query} onSearch={search} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Media type"
          className="bg-default min-h-11 justify-center self-start rounded-xl px-4"
          onPress={() => setTypeOpen(true)}
        >
          <Text className="text-foreground">
            {types.find((option) => option.value === type)?.label}
          </Text>
        </Pressable>
      </View>
      <SearchBody input={state} onPage={page} />
      <BottomNavigation />
      {typeOpen ? (
        <ChoiceSheet
          title="Media type"
          options={types}
          selected={[type]}
          multiple={false}
          onSelect={selectType}
          onClose={() => setTypeOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
