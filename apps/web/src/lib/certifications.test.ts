import { describe, expect, it } from 'vitest';

import { formatCertification, pickMovieCertification, pickTvCertification } from './certifications';

const movieResults = [
  {
    iso_3166_1: 'SE',
    release_dates: [
      { certification: '', iso_639_1: '', release_date: '2024-01-01', type: 1 },
      { certification: '15', iso_639_1: '', release_date: '2024-01-10', type: 3 },
    ],
  },
  {
    iso_3166_1: 'US',
    release_dates: [{ certification: 'R', iso_639_1: '', release_date: '2024-01-05', type: 3 }],
  },
];

describe('pickMovieCertification', () => {
  it('prefers the requested region, skipping empty certifications', () => {
    expect(pickMovieCertification(movieResults, 'SE')).toEqual({ value: '15', region: 'SE' });
  });

  it('falls back to the US rating when the region has none', () => {
    expect(pickMovieCertification(movieResults, 'DE')).toEqual({ value: 'R', region: 'US' });
  });

  it('falls back to US when the region entry only has empty certifications', () => {
    const results = [
      {
        iso_3166_1: 'SE',
        release_dates: [{ certification: '', iso_639_1: '', release_date: '', type: 1 }],
      },
      ...movieResults.slice(1),
    ];
    expect(pickMovieCertification(results, 'SE')).toEqual({ value: 'R', region: 'US' });
  });

  it('returns null when neither region is rated', () => {
    expect(pickMovieCertification([], 'SE')).toBeNull();
  });

  it('prefers theatrical release over digital when both have certifications', () => {
    const results = [
      {
        iso_3166_1: 'SE',
        release_dates: [
          { certification: '15', iso_639_1: '', release_date: '2024-01-01', type: 4 },
          { certification: '11', iso_639_1: '', release_date: '2024-01-10', type: 3 },
        ],
      },
    ];
    expect(pickMovieCertification(results, 'SE')).toEqual({ value: '11', region: 'SE' });
  });
});

describe('pickTvCertification', () => {
  const tvResults = [
    { iso_3166_1: 'SE', rating: '15' },
    { iso_3166_1: 'US', rating: 'TV-MA' },
  ];

  it('prefers the requested region', () => {
    expect(pickTvCertification(tvResults, 'SE')).toEqual({ value: '15', region: 'SE' });
  });

  it('falls back to the US rating, treating an empty rating as missing', () => {
    expect(pickTvCertification([{ iso_3166_1: 'SE', rating: '' }, tvResults[1]], 'SE')).toEqual({
      value: 'TV-MA',
      region: 'US',
    });
    expect(pickTvCertification(tvResults, 'DE')).toEqual({ value: 'TV-MA', region: 'US' });
  });

  it('returns null when neither region is rated', () => {
    expect(pickTvCertification([], 'SE')).toBeNull();
  });
});

describe('formatCertification', () => {
  it('returns the bare value for the user region', () => {
    expect(formatCertification({ value: '15', region: 'SE' }, 'SE')).toBe('15');
  });

  it('qualifies a fallback with its source region', () => {
    expect(formatCertification({ value: 'R', region: 'US' }, 'SE')).toBe('R (US)');
  });

  it('returns null for a missing certification', () => {
    expect(formatCertification(null, 'SE')).toBeNull();
  });
});
