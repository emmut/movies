import type { CatalogDetailInput } from '@movies/api/catalog';
import type { CatalogCredits as CatalogCreditsData } from '@movies/api/catalog-support';
import type { CreditPerson } from '@movies/api/credits';
import { useCatalogCredits } from '@movies/api/react/use-catalog-query';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { PersonCreditGroup } from '@native/components/person-credits';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function CatalogCredits({ input }: { input: CatalogDetailInput }) {
  const query = useCatalogCredits({ id: input.id, type: input.type });
  if (query.data && !hasCredits(query.data)) {
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
          <FullCrew people={query.data.crew} region={input.region} />
          <PersonCreditGroup title="Cast" people={query.data.cast} region={input.region} />
        </>
      ) : null}
    </View>
  );
}

function hasCredits(data: CatalogCreditsData) {
  return Object.values(data).some((people) => (people?.length ?? 0) > 0);
}
function FullCrew({ people = [], region }: { people?: CreditPerson[]; region: string }) {
  const [expandedCrew, setExpandedCrew] = useState(false);
  if (people.length === 0) {
    return null;
  }
  return (
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
        <PersonCreditGroup title="Full Crew" people={people} region={region} compact />
      ) : null}
    </View>
  );
}
