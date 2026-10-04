import 'server-only';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const [{ db }, { sql }, { waitForDatabase }] = await Promise.all([
    import('@/lib/db'),
    import('drizzle-orm'),
    import('@/lib/db-wait'),
  ]);

  await waitForDatabase(() => db.execute(sql`select 1`));
}
