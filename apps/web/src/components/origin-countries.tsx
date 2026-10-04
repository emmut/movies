import Link from 'next/link';

import Pill from '@/components/pill';
import { getCountryFlag, getCountryName, sanitizeOriginCountryCodes } from '@/lib/countries';

/**
 * Derives what the origin-countries section renders: null when TMDb reports
 * no (valid) origin country, otherwise a pluralized heading plus one
 * flag/name/discover-href entry per sanitized code. TMDb payloads are typed
 * but unvalidated; a remote-cached response from before the field existed may
 * omit it, so `codes` tolerates undefined.
 */
export function getOriginCountriesModel(codes: string[] | undefined, mediaType: 'movie' | 'tv') {
  const countries = sanitizeOriginCountryCodes(codes ?? []);
  if (countries.length === 0) {
    return null;
  }
  return {
    heading: countries.length > 1 ? 'Countries of Origin' : 'Country of Origin',
    pills: countries.map((code) => ({
      code,
      flag: getCountryFlag(code),
      name: getCountryName(code),
      href: `/discover?with_origin_country=${code}&mediaType=${mediaType}`,
    })),
  };
}

/**
 * Flag-and-name pills for an item's origin countries, each linking to
 * discover pre-filtered on that country — the same affordance genre pills
 * give. Hidden entirely when TMDb reports no (valid) origin country.
 */
export function OriginCountries({
  codes,
  mediaType,
}: {
  codes: string[] | undefined;
  mediaType: 'movie' | 'tv';
}) {
  const model = getOriginCountriesModel(codes, mediaType);
  if (!model) {
    return null;
  }
  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold">{model.heading}</h2>
      <div className="flex flex-wrap gap-2">
        {model.pills.map((pill) => (
          <Link key={pill.code} href={pill.href}>
            <Pill className="gap-1.5">
              <span aria-hidden>{pill.flag}</span>
              {pill.name}
            </Pill>
          </Link>
        ))}
      </div>
    </div>
  );
}
