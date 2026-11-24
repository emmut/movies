import { z } from 'zod';

// Contract: Railway CLI 5.74.1, src/iac/{saved_plan,change_set}.rs.
const productionEnvironment = '946b6efa-46da-4fef-910e-59bbd494ea43';
const retiredCrons = new Set(['imdb-ingest', 'title-sync', 'search-index-ingest']);
const applications = new Set(['movies', 'api', 'imgproxy-HRto', 'daily-maintenance']);
const changeSchema = z
  .object({
    kind: z.enum([
      'resource.create',
      'resource.update',
      'resource.delete',
      'variable.set',
      'variable.delete',
    ]),
    address: z.string().min(1),
    severity: z.enum(['safe', 'destructive']),
    variable: z.string().optional(),
    path: z.string().optional(),
    field: z.string().optional(),
    resource: z.record(z.string(), z.unknown()).optional(),
    previous: z.unknown().optional(),
  })
  .passthrough();
const planSchema = z
  .object({
    kind: z.literal('railway.config.plan'),
    version: z.literal(1),
    cliVersion: z.literal('5.74.1'),
    environmentId: z.literal(productionEnvironment),
    sourceTree: z.string().min(1),
    configEtag: z.string().min(1),
    changeSetHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    destructive: z.boolean(),
    diff: z.string().optional(),
    // Ownership bookkeeping: CLI 5.74.1 sets this when declared resources
    // have not yet been claimed by the current IaC definition, even for the
    // default project definition. Every resource change is still checked below.
    claim: z.boolean().optional(),
    changeSet: z
      .object({
        version: z.literal(1),
        changes: z.array(changeSchema),
        diagnostics: z.array(
          z.object({
            severity: z.enum(['warning', 'error']),
            path: z.string(),
            message: z.string(),
          }),
        ),
        declared: z.array(z.string()).optional(),
        telemetry: z.object({ language: z.string() }).optional(),
      })
      .strict(),
  })
  .strict();

type Change = z.infer<typeof changeSchema>;

function reject(reason: string): never {
  throw new Error(`Production infrastructure plan rejected: ${reason}`);
}

function allowRetiredCron(change: Change, name: string) {
  const previous = z
    .object({
      type: z.literal('service'),
      name: z.literal(name),
      source: z
        .object({ type: z.literal('github'), repo: z.literal('emmut/movies') })
        .passthrough(),
      volumeAttachments: z.record(z.string(), z.unknown()).nullish(),
    })
    .passthrough()
    .safeParse(change.previous);
  if (
    !retiredCrons.has(name) ||
    !previous.success ||
    Object.keys(previous.data.volumeAttachments ?? {}).length > 0
  ) {
    reject(`deletion of ${change.address} is not an approved stateless cron removal`);
  }
}

function allowRetiredAuthUrl(change: Change) {
  // Approved after the shared-auth rollout; all other variable deletions stay blocked.
  if (
    change.address !== 'service.api' ||
    change.variable !== 'AUTH_URL' ||
    change.path !== 'resources.service.api.variables.AUTH_URL' ||
    change.severity !== 'destructive'
  ) {
    reject('variable deletion is not an approved legacy auth cleanup');
  }
}

function checkChange(change: Change) {
  const [type, ...parts] = change.address.split('.');
  const name = parts.join('.');
  // Only explicitly known application services are automated. This also
  // protects Postgres when Railway represents it as a plain service.
  if (type !== 'service') {
    reject(`changes to ${change.address} require manual review`);
  }
  if (change.kind === 'resource.delete') {
    allowRetiredCron(change, name);
    return;
  }
  if (change.kind === 'variable.delete') {
    allowRetiredAuthUrl(change);
    return;
  }
  if (!applications.has(name) || change.severity !== 'safe') {
    reject(`unapproved change to ${change.address}`);
  }
  if (change.kind === 'resource.update') {
    checkUpdate(change);
  }
  if (change.kind === 'resource.create') {
    checkCreation(change, name);
  }
}

function checkUpdate(change: Change) {
  const fields = ['source', 'build', 'deploy', 'groupId', 'tracing', 'cdn', 'networking'];
  if (!fields.includes(change.field ?? '')) {
    reject(`unapproved update field on ${change.address}`);
  }
}

function checkCreation(change: Change, name: string) {
  const resource = change.resource;
  if (
    resource?.type !== 'service' ||
    resource.name !== name ||
    resource.volumeAttachments != null
  ) {
    reject(`unapproved resource creation at ${change.address}`);
  }
}

export function checkProductionPlan(input: unknown): number {
  const parsed = planSchema.safeParse(input);
  // Only report issue codes and field paths, never messages or input values.
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      code: issue.code,
      path: issue.path.slice(0, 4).map((part) => {
        if (typeof part === 'number') {
          return part;
        }
        return /^[a-zA-Z]+$/.test(String(part)) ? part : '[field]';
      }),
    }));
    reject(`unsupported or malformed saved plan (${JSON.stringify(issues)})`);
  }
  const { changeSet } = parsed.data;
  if (changeSet.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    reject('Railway reported plan errors');
  }
  for (const change of changeSet.changes) {
    checkChange(change);
  }
  return changeSet.changes.length;
}
