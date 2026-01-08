# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, route handlers, and layouts (`app/page.tsx`, `app/api/`, `app/auth/`).
- `components/`: Reusable UI components (shadcn/ui + custom).
- `lib/`: Shared utilities and data helpers.
- `public/`: Static assets served as-is (images, icons).
- `supabase/`: Supabase config and migrations (if present).
- Config files live at the repo root (`next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`, `tsconfig.json`).

## Build, Test, and Development Commands
- `npm run dev`: Start the local Next.js dev server.
- `npm run build`: Create a production build.
- `npm run start`: Run the production server after a build.
- `npm run lint`: Run ESLint with Next.js rules.

## Coding Style & Naming Conventions
- TypeScript-first (see `tsconfig.json`); use `.tsx` for React components.
- Follow Next.js and `next/core-web-vitals` ESLint rules (`eslint.config.mjs`).
- Prefer Tailwind utility classes for styling; keep components small and focused.
- Naming: React components in `PascalCase`, hooks in `useCamelCase`, files in `kebab-case` or `camelCase` matching existing patterns.

## Testing Guidelines
- No automated test framework is configured in this repo.
- If you add tests, document the framework and add a script (e.g., `npm test`).

## Commit & Pull Request Guidelines
- Commit messages follow a Conventional Commits style (`feat: ...`, `chore: ...`).
- Keep commits focused and include brief context in the subject line.
- PRs should include: a concise description, relevant screenshots for UI changes, and linked issues if applicable.

## Configuration & Environment
- Supabase credentials are expected in `.env.local` (see `README.md` for keys).
- Do not commit secrets; use environment variables for all external services.
