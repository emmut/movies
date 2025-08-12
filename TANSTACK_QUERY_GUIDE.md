# TanStack Query Configuration Guide

TanStack Query har nu konfigurerats i detta projekt för effektiv datahantering och cachning. Här är en komplett guide för hur du använder det.

## 📦 Installerade Paket

- `@tanstack/react-query` - Huvudbiblioteket för data fetching och state management
- `@tanstack/react-query-devtools` - Utvecklingsverktyg för debugging

## 🏗️ Projektstruktur

```
src/
├── providers/
│   └── query-provider.tsx     # QueryClient provider med optimerade inställningar
├── hooks/
│   └── use-movie-query.ts     # Exempel på custom query hooks
└── components/
    └── query-example.tsx      # Exempel på hur man använder query hooks
```

## ⚙️ Konfiguration

### QueryProvider (`src/providers/query-provider.tsx`)

QueryProvider är konfigurerad med följande optimeringar:

- **staleTime**: 60 sekunder (förhindrar onödiga refetches)
- **retry**: 2 försök vid fel
- **refetchOnWindowFocus**: Avstängd (bättre UX)
- **refetchOnReconnect**: Aktiverad
- **DevTools**: Endast i development mode

### Root Layout Integration

QueryProvider är integrerad i `src/app/layout.tsx` och omsluter hela applikationen, vilket gör TanStack Query tillgängligt överallt.

## 🔨 Användning

### 1. Grundläggande Query Hook

```tsx
import { useQuery } from '@tanstack/react-query';

function MovieComponent({ movieId }: { movieId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: async () => {
      const response = await fetch(`/api/movies/${movieId}`);
      return response.json();
    },
    enabled: !!movieId, // Kör endast om movieId finns
    staleTime: 5 * 60 * 1000, // Cache i 5 minuter
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data?.title}</div>;
}
```

### 2. Custom Hook Pattern

```tsx
// hooks/use-movies.ts
export function usePopularMovies(filters?: string) {
  return useQuery({
    queryKey: ['movies', 'popular', filters],
    queryFn: () => fetchPopularMovies(filters),
    staleTime: 2 * 60 * 1000,
  });
}

// I komponenten
function MoviesPage() {
  const { data: movies, isLoading } = usePopularMovies();
  // ...
}
```

### 3. Mutations för Data Updates

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => addToWatchlist(movieId),
    onSuccess: () => {
      // Invalidera queries för att uppdatera UI
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}
```

### 4. Query Keys Best Practices

Använd strukturerade query keys för bättre cache management:

```tsx
export const movieKeys = {
  all: ['movies'] as const,
  lists: () => [...movieKeys.all, 'list'] as const,
  list: (filters: string) => [...movieKeys.lists(), { filters }] as const,
  details: () => [...movieKeys.all, 'detail'] as const,
  detail: (id: number) => [...movieKeys.details(), id] as const,
};
```

## 🛠️ DevTools

TanStack Query DevTools är aktiverade i development mode. Du hittar dem som en knapp i nedre vänstra hörnet av skärmen. DevTools låter dig:

- Inspektera query states
- Se cached data
- Manuellt invalidera queries
- Debugga query timing och status

## 📚 Exempel Implementation

Se `src/components/query-example.tsx` för en komplett implementation som visar:

- Data fetching med queries
- Loading och error states
- Mutations för data updates
- Query invalidation
- Real-time UI updates

## 🎯 Fördelar med TanStack Query

1. **Automatisk Cachning**: Data cachas automatiskt och återanvänds
2. **Background Updates**: Data uppdateras i bakgrunden när det blir stale
3. **Error Handling**: Inbyggd retry-logik och error management
4. **Optimistic Updates**: Snabba UI-updates innan server svarar
5. **DevTools**: Kraftfulla utvecklingsverktyg för debugging
6. **TypeScript Support**: Fullständig type safety

## 🔄 Migration Tips

Om du migrerar från annan data fetching lösning:

1. Ersätt `useState` + `useEffect` med `useQuery`
2. Använd `useMutation` för POST/PUT/DELETE operationer
3. Ta bort manuell loading/error state management
4. Använd query invalidation istället för manuella refetches

## 📖 Ytterligare Resurser

- [TanStack Query Dokumentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/framework/react/guides/best-practices)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)

