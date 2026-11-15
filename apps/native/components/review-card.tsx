import type { Review } from '@movies/api/reviews';
import { ExternalLink } from '@native/components/external-link';
import { StarIcon } from '@native/components/icons';
import { formatReviewDate, isReviewExpandable } from '@native/lib/review-model';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function ReviewCard({ review, clamped = false }: { review: Review; clamped?: boolean }) {
  return (
    <View
      testID={'review-' + review.id}
      className="bg-default gap-3 rounded-lg border border-border p-4"
    >
      <ReviewHeader review={review} />
      <ReviewContent review={review} clamped={clamped} />
      <View className="self-start">
        <ExternalLink href={review.url}>Read on TMDb</ExternalLink>
      </View>
    </View>
  );
}

function ReviewHeader({ review }: { review: Review }) {
  const date = formatReviewDate(review.createdAt);
  return (
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
  );
}

function ReviewContent({ review, clamped }: { review: Review; clamped: boolean }) {
  if (clamped && isReviewExpandable(review.content)) {
    return <ExpandableReview review={review} />;
  }
  return <ReviewText content={review.content} />;
}

function ReviewText({ content, lines }: { content: string; lines?: number }) {
  return (
    <Text selectable numberOfLines={lines} className="text-sm leading-relaxed text-foreground">
      {content}
    </Text>
  );
}

function ExpandableReview({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const toggleLabel = expanded ? 'Show less' : 'Show more';
  return (
    <>
      <ReviewText content={review.content} lines={expanded ? undefined : 5} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${toggleLabel} of ${review.author}’s review`}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => setExpanded(!expanded)}
        className="min-h-11 justify-center self-start"
      >
        <Text className="text-sm text-foreground/70 underline">{toggleLabel}</Text>
      </Pressable>
    </>
  );
}
