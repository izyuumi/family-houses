# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router routes, layouts, and server/client components.
- `components/`: Feature components; shared UI primitives live in `components/ui/` (shadcn/ui style).
- `convex/`: Convex schema, queries, and mutations for real-time data.
- `lib/`: Shared utilities (e.g., i18n context, helpers).
- `public/`: Static assets served at `/`.
- Root configs: `next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `proxy.ts` (Clerk middleware).

## Build, Test, and Development Commands

- `bun install`: Install dependencies.
- `bunx convex dev`: Start the Convex dev server (run in its own terminal).
- `bunx convex codegen`: Regenerate types after any changes under `convex/`.
- `bun run dev`: Start the Next.js dev server at `http://localhost:3000`.
- `bun run build`: Production build.
- `bun run start`: Run the production server after build.
- `bun run lint`: Run ESLint (`next/core-web-vitals` + TypeScript rules).

## Coding Style & Naming Conventions

- TypeScript + React; follow existing formatting (2-space indent, semicolons, double quotes).
- File naming is kebab-case (`property-notes.tsx`); components are PascalCase (`PropertyNotes`).
- Hooks use `useX` naming; shared imports use the `@/*` path alias.
- Styling is Tailwind CSS; prefer utility classes over bespoke CSS.

## Testing Guidelines

- No automated test runner is configured yet (no `test` script).
- If you add tests, prefer colocated files like `*.test.tsx` or a `__tests__/` folder and add a `test` script in `package.json`.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits: `feat:`, `refactor:`, `chore:` (e.g., `feat: add property map filters`).
- PRs should include a short summary, testing notes (commands run), and screenshots/GIFs for UI changes.
- Call out any environment or schema changes (e.g., new `.env.local` keys or Convex schema updates).

## Configuration & Secrets

- Store Clerk and Convex keys in `.env.local` (see README). Never commit secrets.
- When updating Convex schema or functions, keep `convex/` changes in the same PR as UI updates that depend on them.
