# Movies App

A web app for exploring movies and TV shows and keeping track of what you watch, built with Next.js and TypeScript on top of the TMDB API.

## Features

- Browse trending, now playing, upcoming, and top rated movies and TV shows
- Discover by genre with sorting, watch-provider and runtime filters
- Search across movies, TV shows, and people (with a command palette)
- Detail pages with trailers, cast, recommendations, reviews, age certifications, watch providers, and IMDb ratings
- Person pages with filmographies
- Watchlist, watched tracking, and custom lists with drag-and-drop reordering
- Authentication with passkeys, Discord, and GitHub (Better Auth)
- Dark mode and responsive UI

## Road map

- [x] Movie trailers
- [x] Person pages
- [x] Custom movie lists
- [x] Watched movies tracking
- [ ] Personal ratings
- [ ] Social features

## Lists and the TMDB API

Lists are local: they belong to the app's users (anonymous ones included), not to a TMDB account, so TMDB's own list feature was never an option. That makes list pages the one place the TMDB API works against us.

**The original design.** Every list feature was built on live TMDB calls, the same way discover, search, and detail pages are. That kept TMDB as the single source of truth and needed no schema, and for browsing it is still the right model. It broke down for the stream-provider filter on lists: TMDB's discover endpoint can filter by provider, but it cannot be handed a set of ids, so "my watchlist, on Netflix" has no single call. The filter therefore loaded every row in the list, asked TMDB about each one, and paginated the survivors in memory. Correct, but linear in list size and impossible to sort or count in the database.

**Why not mirror TMDB.** The tempting fix is a full local copy of the catalog. It is roughly a million movies plus TV shows, TMDB publishes daily id exports and a changes feed precisely so integrators stop crawling, and the watch-provider data is licensed from JustWatch with its own attribution rules. It is also unnecessary: the app only ever needs data for titles someone has put in a list.

**The current design.** A Postgres cache of that working set, in the same spirit as the IMDb ratings table:

- `titles` holds the fields list grids need for every title in any list; `title_availability` holds one row per title, region, provider, and offer type.
- The provider filter is an `EXISTS` predicate on the list query, so counting and paging happen in SQL.
- The cache is filled on write (adding to a list syncs the title after the response), caught up lazily for titles that predate it, and refreshed nightly by `pnpm sync:titles`, which also prunes titles no list references.
- TMDB remains the source of truth. Browsing pages still read it through Next's `'use cache'`; only list-shaped features, where the app already owns the set of ids, read the local tables.

What this unlocks next (sorting and filtering lists in SQL, rendering grids without per-row TMDB calls) is written up in [docs/title-cache-plan.md](./docs/title-cache-plan.md).

## Tech stack

- **Framework**: Next.js 16 (App Router, cache components) with React 19
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS 4 with Base UI components
- **Auth**: Better Auth (passkeys, Discord, GitHub)
- **Images**: imgproxy for signed, resized poster images
- **Analytics**: PostHog
- **Tooling**: pnpm, oxlint/oxfmt, Vitest, Playwright, fallow
- **Infrastructure**: Railway (app, imgproxy, nightly IMDb ratings ingest and title-cache sync crons, per-PR preview environments with their own Postgres), configured as code in `.railway/railway.ts`

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in secrets — src/env.ts is the source of truth
pnpm dev:docker:up     # start local Postgres + imgproxy via Docker
pnpm db:push           # apply the schema
pnpm dev               # dev server (starts the Docker services if needed)
```

Open [http://localhost:3000](http://localhost:3000). See [CONTRIBUTING.md](./CONTRIBUTING.md) for prerequisites, environment details, and conventions.

## Scripts

Run `pnpm run` for the authoritative list. The most used:

- `pnpm dev` — dev server (starts Docker services first)
- `pnpm lint` / `pnpm format` — lint and format
- `pnpm test` — unit tests (Vitest)
- `pnpm e2e` — end-to-end tests (Playwright)
- `pnpm fallow` — audit changed files (dead code, complexity, duplication)
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` / `pnpm db:studio` — Drizzle
- `pnpm ingest:imdb` — populate IMDb ratings locally (optional, ~1.5M rows)
- `pnpm sync:titles` — refresh the local title cache for titles in lists (runs nightly in production)

## Project structure

```
movies/
├── src/
│   ├── app/          # Next.js app router pages and layouts
│   ├── components/   # Reusable React components
│   ├── db/           # Database schema
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Data fetchers, server actions, and shared logic
│   ├── providers/    # React context providers
│   ├── types/        # TypeScript type definitions
│   └── icons/        # SVG icons
├── e2e/              # Playwright end-to-end tests
├── drizzle/          # Database migrations
├── scripts/          # Maintenance scripts (IMDb ingest, title sync, seeding)
├── .railway/         # Railway infrastructure as code
└── public/           # Static assets
```
