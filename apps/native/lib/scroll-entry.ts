/** Expo web can recreate route keys on browser Back; its history ID survives the round trip. */
export function scrollEntryIdentity(routeKey: string, historyState: unknown) {
  if (historyState && typeof historyState === 'object' && 'id' in historyState) {
    if (typeof historyState.id === 'string' && historyState.id.length > 0) {
      return 'history:' + historyState.id;
    }
  }
  return routeKey;
}
