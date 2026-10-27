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
      cast: [],
      directors: [],
      writers: [],
    });
    await expect(service.credits({ id: 42, type: 'movie' })).rejects.toThrow();
    await expect(service.credits({ id: 42, type: 'movie' })).rejects.toThrow('upstream failure');
  });
});
