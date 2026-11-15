# Railway configuration

This project defines its Railway infrastructure in code.

```txt
.railway/railway.ts
```

Use this file to describe the Railway project you want: services, databases, buckets, custom domains, replicas, groups, and environment variables.

## Common commands

Create the configuration files:

```bash
railway config init
```

Import an existing Railway project into code:

```bash
railway config pull
```

Preview what Railway would change:

```bash
railway config plan
```

Apply the planned changes:

```bash
vp run infra:deploy
```

Install Railway CLI 5.42.1 or newer and link the intended project and environment with `railway link` first. The task uses that linked environment and keeps Railway's confirmation prompts. For a reviewed destructive plan, pass the explicit opt-in: `vp run infra:deploy --confirm-destructive`.

## Deploy production infrastructure

Run from the repository root on the branch containing the infrastructure definition you intend to deploy. Select the project interactively and link production explicitly, then review the plan:

```bash
railway link --environment production
railway config plan
```

Apply the reviewed changes:

```bash
vp run infra:deploy
```

If the plan includes an intended deletion, use `vp run infra:deploy --confirm-destructive`. Check every deletion before confirming; keep this flag out of the automated production workflow.

For the one-time cleanup after the shared API rollout, the infrastructure definition is already on `main`. Apply it from an up-to-date `main` before merging the dependency upgrade. The plan removes the obsolete `NEXT_PUBLIC_IMAGEKIT_ID`; verify that any other deletions are intended. Until the deploy task is merged into `main`, use `railway config apply --confirm-destructive` directly. Future production applies can then use the ordinary task without encountering that deletion again.

## Notes

- PR CI sets `RAILWAY_BOOTSTRAP_POSTGRES=true` only when the preview lacks `postgres-db`, so the first IaC apply creates the database with credentials. Later applies use the existing image-backed service declaration.

- `railway config plan` is safe and does not change Railway.
- `railway config apply` previews changes and asks before applying unless you pass `--yes`.
- Destructive changes in non-interactive or agent sessions require `railway config apply --confirm-destructive` after reviewing the plan.
- Services already managed by `railway.json` / `railway.toml` must be migrated before `.railway/railway.ts` can manage them.
- Use `replicas` for scaling; advanced placement can still specify region names.
- Use `group("Name", [resources])` to keep large projects organized on the Railway canvas.
- Secrets imported from Railway are rendered as `preserve()` so existing values are retained without writing secret values to source. Use `railway config pull --omit-preserved-variables` for a smaller import.
