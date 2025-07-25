# Agent Guidelines for Movies App

## Build/Lint/Test Commands
- `pnpm dev` - Start development server with turbopack
- `pnpm build` - Build production app with turbopack  
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- No test framework configured - verify changes manually

## Code Style Guidelines
- Use pnpm package manager
- Prefer normal functions `function()` over arrow functions `() =>` except for inline functions
- Single quotes, 2-space indentation, semicolons, trailing commas (ES5)
- Use `@/` path alias for src imports
- TypeScript strict mode enabled
- Tailwind CSS with prettier-plugin-tailwindcss for class sorting

## Naming Conventions
- Components: PascalCase (e.g., `Button`, `ResourceCard`)
- Files: kebab-case for components, camelCase for utilities
- Functions: camelCase with descriptive names
- Types: PascalCase interfaces/types

## Error Handling
- Use Zod for validation
- Handle null/undefined with optional chaining
- Return early patterns preferred