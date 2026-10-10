import type { CatalogDetailInput } from '@movies/api/catalog';
import type { CatalogRelatedInput } from '@movies/api/catalog-support';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { MediaPosterRow } from '@native/components/media-poster';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';

function relatedHeading(type: CatalogDetailInput['type'], kind: CatalogRelatedInput['kind']) {
  if (kind === 'recommendations') return 'Recommendations';
  return type === 'movie' ? 'Similar Movies' : 'Similar TV Shows';
}

export function CatalogRelated({
  input,
  kind,
}: {
  input: CatalogDetailInput;
  kind: CatalogRelatedInput['kind'];
}) {
  const query = useQuery(
    orpc.catalog.related.queryOptions({ input: { ...input, kind }, retry: false }),
  );
  const heading = relatedHeading(input.type, kind);
  if (query.data?.length === 0) return null;
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        {heading}
      </Text>
      <CatalogSectionState
        label={heading}
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? <MediaPosterRow items={query.data} /> : null}
    </View>
  );
}
