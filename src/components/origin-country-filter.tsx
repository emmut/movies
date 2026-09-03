'use client';

import { cn } from 'cn';
import { Check, Filter } from 'lucide-react';
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs';
import { ComponentProps, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  getCountryFlag,
  getCountryName,
  getVisibleOriginCountries,
  sanitizeOriginCountryCodes,
} from '@/lib/countries';

function getTriggerLabel(selected: string[]) {
  if (selected.length === 0) return 'Select origin countries';
  if (selected.length === 1) return `${getCountryFlag(selected[0])} ${getCountryName(selected[0])}`;
  return `${selected.length} countries selected`;
}

// PopoverTrigger's `render` clones the element with the trigger props
// (onClick, aria-*); dropping them leaves a button that never opens the popover.
type TriggerProps = { selected: string[] } & ComponentProps<typeof Button>;

function CountryTrigger({ selected, className, ...props }: TriggerProps) {
  return (
    <Button
      {...props}
      variant="outline"
      className={cn('w-full justify-between', className)}
      id="origin-country"
    >
      <Filter className="mr-2 h-4 w-4 shrink-0" />
      <span className="truncate">{getTriggerLabel(selected)}</span>
    </Button>
  );
}

/**
 * Renders a popover filter for selecting origin countries.
 *
 * Shows a curated list of common film countries until the user searches, then
 * matches against the full ISO country list. Uses OR logic - shows content
 * originating from ANY of the selected countries. Selections live in the
 * `with_origin_country` URL query parameter.
 */
export default function OriginCountryFilter() {
  const [{ with_origin_country: rawSelection }, setParams] = useQueryStates({
    with_origin_country: parseAsArrayOf(parseAsString).withDefault([]),
    page: parseAsString.withDefault('1'),
  });
  // Hand-edited URLs can carry unknown or lowercase codes.
  const selectedCountries = sanitizeOriginCountryCodes(rawSelection);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) setQuery('');
  }

  function updateUrl(codes: string[]) {
    setParams(
      {
        with_origin_country: codes.length > 0 ? codes : null,
        page: '1',
      },
      {
        shallow: false,
      },
    );
  }

  function toggleCountry(code: string) {
    const newCodes = selectedCountries.includes(code)
      ? selectedCountries.filter((selected) => selected !== code)
      : [...selectedCountries, code];

    updateUrl(newCodes);
  }

  function clearAllCountries() {
    updateUrl([]);
  }

  const selectedCount = selectedCountries.length;
  const visibleCountries = getVisibleOriginCountries(query, selectedCountries);

  return (
    <div className="min-w-54">
      <Label htmlFor="origin-country" className="mb-2 flex justify-end @3xl:self-end">
        Origin Country
      </Label>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger render={<CountryTrigger selected={selectedCountries} />} />
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={10}
          className="max-h-[60dvh] overflow-auto"
        >
          <PopoverHeader>
            <div className="flex items-baseline justify-between">
              <PopoverTitle className="py-1">Origin Country</PopoverTitle>
              {selectedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllCountries} className="text-xs">
                  Clear all
                </Button>
              )}
            </div>
            <Input
              type="search"
              placeholder="Search all countries"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </PopoverHeader>

          <div className="grid gap-2">
            {visibleCountries.length === 0 ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                No countries found
              </div>
            ) : (
              visibleCountries.map((code) => {
                const isSelected = selectedCountries.includes(code);

                return (
                  <button
                    type="button"
                    key={code}
                    aria-pressed={isSelected}
                    className={`flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-accent ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                    onClick={() => toggleCountry(code)}
                  >
                    <span aria-hidden className="text-base leading-none">
                      {getCountryFlag(code)}
                    </span>
                    <div className="flex-1 text-left text-sm font-medium">
                      {getCountryName(code)}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
