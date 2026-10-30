import { createCatalogCreditsService } from '@server/catalog-credits-service';
import { describe, expect, it, vi } from 'vite-plus/test';

const person = { id: 7, name: 'A performer', credit_id: 'cast-7', profile_path: '/portrait.jpg' };

describe('catalog credits service', () => {
  it.each(['movie', 'tv'] as const)(
    'preserves %s billed order and character credits',
    async (type) => {
      const fetcher = vi.fn().mockResolvedValue({
        cast: [
          { ...person, character: 'The lead', private: 'discard' },
          { id: 8, name: 'Another performer', credit_id: 'cast-8' },
        ],
        crew: [],
      });
      const result = await createCatalogCreditsService(fetcher).credits({ id: 42, type });
      expect(fetcher).toHaveBeenCalledWith(`/${type}/42/credits`);
      expect(result).toEqual({
        ...(type === 'movie' ? { crew: [] } : {}),
        cast: [
          {
            id: 7,
            name: 'A performer',
            creditId: 'cast-7',
            role: 'The lead',
            profileUrl: 'https://image.tmdb.org/t/p/w185/portrait.jpg',
          },
          { id: 8, name: 'Another performer', creditId: 'cast-8', role: '', profileUrl: null },
        ],
        directors: [],
        writers: [],
      });
    },
  );

  it('keeps all web writer jobs and multiple roles per person while excluding other crew', async () => {
    const jobs = ['Director', 'Writer', 'Screenplay', 'Story', 'Original Story', 'Producer'];
    const fetcher = vi.fn().mockResolvedValue({
      cast: [],
      crew: jobs.map((job) => ({ ...person, credit_id: job, job, profile_path: null })),
    });
    const service = createCatalogCreditsService(fetcher);
    const result = await service.credits({ id: 42, type: 'movie' });
    expect(result.crew?.map((item) => item.role)).toEqual(jobs);
    expect(result.directors.map((item) => item.role)).toEqual(['Director']);
    expect(result.writers.map((item) => item.role)).toEqual([
      'Writer',
      'Screenplay',
      'Story',
      'Original Story',
    ]);
    expect(result.writers.map((item) => item.creditId)).toEqual([
      'Writer',
      'Screenplay',
      'Story',
      'Original Story',
    ]);
    expect(await service.credits({ id: 42, type: 'tv' })).toEqual({
      cast: [],
      directors: [],
      writers: [],
    });
  });

  it('distinguishes genuinely empty credits from malformed data and upstream failure', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ cast: [], crew: [] })
      .mockResolvedValueOnce({ cast: 'invalid', crew: [] })
      .mockRejectedValueOnce(new Error('upstream failure'));
    const service = createCatalogCreditsService(fetcher);
    expect(await service.credits({ id: 42, type: 'movie' })).toEqual({
      crew: [],
      cast: [],
      directors: [],
      writers: [],
    });
    await expect(service.credits({ id: 42, type: 'movie' })).rejects.toThrow();
    await expect(service.credits({ id: 42, type: 'movie' })).rejects.toThrow('upstream failure');
  });
});

it('uses series-wide aggregate roles and episode counts before billed fallback', async () => {
  const fetcher = vi.fn().mockResolvedValue({
    cast: [
      {
        id: 7,
        name: 'Performer',
        profile_path: null,
        total_episode_count: 8,
        roles: [
          { character: 'Lead', episode_count: 7 },
          { character: 'Lead', episode_count: 1 },
        ],
      },
    ],
  });
  const result = await createCatalogCreditsService(fetcher).credits({ id: 42, type: 'tv' });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith('/tv/42/aggregate_credits');
  expect(result.cast).toEqual([
    { id: 7, creditId: '7', name: 'Performer', role: 'Lead', profileUrl: null, episodeCount: 8 },
  ]);
});
