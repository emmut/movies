import type { ProviderChoice } from '@movies/api/preferences';

/** Keep unavailable selected services visible so their URL filters can be removed. */
export function providerChoices(available: ProviderChoice[], selected: number[]) {
  const choices = available.map((item) => ({ value: String(item.id), label: item.name }));
  const availableIds = new Set(available.map((item) => item.id));
  for (const id of selected) {
    if (!availableIds.has(id)) {
      choices.push({ value: String(id), label: `Unavailable provider (${id})` });
    }
  }
  return choices;
}
