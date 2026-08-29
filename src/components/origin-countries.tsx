import Link from 'next/link';

import Pill from '@/components/pill';
import { getCountryFlag, getCountryName, sanitizeOriginCountryCodes } from '@/lib/countries';

/**
 * Flag-and-name pills for an item's origin countries, each linking to
 * discover pre-filtered on that country — the same affordance genre pills
 * give. Hidden entirely when TMDb reports no (valid) origin country.
 */
export function OriginCountries({
  codes,
  mediaType,
}: {
  // TMDb payloads are typed but unvalidated; a remote-cached response from
  // before the field existed may omit it, so tolerate undefined here.
  codes: string[] | undefined;
  mediaType: 'movie' | 'tv';
}) {
  const countries = sanitizeOriginCountryCodes(codes ?? []);
  if (countries.length === 0) {
    return null;
  }
  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold">
        {countries.length > 1 ? 'Countries of Origin' : 'Country of Origin'}
      </h2>
      <div className="flex flex-wrap gap-2">
        {countries.map((code) => (
          <Link key={code} href={`/discover?with_origin_country=${code}&mediaType=${mediaType}`}>
            <Pill className="gap-1.5">
              <span aria-hidden>{getCountryFlag(code)}</span>
              {getCountryName(code)}
            </Pill>
          </Link>
        ))}
      </div>
    </div>
  );
}
