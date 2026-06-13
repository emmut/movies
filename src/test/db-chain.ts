/**
 * Builds a fluent Drizzle query-builder stand-in for tests: every method call
 * returns the same builder, and awaiting it resolves to `result`. Lets a test
 * stub an arbitrary drizzle chain (`.select().from().where()...`) without
 * mirroring its exact shape.
 */
export function chain<T>(result: T): never {
  const builder = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: (v: T) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject);
        }
        return () => builder;
      },
    },
  );
  return builder as never;
}
