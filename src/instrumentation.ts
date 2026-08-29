import 'server-only';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  // Warm the DB pool at boot instead of on a user's first request: the first
  // connect after a deploy can take ~30s while the database compute
  // cold-wakes. Deliberately not awaited, so a slow wake never delays server
  // readiness — it just runs off the request path.
  try {
    const [{ db }, { sql }] = await Promise.all([import('@/lib/db'), import('drizzle-orm')]);
    db.execute(sql`select 1`).catch(function logWarmupFailure(error: unknown) {
      console.error('DB pool warm-up failed:', error);
    });
  } catch (error) {
    console.error('DB pool warm-up failed:', error);
  }
}
