/**
 * Formats an error for a script's final log line, including the chained
 * `cause`. Drizzle wraps driver failures in "Failed query: <sql>" and keeps
 * the Postgres error (e.g. `relation "titles" does not exist`) on `cause`,
 * so printing only `message` hides the one line that explains the failure.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const cause = error.cause instanceof Error ? ` — caused by: ${error.cause.message}` : '';
  return `${error.message}${cause}`;
}
