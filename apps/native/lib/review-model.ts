import { parseCatalogId } from '@movies/api/catalog';
import { reviewsInput } from '@movies/api/reviews';
import { scalar, type SearchParams } from '@native/lib/search-params';

const reviewDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function formatReviewDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : reviewDateFormatter.format(date);
}

export function isReviewExpandable(content: string) {
  return content.length > 300 || content.split('\n').length > 5;
}

export function reviewCountLabel(count: number) {
  return count.toLocaleString('en-US') + (count === 1 ? ' review' : ' reviews');
}

export function readReviewsInput(params: SearchParams) {
  const page = reviewsInput.shape.page.safeParse(Number(scalar(params.page) ?? 1));
  return reviewsInput.safeParse({
    id: parseCatalogId(scalar(params.id)),
    type: scalar(params.type),
    page: page.success ? page.data : 1,
  });
}
