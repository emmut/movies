/** One mounted scroll surface can display several filter/page keys over its lifetime. */
export function createScrollMemory(initialKey: string, positions: Map<string, number>) {
  let key = initialKey;
  const memory = {
    offset: positions.get(key) ?? 0,
    remembered: positions.has(key),
    navigationOffset: null as number | null,
    select(nextKey: string) {
      if (key === nextKey) {
        return false;
      }
      key = nextKey;
      memory.offset = positions.get(key) ?? 0;
      memory.remembered = positions.has(key);
      memory.navigationOffset = null;
      return true;
    },
    remember() {
      memory.remembered = true;
      positions.set(key, memory.offset);
    },
  };
  return memory;
}
