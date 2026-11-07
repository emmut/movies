---
name: package-upgrade
description: Upgrade repository packages, review upstream release notes for breaking changes, migrate affected code, validate the result, and open or update a pull request. Use for dependency maintenance, upgrading all packages, and scheduled package-upgrade runs in emmut/movies.
---

# Package upgrade

Carry the upgrade through to a reviewable pull request. Discover current versions and project commands on each run; do not reuse the versions or environment limitations from an earlier report.

## Establish the working state

1. Read applicable `AGENTS.md` files and `CONTRIBUTING.md`. In a managed cloud environment, follow the cloud runtime skill for setup, package installation, and network access.
2. Locate the checkout and verify its remote identifies the intended repository (`https://github.com/emmut/movies` for the scheduled workflow). Inspect the working tree before changing branches. Preserve unrelated local work, using an isolated worktree when necessary.
3. Fetch the current default branch. Check for an existing open dependency-upgrade PR. Reuse its branch when it covers the same maintenance work, preserving its changes and user corrections. Otherwise start a new branch from the current default branch, such as `chore/upgrade-packages-YYYY-MM-DD`. Do not stack unrelated commits or create a duplicate PR.

## Inventory packages and review changes

1. Inspect every workspace manifest, lockfile, shared catalog, overrides, dependency patches, and pinned package manager. Include development tools and aliased packages. Follow the project's runtime policy rather than automatically changing Node's major version.
2. Query the package registry for current stable releases, including major versions. Preserve existing release-age, integrity, build-approval, and supply-chain policies. Do not add exceptions or disable protections to obtain a newer version. Report versions deferred by the policy.
3. Compare installed versions with eligible stable versions. Keep related packages aligned: React/React DOM, Better Auth/passkey, Tailwind/PostCSS integration, TanStack Query/devtools, Vite+ core alias, Vitest/coverage, and their declared peer constraints.
4. Read official release notes, changelogs, and migration guides spanning every version jump, especially major and pre-1.0 changes. Use upstream repository sources and bundled version-matched documentation. Record unavailable sources explicitly rather than claiming they were reviewed. Search the actual code and configuration for each affected API and behavior.
5. Include transitive changes introduced by the updated packages in the review when they affect runtime behavior, configuration, peers, or security. Do not force unrelated transitive major versions through blanket overrides.
6. Record a concise version table, source links, breaking changes, affected usages, migrations, and intentional deferrals in `docs/dependency-upgrade-YYYY-MM-DD.md`.

## Apply the upgrade

1. Update shared versions in `pnpm-workspace.yaml` while preserving workspace `catalog:` references. Update uncataloged dependencies in their owning manifests. Use the project's package manager to regenerate the lockfile; never edit resolved versions or integrity hashes by hand.
2. When upgrading the pinned package manager, use official tooling or verified registry metadata for its integrity and synchronize the lockfile's bootstrap document. Preserve Vite+'s provisioning settings. Update setup documentation where versions are explicitly described.
3. Revisit each local dependency patch. Remove it only if upstream now supplies the behavior and its regression tests pass; otherwise retain or adapt it to the new release.
4. Migrate affected application code, tests, scripts, CI, and configuration. Preserve existing product behavior unless a migration requires a change. Follow new lint diagnostics and deprecations without introducing unnecessary abstractions or weakening checks.
5. For hydration detection, use the single `useIsClient` hook backed by `useSyncExternalStore` directly at call sites. Do not reintroduce a `useIsMounted` wrapper around it.
6. Keep server-only boundaries intact. Do not print secrets, alter production settings, deploy the app, run migrations against a production database, approve dependency-supplied agent skills, or merge the PR as part of this workflow.

## Validate and review

Read the current package scripts and CI configuration; commands can change with upgrades. At present, validate with:

- `pnpm install --frozen-lockfile` using the pinned pnpm version.
- `pnpm check` and `pnpm lint`.
- `pnpm run check-types` (root and web workspace), or equivalent checks required by current repository instructions.
- `pnpm test`, including dependency-patch regression tests.
- `pnpm fallow`, with the audit based on the refreshed default branch.
- `pnpm build` with the appropriate local/CI environment.
- Playwright test collection and relevant browser tests, especially for Playwright, auth, UI, React, or Next.js behavior changes.
- PostgreSQL integration tests against a disposable migrated database when available.
- A final outdated-package check under the unchanged release-age policy, plus `git diff --check` and a review of the complete diff.

Fix upgrade-related failures and add meaningful regression coverage for changed behavior. Do not remove assertions, disable lint rules, increase timeouts indiscriminately, or suppress findings merely to get green checks. Recheck only what later changes or failures warrant.

Try the build and browser tests before declaring them unavailable. Investigate concrete failures; distinguish network/environment blockers from code regressions. Preserve proxy and certificate settings and follow the supported environment-change process for explicitly denied domains. Do not claim blocked checks passed. Keep the version report accurate about skipped tests, unresolved failures, and validation limits.

## Deliver the pull request

1. If there are no eligible upgrades and no migrations are needed, report that and avoid an empty commit or PR.
2. Otherwise commit the complete authorized changes and push the branch. Create or update a PR targeting the default branch. Mark it draft if code regressions remain unresolved or the proposed migration is incomplete; clearly state environment-only validation limits in the description.
3. Lead the PR description with the concrete package upgrades and resulting behavior. Include compatibility fixes, the release-review report link, passed checks, blocked checks, and deferred versions. Use a repository-relative link that resolves correctly or an absolute GitHub file URL. Rewrite the description to reflect the final implementation when scope changes.
4. Never merge automatically. Return the PR link and a concise summary of material remaining risks or blockers. Check available CI results, but do not report pending checks as successful.
