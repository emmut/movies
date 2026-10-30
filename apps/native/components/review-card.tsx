import type { Review } from '@movies/api/reviews';
import { ExternalLink } from '@native/components/external-link';
import { StarIcon } from '@native/components/icons';
import { formatReviewDate, isReviewExpandable } from '@native/lib/review-model';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function ReviewCard({ review, clamped = false }: { review: Review; clamped?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const expandable = clamped && isReviewExpandable(review.content);
  const date = formatReviewDate(review.createdAt);
  return (
    <View
      testID={'review-' + review.id}
      className="bg-default gap-3 rounded-lg border border-border p-4"
    >
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
        <Text className="font-medium text-foreground">{review.author}</Text>
        {review.rating !== null ? (
          <View className="flex-row items-center gap-1">
            <StarIcon className="size-4 text-yellow-500" accessible={false} />
            <Text
              accessibilityLabel={`Rating ${review.rating} out of 10`}
              className="text-sm text-foreground"
            >
              {review.rating}/10
            </Text>
          </View>
        ) : null}
        {date ? <Text className="text-xs text-foreground/70">{date}</Text> : null}
      </View>
      <Text
        selectable
        numberOfLines={expandable && !expanded ? 5 : undefined}
        className="text-sm leading-relaxed text-foreground"
      >
        {review.content}
      </Text>
      {expandable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${expanded ? 'Show less' : 'Show more'} of ${review.author}’s review`}
          accessibilityState={{ expanded }}
          aria-expanded={expanded}
          onPress={() => setExpanded(!expanded)}
          className="min-h-11 justify-center self-start"
        >
          <Text className="text-sm text-foreground/70 underline">
            {expanded ? 'Show less' : 'Show more'}
          </Text>
        </Pressable>
      ) : null}
      <View className="self-start">
        <ExternalLink href={review.url}>Read on TMDb</ExternalLink>
      </View>
    </View>
  );
}
