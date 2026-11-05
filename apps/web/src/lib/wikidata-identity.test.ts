import { describe, expect, it } from 'vite-plus/test';

import {
  canonicalWikidataItem,
  matchesWikidataIdentity,
  wikidataIdentitySearch,
} from './wikidata-identity';

function statement(value: string, rank = 'normal') {
  return { rank, mainsnak: { snaktype: 'value', datatype: 'external-id', datavalue: { value } } };
}

describe('exact Wikidata identity lookup', () => {
  it('uses IMDb only as an exact alternate identifier', () => {
    expect(wikidataIdentitySearch('movie', 123, 'tt1234567')).toBe(
      'haswbstatement:P4947=123 OR haswbstatement:P345=tt1234567',
    );
    expect(wikidataIdentitySearch('tv', 123, null)).toBe('haswbstatement:P4983=123');
    expect(wikidataIdentitySearch('movie', 123, 'tt1234567 OR other')).toBe(
      'haswbstatement:P4947=123',
    );
    expect(
      matchesWikidataIdentity({ P345: [statement('tt1234567')] }, 'movie', 123, 'tt1234567'),
    ).toBe(true);
  });
  it('accepts matching TMDB IDs without requiring an IMDb identifier', () => {
    expect(
      matchesWikidataIdentity({ P4947: [statement('123'), statement('123')] }, 'movie', 123, null),
    ).toBe(true);
    expect(matchesWikidataIdentity({ P4983: [statement('123')] }, 'tv', 123, null)).toBe(true);
  });
  it.each([
    { P4947: [statement('124')], P345: [statement('tt1234567')] },
    { P4947: [statement('123'), statement('124')] },
    { P4983: [statement('123')], P345: [statement('tt1234567')] },
    { P345: [statement('tt1234568')] },
    { P345: [statement('tt1234567'), statement('tt1234568')] },
    { P345: [statement('tt1234567', 'deprecated')] },
    { P345: [null, {}] },
    {},
  ])(
    'rejects wrong namespaces, mismatches, deprecated and conflicting identities: %j',
    (claims) => {
      expect(matchesWikidataIdentity(claims, 'movie', 123, 'tt1234567')).toBe(false);
    },
  );
  it('never treats a malformed IMDb ID as evidence', () => {
    expect(matchesWikidataIdentity({ P345: [statement('bad-id')] }, 'tv', 1, 'bad-id')).toBe(false);
  });
});

describe('Wikidata redirects', () => {
  it('follows only a validated chain from the requested entity', () => {
    expect(canonicalWikidataItem('Q1', undefined)).toBe('Q1');
    expect(canonicalWikidataItem('Q1', [{ from: 'Q8', to: 'Q9' }])).toBe('Q1');
    expect(
      canonicalWikidataItem('Q1', [
        { from: 'Q1', to: 'Q2' },
        { from: 'Q2', to: 'Q3' },
      ]),
    ).toBe('Q3');
  });
  it.each([
    [
      { from: 'Q1', to: 'Q2' },
      { from: 'Q2', to: 'Q1' },
    ],
    [
      { from: 'Q1', to: 'Q2' },
      { from: 'Q1', to: 'Q3' },
    ],
    [{ from: 'Q1', to: 'unsafe' }],
  ])('rejects cyclic, ambiguous or malformed redirects: %j', (...rows) => {
    expect(() => canonicalWikidataItem('Q1', rows)).toThrow();
  });
});
