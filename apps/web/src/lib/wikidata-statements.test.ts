import { describe, expect, it } from 'vite-plus/test';

import { uniqueWikidataValue, wikidataStatements } from './wikidata-statements';

function snak(value: unknown) {
  return { snaktype: 'value', datavalue: { value } };
}
function statement(
  value: string,
  qualifiers: Record<string, unknown> = {},
  rank = 'normal',
  datatype = 'external-id',
) {
  return { rank, qualifiers, mainsnak: { ...snak(value), datatype } };
}
function values(raw: unknown, region = 'SE') {
  return wikidataStatements(raw, 'external-id', region, '2026-11-05');
}
function time(value: string, precision = 11) {
  return [
    snak({ time: value, precision, calendarmodel: 'http://www.wikidata.org/entity/Q1985727' }),
  ];
}

describe('Wikidata statement scope', () => {
  it('selects a local identifier before a preferred global or foreign one', () => {
    const raw = [
      statement('global', {}, 'preferred'),
      statement('Swedish', { P17: [snak({ id: 'Q34' })] }),
      statement('American', { P17: [snak({ id: 'Q30' })] }, 'preferred'),
    ];
    expect(uniqueWikidataValue(values(raw))).toBe('Swedish');
    expect(uniqueWikidataValue(values(raw, 'US'))).toBe('American');
    expect(uniqueWikidataValue(values(raw, 'GB'))).toBe('global');
  });
  it.each(['P17', 'P1001', 'P3005'])('supports explicit country scope in %s', (property) => {
    const raw = [statement('local', { [property]: [snak({ id: 'Q34' })] })];
    expect(values(raw)).toHaveLength(1);
    expect(values(raw, 'US')).toEqual([]);
  });
  it('accepts language and subject-name qualifiers while retaining ambiguity checks', () => {
    const raw = [statement('id', { P407: [snak({ id: 'Q1860' })], P1810: [snak('Name')] })];
    expect(uniqueWikidataValue(values(raw))).toBe('id');
    expect(
      uniqueWikidataValue(values([...raw, statement('other', { P407: [snak({ id: 'Q9027' })] })])),
    ).toBeUndefined();
  });
  it.each([
    [{ P580: time('+2026-11-05T00:00:00Z') }, true],
    [{ P580: time('+2026-11-06T00:00:00Z') }, false],
    [{ P582: time('+2026-11-06T00:00:00Z') }, true],
    [{ P582: time('+2026-11-05T00:00:00Z') }, false],
    [{ P580: time('+2026-00-00T00:00:00Z', 9) }, false],
    [{ P580: time('+2026-02-30T00:00:00Z') }, false],
    [{ P580: time('+2026-11-05T10:00:00Z') }, false],
    [{ P580: [] }, false],
    [{ P17: [] }, false],
    [{ P17: [{}] }, false],
    [{ P17: [snak({ id: 'Q999999999' })] }, false],
    [{ P518: [snak({ id: 'Q123' })] }, false],
    [{ P585: time('+2026-11-05T00:00:00Z') }, false],
  ] as const)('evaluates date/scope qualifiers conservatively: %j', (qualifiers, expected) => {
    expect(values([statement('id', qualifiers)])).toHaveLength(expected ? 1 : 0);
  });
  it('rejects malformed, wrong-datatype, deprecated, non-value and missing statements', () => {
    expect(values(undefined)).toEqual([]);
    expect(
      values([
        null,
        statement('id', {}, 'deprecated'),
        statement('id', {}, 'normal', 'url'),
        { mainsnak: { snaktype: 'somevalue' } },
      ]),
    ).toEqual([]);
  });
  it('does not fall back to a global ID when local identifiers conflict', () => {
    const qualifiers = { P17: [snak({ id: 'Q34' })] };
    expect(
      uniqueWikidataValue(
        values([statement('one', qualifiers), statement('two', qualifiers), statement('global')]),
      ),
    ).toBeUndefined();
  });
});
