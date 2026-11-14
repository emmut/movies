import type { ProviderChoice } from '@movies/api/preferences';

/** Keep unavailable selected services visible so their URL filters can be removed. */
export function providerChoices(available: ProviderChoice[], selected: number[]) {
  const choices = available.map((item) => ({ value: String(item.id), label: item.name }));
  for (const id of selected) {
    if (!available.some((item) => item.id === id)) {
      choices.push({ value: String(id), label: 'Unavailable provider (' + id + ')' });
    }
  }
  return choices;
}
