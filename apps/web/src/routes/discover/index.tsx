import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/discover/')({
  beforeLoad: () => {
    throw redirect({
      to: '/discover/$',
      params: { _splat: '' },
      search: { mediaType: 'movie', page: 1 },
    });
  },
});
