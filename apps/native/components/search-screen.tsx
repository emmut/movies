import type { SearchInput, SearchItem } from '@movies/api/search';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CatalogPagination } from '@native/components/catalog-pagination';
import { SearchIcon } from '@native/components/icons';
import { PosterGridSkeleton } from '@native/components/loading-skeletons';
import { MediaPoster } from '@native/components/media-poster';
import { MediaTypeTabs } from '@native/components/media-type-tabs';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { SearchPerson } from '@native/components/search-person-card';
import { SearchSuggestions } from '@native/components/search-suggestions';
import { useSearchList } from '@native/hooks/use-search-query';
import { readSearchState } from '@native/lib/search-state';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
const ResultList = withUniwind(FlatList<SearchItem>);
const types = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'person', label: 'People' },
] as const;

function SearchForm({
  draft,
  setDraft,
  onSearch,
}: {
  draft: string;
  setDraft: (value: string) => void;
  onSearch: (query: string) => void;
}) {
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
        className="bg-default min-h-12 min-w-0 flex-1 rounded-xl border border-border px-4 text-foreground"
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
        className="min-h-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400 px-3"
        onPress={submit}
      >
        <SearchIcon className="size-5 text-zinc-950" accessible={false} />
      </Pressable>
    </View>
  );
}
function renderResult({ item }: { item: SearchItem }) {
  return (
    <View className="w-1/2 px-2 pb-4">
      {item.type === 'person' ? (
        <SearchPerson item={item} fluid />
      ) : (
        <MediaPoster item={item} fluid />
      )}
    </View>
  );
}
function resultKey(item: SearchItem) {
  return item.type + ':' + item.id;
}
function SearchResults({ input, onPage }: { input: SearchInput; onPage: (page: number) => void }) {
  const query = useSearchList(input);
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
    return <PosterGridSkeleton label="Loading search results" />;
  }
  if (query.isError) {
    return (
      <ScreenQueryState
        label="search results"
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation} cancel={cancelBeforeNavigation}>
      <ResultList
        testID="search-scroll"
        contentContainerClassName="px-2"
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
function SearchContent() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const state = readSearchState(params);
  const query = state.query;
  const [draft, setDraft] = useState(query);
  const suggesting = draft.trim().length > 0 && draft.trim() !== query;
  const type = state.type;
  function search(value: string) {
    router.setParams({ q: value, page: '1' });
  }
  function page(value: number) {
    router.setParams({ page: String(value) });
  }
  function selectType(value: string) {
    router.setParams({ mediaType: value, page: '1' });
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
        <SearchForm draft={draft} setDraft={setDraft} onSearch={search} />
        <MediaTypeTabs
          options={types}
          value={type}
          onChange={selectType}
          label="Search media type"
        />
      </View>
      {suggesting ? (
        <SearchSuggestions
          draft={draft}
          submit={() => {
            Keyboard.dismiss();
            search(draft.trim());
          }}
        />
      ) : (
        <SearchBody input={state} onPage={page} />
      )}
      <BottomNavigation />
    </SafeAreaView>
  );
}

export function SearchScreen() {
  const params = useLocalSearchParams();
  return <SearchContent key={readSearchState(params).query} />;
}
