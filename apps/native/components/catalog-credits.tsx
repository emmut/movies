import type { CatalogDetailInput } from '@movies/api/catalog';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { PersonCreditGroup } from '@native/components/person-credits';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

export function CatalogCredits({ input }: { input: CatalogDetailInput }) {
  const query = useQuery(
    orpc.catalog.credits.queryOptions({ input: { id: input.id, type: input.type }, retry: false }),
  );
  if (query.data && Object.values(query.data).every((people) => people.length === 0)) {
    return null;
  }
  return (
    <View className="gap-6">
      <CatalogSectionState
        label="credits"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? (
        <>
          <PersonCreditGroup
            title="Directors"
            people={query.data.directors}
            compact
            region={input.region}
          />
          <PersonCreditGroup
            title="Writers"
            people={query.data.writers}
            compact
            region={input.region}
          />
          <PersonCreditGroup title="Cast" people={query.data.cast} region={input.region} />
        </>
      ) : null}
    </View>
  );
}
