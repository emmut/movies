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

Requires Railway CLI 5.42.1 or newer and a linked environment (`railway link`).

## Deploy production infrastructure

From the repository root, select the project, review the plan, then apply:

```bash
railway link --environment production
railway config plan
vp run infra:deploy
```

For reviewed deletions, use `vp run infra:deploy --confirm-destructive`.

## Notes

- PR CI sets `RAILWAY_BOOTSTRAP_POSTGRES=true` only when the preview lacks `postgres-db`, so the first IaC apply creates the database with credentials. Later applies use the existing image-backed service declaration.

- `railway config plan` is safe and does not change Railway.
- `railway config apply` previews changes and asks before applying unless you pass `--yes`.
- Destructive changes in non-interactive or agent sessions require `railway config apply --confirm-destructive` after reviewing the plan.
- Services already managed by `railway.json` / `railway.toml` must be migrated before `.railway/railway.ts` can manage them.
- Use `replicas` for scaling; advanced placement can still specify region names.
- Use `group("Name", [resources])` to keep large projects organized on the Railway canvas.
- Secrets imported from Railway are rendered as `preserve()` so existing values are retained without writing secret values to source. Use `railway config pull --omit-preserved-variables` for a smaller import.

## Consolidating the daily cron services

The config replaces `title-sync`, `imdb-ingest`, and `search-index-ingest` with
`daily-maintenance` at 09:00 UTC. No database or volume is removed. Review the
production plan before applying: this migration deletes the three old cron
services, so the normal production workflow deliberately refuses it. After
merging, link the production environment, inspect `railway config plan`, and
apply the reviewed migration with `vp run infra:deploy --confirm-destructive`.
Do this between runs, after the old jobs have finished. Verify that the new
service has its database/token references and both production enable flags,
and inspect its first run for the three job results. Railway may execute the
new deployment immediately as well as on its daily schedule.

PR environments already allow destructive applies. Their existing deployment
wait keeps forked builds from being cancelled during the replacement. The new
service keeps IMDb enabled and title/search sync disabled in previews.
