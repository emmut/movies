import type { CatalogDetailInput } from '@movies/api/catalog';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { PersonCreditGroup } from '@native/components/person-credits';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function CatalogCredits({ input }: { input: CatalogDetailInput }) {
  const [expandedCrew, setExpandedCrew] = useState(false);
  const query = useQuery(
    orpc.catalog.credits.queryOptions({ input: { id: input.id, type: input.type }, retry: false }),
  );
  if (query.data && Object.values(query.data).every((people) => (people?.length ?? 0) === 0)) {
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
          {query.data.crew?.length ? (
            <View className="gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: expandedCrew }}
                onPress={() => setExpandedCrew(!expandedCrew)}
                className="bg-default min-h-11 justify-center self-start rounded-lg border border-border px-4"
              >
                <Text className="font-semibold text-foreground">
                  {expandedCrew ? 'Hide Full Crew' : 'Full Crew'}
                </Text>
              </Pressable>
              {expandedCrew ? (
                <PersonCreditGroup
                  title="Full Crew"
                  people={query.data.crew}
                  region={input.region}
                  compact
                />
              ) : null}
            </View>
          ) : null}
          <PersonCreditGroup title="Cast" people={query.data.cast} region={input.region} />
        </>
      ) : null}
    </View>
  );
}
