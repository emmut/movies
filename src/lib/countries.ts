/**
 * ISO 3166-1 alpha-2 country codes for the discover origin-country filter.
 * Names come from Intl.DisplayNames, so the list stays a plain code array.
 */
export const originCountries = [
  'AD',
  'AE',
  'AF',
  'AG',
  'AI',
  'AL',
  'AM',
  'AO',
  'AQ',
  'AR',
  'AS',
  'AT',
  'AU',
  'AW',
  'AX',
  'AZ',
  'BA',
  'BB',
  'BD',
  'BE',
  'BF',
  'BG',
  'BH',
  'BI',
  'BJ',
  'BL',
  'BM',
  'BN',
  'BO',
  'BQ',
  'BR',
  'BS',
  'BT',
  'BV',
  'BW',
  'BY',
  'BZ',
  'CA',
  'CC',
  'CD',
  'CF',
  'CG',
  'CH',
  'CI',
  'CK',
  'CL',
  'CM',
  'CN',
  'CO',
  'CR',
  'CU',
  'CV',
  'CW',
  'CX',
  'CY',
  'CZ',
  'DE',
  'DJ',
  'DK',
  'DM',
  'DO',
  'DZ',
  'EC',
  'EE',
  'EG',
  'EH',
  'ER',
  'ES',
  'ET',
  'FI',
  'FJ',
  'FK',
  'FM',
  'FO',
  'FR',
  'GA',
  'GB',
  'GD',
  'GE',
  'GF',
  'GG',
  'GH',
  'GI',
  'GL',
  'GM',
  'GN',
  'GP',
  'GQ',
  'GR',
  'GS',
  'GT',
  'GU',
  'GW',
  'GY',
  'HK',
  'HM',
  'HN',
  'HR',
  'HT',
  'HU',
  'ID',
  'IE',
  'IL',
  'IM',
  'IN',
  'IO',
  'IQ',
  'IR',
  'IS',
  'IT',
  'JE',
  'JM',
  'JO',
  'JP',
  'KE',
  'KG',
  'KH',
  'KI',
  'KM',
  'KN',
  'KP',
  'KR',
  'KW',
  'KY',
  'KZ',
  'LA',
  'LB',
  'LC',
  'LI',
  'LK',
  'LR',
  'LS',
  'LT',
  'LU',
  'LV',
  'LY',
  'MA',
  'MC',
  'MD',
  'ME',
  'MF',
  'MG',
  'MH',
  'MK',
  'ML',
  'MM',
  'MN',
  'MO',
  'MP',
  'MQ',
  'MR',
  'MS',
  'MT',
  'MU',
  'MV',
  'MW',
  'MX',
  'MY',
  'MZ',
  'NA',
  'NC',
  'NE',
  'NF',
  'NG',
  'NI',
  'NL',
  'NO',
  'NP',
  'NR',
  'NU',
  'NZ',
  'OM',
  'PA',
  'PE',
  'PF',
  'PG',
  'PH',
  'PK',
  'PL',
  'PM',
  'PN',
  'PR',
  'PS',
  'PT',
  'PW',
  'PY',
  'QA',
  'RE',
  'RO',
  'RS',
  'RU',
  'RW',
  'SA',
  'SB',
  'SC',
  'SD',
  'SE',
  'SG',
  'SH',
  'SI',
  'SJ',
  'SK',
  'SL',
  'SM',
  'SN',
  'SO',
  'SR',
  'SS',
  'ST',
  'SV',
  'SX',
  'SY',
  'SZ',
  'TC',
  'TD',
  'TF',
  'TG',
  'TH',
  'TJ',
  'TK',
  'TL',
  'TM',
  'TN',
  'TO',
  'TR',
  'TT',
  'TV',
  'TW',
  'TZ',
  'UA',
  'UG',
  'UM',
  'US',
  'UY',
  'UZ',
  'VA',
  'VC',
  'VE',
  'VG',
  'VI',
  'VN',
  'VU',
  'WF',
  'WS',
  'YE',
  'YT',
  'ZA',
  'ZM',
  'ZW',
];

/** Common film-producing countries shown before the user searches. */
export const curatedOriginCountries = [
  'US',
  'GB',
  'FR',
  'DE',
  'ES',
  'IT',
  'SE',
  'DK',
  'NO',
  'FI',
  'JP',
  'KR',
  'IN',
  'CN',
  'HK',
];

const originCountrySet = new Set(originCountries);

const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function getCountryName(code: string) {
  try {
    return countryDisplayNames.of(code) ?? code;
  } catch {
    // Intl.DisplayNames.of throws a RangeError on syntactically invalid codes
    // (hand-edited URLs); fall back to the raw code instead of crashing.
    return code;
  }
}

/** Regional-indicator flag emoji for an ISO 3166-1 alpha-2 code. */
export function getCountryFlag(code: string) {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((char) => 0x1f1a5 + char.charCodeAt(0)),
  );
}

/**
 * Normalizes URL-sourced origin-country codes: uppercases, dedupes, and drops
 * anything not in the known ISO list so hand-edited URLs can neither crash the
 * UI nor leak garbage into the TMDb query.
 */
export function sanitizeOriginCountryCodes(codes: string[]) {
  return [...new Set(codes.map((code) => code.trim().toUpperCase()))].filter((code) =>
    originCountrySet.has(code),
  );
}

/**
 * Joins selected origin-country codes into TMDb's pipe-separated
 * `with_origin_country` value (OR semantics). Shared by the server prefetch
 * and the client hook so their React Query keys can never diverge.
 */
export function getOriginCountryString(codes: string[]) {
  const sanitized = sanitizeOriginCountryCodes(codes);
  return sanitized.length > 0 ? sanitized.join('|') : undefined;
}

function matchesCountryQuery(code: string, query: string) {
  return code.toLowerCase() === query || getCountryName(code).toLowerCase().includes(query);
}

/** Name-prefix matches (and exact code matches) first, then alphabetical by name. */
function rankCountryMatches(query: string) {
  return originCountries
    .filter((code) => matchesCountryQuery(code, query))
    .map((code) => {
      const name = getCountryName(code).toLowerCase();
      return { code, name, prefix: name.startsWith(query) || code.toLowerCase() === query };
    })
    .sort((a, b) =>
      a.prefix === b.prefix ? a.name.localeCompare(b.name) : Number(b.prefix) - Number(a.prefix),
    )
    .map((match) => match.code);
}

/**
 * Derives the codes the origin-country popover lists: the curated set while
 * the search box is empty, the full list filtered by name/code otherwise,
 * with any selected-but-unlisted codes prepended so a selection always stays
 * visible and deselectable.
 */
export function getVisibleOriginCountries(query: string, selected: string[]) {
  const trimmed = query.trim().toLowerCase();
  const base = trimmed ? rankCountryMatches(trimmed) : curatedOriginCountries;
  const pinned = sanitizeOriginCountryCodes(selected).filter((code) => !base.includes(code));
  return [...pinned, ...base];
}
