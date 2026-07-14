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

## Tech stack

- **Framework**: Next.js 16 (App Router, cache components) with React 19
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS 4 with Base UI components
- **Auth**: Better Auth (passkeys, Discord, GitHub)
- **Images**: imgproxy for signed, resized poster images
- **Analytics**: PostHog
- **Tooling**: pnpm, oxlint/oxfmt, Vitest, Playwright, fallow
- **Infrastructure**: Railway (app, imgproxy, daily IMDb ratings ingest cron, per-PR preview environments with their own Postgres), configured as code in `.railway/railway.ts`

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in secrets — src/env.ts is the source of truth
pnpm dev               # boots local Postgres + imgproxy via Docker, then next dev
pnpm db:push           # apply the schema once the database is up
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
├── scripts/          # Maintenance scripts (IMDb ingest, seeding)
├── .railway/         # Railway infrastructure as code
└── public/           # Static assets
```
