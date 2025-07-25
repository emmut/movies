# Movies App

A modern web application for exploring and managing movies, built with Next.js 15 and TypeScript.

## Road map

- [x] Movie trailers
- [x] Person pages
- [ ] Custom movie lists
- [ ] Watched movies tracking
- [ ] Personal ratings
- [ ] Social features

## Features

- Browse movie library
- Search for movies
- View detailed information about each movie
- User authentication
- Dark mode support
- Responsive design with modern UI components

## Tech Stack

- **Framework**: Next.js 15 (Canary) with App Router
- **Language**: TypeScript 5.8
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS 4.1 with Radix UI components
- **Package Manager**: PNPM 10
- **Authentication**: Better Auth
- **Analytics**: Vercel Analytics & PostHog
- **Development Tools**:
  - ESLint 9
  - Prettier
  - Turbopack for development

## Getting Started

1. Clone the project:

```bash
git clone <your-repo-url>
cd movies
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the database URL and other required variables

4. Set up the database:

```bash
pnpm db:generate  # Generate migrations
pnpm db:push     # Push changes to database
```

5. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
movies/
├── src/
│   ├── app/          # Next.js app router pages and layouts
│   ├── components/   # Reusable React components
│   ├── db/          # Database schema and configurations
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions and shared logic
│   ├── providers/   # React context providers
│   ├── types/       # TypeScript type definitions
│   └── icons/       # SVG icons and assets
├── public/          # Static assets
└── drizzle/         # Database migrations and configuration
```

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate database migrations
- `pnpm db:push` - Push database changes
- `pnpm db:studio` - Open Drizzle Studio

## Development

The project uses several modern development tools and practices:

- Turbopack for fast development builds
- Strict TypeScript configuration
- ESLint and Prettier for code quality
- Tailwind CSS for styling with custom components
- Drizzle ORM for type-safe database operations
