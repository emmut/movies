import { z } from 'zod';

const statementSchema = z.object({
  rank: z.enum(['normal', 'preferred']),
  mainsnak: z.object({
    snaktype: z.literal('value'),
    datatype: z.enum(['external-id', 'url']),
    datavalue: z.object({ value: z.string() }),
  }),
  qualifiers: z.record(z.string(), z.unknown()).optional(),
});
const itemSnak = z.object({
  snaktype: z.literal('value'),
  datavalue: z.object({ value: z.object({ id: z.string().regex(/^Q[1-9]\d*$/) }) }),
});
const timeSnak = z.object({
  snaktype: z.literal('value'),
  datavalue: z.object({
    value: z.object({
      time: z.string(),
      precision: z.number().int().min(11).max(14),
      calendarmodel: z.literal('http://www.wikidata.org/entity/Q1985727'),
    }),
  }),
});
const countryItems: Record<string, string> = {
  RU: 'Q159',
  BY: 'Q184',
  KZ: 'Q232',
  UA: 'Q212',
  US: 'Q30',
  SE: 'Q34',
  NO: 'Q20',
  DK: 'Q35',
  FI: 'Q33',
  IS: 'Q189',
  GB: 'Q145',
  IE: 'Q27',
  CA: 'Q16',
  AU: 'Q408',
  NZ: 'Q664',
  DE: 'Q183',
  AT: 'Q40',
  CH: 'Q39',
  FR: 'Q142',
  IT: 'Q38',
  ES: 'Q29',
  PT: 'Q45',
  NL: 'Q55',
  BE: 'Q31',
  LU: 'Q32',
  PL: 'Q36',
  CZ: 'Q213',
  SK: 'Q214',
  HU: 'Q28',
  RO: 'Q218',
  BG: 'Q219',
  GR: 'Q41',
  HR: 'Q224',
  SI: 'Q215',
  EE: 'Q191',
  LV: 'Q211',
  LT: 'Q37',
  JP: 'Q17',
  KR: 'Q884',
  IN: 'Q668',
  CN: 'Q148',
  TW: 'Q865',
  HK: 'Q8646',
  SG: 'Q334',
  MY: 'Q833',
  ID: 'Q252',
  TH: 'Q869',
  PH: 'Q928',
  VN: 'Q881',
  BR: 'Q155',
  MX: 'Q96',
  AR: 'Q414',
  CL: 'Q298',
  CO: 'Q739',
  PE: 'Q419',
  ZA: 'Q258',
  TR: 'Q43',
  IL: 'Q801',
  AE: 'Q878',
  SA: 'Q851',
};

function matchesCountry(raw: unknown, region: string) {
  const snaks = z.array(itemSnak).min(1).safeParse(raw);
  return (
    snaks.success && snaks.data.some((snak) => snak.datavalue.value.id === countryItems[region])
  );
}

function matchesDate(raw: unknown, today: string, start: boolean) {
  const snaks = z.array(timeSnak).length(1).safeParse(raw);
  if (!snaks.success) return false;
  const date = snaks.data[0].datavalue.value.time.match(/^\+(\d{4}-\d{2}-\d{2})T00:00:00Z$/)?.[1];
  const parsed = z.iso.date().safeParse(date);
  return parsed.success && (start ? parsed.data <= today : parsed.data > today);
}

function matchesQualifiers(qualifiers: Record<string, unknown>, region: string, today: string) {
  return Object.entries(qualifiers).every(([property, snaks]) => {
    // Language/name annotations do not change the work's identity; conflicting values still abstain.
    if (property === 'P407' || property === 'P1810') return true;
    if (property === 'P17' || property === 'P1001' || property === 'P3005')
      return matchesCountry(snaks, region);
    if (property === 'P580') return matchesDate(snaks, today, true);
    if (property === 'P582') return matchesDate(snaks, today, false);
    return false;
  });
}

/** Filter qualifiers before rank selection, so a preferred foreign-market ID cannot override a local one. */
export function wikidataStatements(
  raw: unknown,
  datatype: 'external-id' | 'url',
  region: string,
  today: string,
) {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    const parsed = statementSchema.safeParse(entry);
    if (!parsed.success || parsed.data.mainsnak.datatype !== datatype) return [];
    const qualifiers = parsed.data.qualifiers ?? {};
    if (!matchesQualifiers(qualifiers, region, today)) return [];
    return [
      {
        value: parsed.data.mainsnak.datavalue.value,
        rank: parsed.data.rank,
        local: ['P17', 'P1001', 'P3005'].some((property) => property in qualifiers),
      },
    ];
  });
}

export function uniqueWikidataValue(statements: ReturnType<typeof wikidataStatements>) {
  const local = statements.filter((statement) => statement.local);
  const scoped = local.length ? local : statements;
  const preferred = scoped.filter((statement) => statement.rank === 'preferred');
  const values = [
    ...new Set((preferred.length ? preferred : scoped).map((statement) => statement.value)),
  ];
  return values.length === 1 ? values[0] : undefined;
}
