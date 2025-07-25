# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint (run after code changes)
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate database migrations from schema changes
- `pnpm db:push` - Push database schema changes to database
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:studio` - Open Drizzle Studio for database inspection

## Architecture Overview

This is a Next.js 15 movies application using the App Router with TypeScript. Key architectural patterns:

### Database & ORM

- PostgreSQL database with Drizzle ORM
- Schema split into `auth` and `watchlist` modules in `src/db/schema/`
- Database instance exported from `src/lib/db/index.ts`
- Migrations stored in `drizzle/` directory

### Authentication System

- Better Auth for authentication with social providers (Discord, GitHub)
- Anonymous user support with watchlist transfer on account linking
- Auth configuration in `src/lib/auth.ts`
- Session management with automatic watchlist migration from anonymous to authenticated users

### API Integration

- TMDB (The Movie Database) API for movie data
- API functions organized by resource type: `src/lib/movies.ts`, `src/lib/tv-shows.ts`, `src/lib/persons.ts`
- Next.js caching with `'use cache'` directive and cache tags for performance

### Environment & Configuration

- Type-safe environment variables using `@t3-oss/env-nextjs` in `src/env.ts`
- API configuration constants in `src/lib/config.ts`
- Required env vars: MOVIE_DB_ACCESS_TOKEN, DATABASE_URL, auth provider secrets

### UI Architecture

- Radix UI components with custom styling in `src/components/ui/`
- Tailwind CSS 4.1 for styling
- App uses sidebar layout pattern with search functionality
- Components follow naming convention: kebab-case files, PascalCase exports

### State Management

- URL state management with `nuqs` for filters and pagination
- Server components for data fetching, client components for interactivity
- Watchlist state managed through server actions

### Key Directories

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components and UI primitives
- `src/lib/` - Business logic, API clients, and utility functions
- `src/types/` - TypeScript type definitions for TMDB API responses
- `src/hooks/` - Custom React hooks

## Development Notes

- Use `pnpm` as package manager (enforced by Volta config)
- Prefer normal functions over arrow functions except for inline usage
- Uses path alias `@/*` for `src/*` imports
- PostgreSQL database required for local development
- Environment variables must be properly configured for TMDB API and auth providers
