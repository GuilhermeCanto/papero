# Contributing to Papero

Thanks for your interest in improving Papero.

Papero is an early-stage finance dashboard for small businesses, solo founders, agencies and developers. The current finance UI works from browser `localStorage`; Prisma/PostgreSQL and Better Auth infrastructure exist, but finance records are not connected to database mode yet.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/dashboard/finance
```

## Checks

Before opening a pull request, run:

```bash
npm run check
npm run build
```

Fresh production builds may require network access because `next/font/google` fetches optimized font assets during build.

## Optional Database Setup

Database setup is optional unless your change touches auth, Prisma, migrations or future database-mode finance work. The active finance UI still uses browser `localStorage`.

Contributors working on database features can use either local Docker PostgreSQL or a hosted PostgreSQL provider such as Supabase, Render, Neon or Railway.

To prepare a local Docker database:

```bash
cp .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
```

To use hosted PostgreSQL, copy `.env.example` to `.env.local`, replace `DATABASE_URL` with the provider connection string, then run the same Prisma commands without Docker. Some hosted providers require SSL options such as `sslmode=require`.

For database auth testing, set:

```env
NEXT_PUBLIC_PAPERO_DATA_MODE="database"
PAPERO_DATA_MODE="database"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate `BETTER_AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

In `database` mode, dashboard routes require login and `/auth/v2/register` creates or ensures the user, company/workspace and OWNER membership. In `local` and `demo` modes, dashboard routes must remain open without auth.

If Docker or PostgreSQL is not available, database commands will fail. That should not block work on the current local-first MVP unless your change specifically touches auth or database infrastructure. Keep `localStorage` mode working until database mode fully replaces it or becomes selectable. Database changes should use the centralized Prisma client in `src/server/db/prisma.ts`.

## Contribution Guidelines

- Do not break localStorage mode while database mode is under development.
- Keep finance changes simple and small.
- Preserve existing route/component patterns where possible.
- Keep route-specific components inside the route's `_components` folder.
- Avoid editing `src/components/ui` unless there is a strong reason.
- Run `npm run check` after meaningful changes.
- Use clear commit messages.

## Branching and Pull Requests

Papero uses a simple branch workflow:

- `main` is the stable branch.
- `develop` is the active development branch.
- Contributors should create feature branches from `develop`.
- Pull requests should target `develop` unless maintainers say otherwise.
- Direct pushes to `main` and `develop` should not be allowed.
- Maintainers review and merge pull requests.

Before opening a pull request, run:

```bash
npm run check
npm run build
```

Database setup is optional unless the pull request touches database infrastructure.

Branch protection rules are configured in GitHub repository settings, not in the codebase. The project intends to protect `main` and `develop` before accepting outside contributions.

## Finance Rules

- Never use floating point numbers for money.
- Store monetary values as integer cents.
- Example: `R$ 100.50` should be stored as `10050`.
- Database work must be company-scoped.
- Finance records such as transactions, categories, contacts and bank accounts should belong to `companyId`.
- Do not attach transactions only to `userId`.

## Files That Should Not Be Committed

Do not commit local or generated files such as:

- `.env`
- `.env*.local`
- `.next`
- `node_modules`
- `tsconfig.tsbuildinfo`
- logs, caches and generated build output

The project `.gitignore` should already cover these, but double-check before committing.

## Attribution and License

Papero was originally built from an MIT-licensed dashboard template. Keep attribution and license treatment respectful.

- Do not remove the original MIT license notice from `LICENSE`.
- Keep template attribution visible in project documentation.
- When changing documentation, avoid implying Papero was built from scratch.

## Pull Requests

When opening a pull request:

- Explain what changed and why.
- Mention whether the change affects localStorage mode, database infrastructure or both.
- Include screenshots for visible UI changes.
- Mention any checks you ran.
