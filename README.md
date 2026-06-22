# Papero

Papero is an open-source, local-first finance dashboard for small businesses, solo founders, agencies and developers who want a simple way to track income, expenses, customers, suppliers and cash flow. It works locally today and is moving toward a self-hostable setup with PostgreSQL, Prisma and real authentication.

Screenshot coming soon.

## Status

Papero is currently an open-source MVP with local, demo and database modes.

- Local/demo finance data is stored in browser `localStorage`; database mode persists core finance records through PostgreSQL/Prisma.
- Prisma/PostgreSQL infrastructure is prepared and finance domains are being connected by mode.
- Better Auth email/password login and registration are implemented for database mode.
- Database-mode registration creates or ensures a default company/workspace and OWNER membership.
- Database-backed accounts, categories, contacts and transactions are available.
- Papero is not production-ready accounting software yet.

The current goal is to keep Papero useful as a polished finance workspace while hardening database mode, QA coverage and open-source contribution workflows.

## What Works Today

Papero currently works as a polished local-first finance MVP.

- You can manage finance records in the browser using `localStorage`.
- Local data persists across page refreshes and app restarts in the same browser profile.
- Local data can be lost if browser data is cleared, a different browser or device is used, private browsing is used, or Papero's clear local data control is clicked.
- You can create and edit transactions, incomes, expenses, categories, customers and suppliers.
- Demo data can be loaded, reset and cleared from the app.
- Database mode can persist accounts, categories, contacts and transactions through PostgreSQL/Prisma.

For serious daily use, database mode is the recommended direction, but Papero should still be treated as an early MVP.

## Data Modes

Papero supports three data modes:

- `local`: no database or login required. Finance data is stored in browser `localStorage`. This is good for quick local use, UI work and development.
- `demo`: no database or login required. Finance data is stored in browser `localStorage` and fictional demo data is auto-loaded on the first empty visit.
- `database`: PostgreSQL and Better Auth are required. Dashboard routes are protected, login/register are enabled, auth creates or ensures `User`, `Account`, `Session`, `Company` and `CompanyMember` records, and core finance records are persisted through Prisma/PostgreSQL.

Set both mode variables to the same value in local development:

```env
NEXT_PUBLIC_PAPERO_DATA_MODE="local"
PAPERO_DATA_MODE="local"
```

If mode variables are omitted or invalid, Papero defaults toward open-source-safe local behavior where applicable.

## Features

- Overview dashboard
- Transactions
- Incomes
- Expenses
- Categories
- Customers
- Suppliers
- Demo/reset data
- Privacy mode for hiding financial values
- Preferences panel for theme, fonts, layout, navbar and sidebar options
- Papero Glass default theme
- Real font switching

## Demo Data

Papero includes local demo controls so you can explore the product without creating data manually.

- Load demo data
- Reset demo data
- Clear local data

The active MVP stores this data locally in your browser. Clearing browser storage or using Papero's clear local data control removes it from the current browser.

Public demo deployments can set `NEXT_PUBLIC_PAPERO_DATA_MODE="demo"` to automatically load fictional localStorage data on the first empty visit. Demo mode remains browser-local and resettable; users can still create their own expenses and incomes while exploring.

## Deploy Public Demo to Vercel

For a public demo, deploy Papero in `demo` mode. This does not require PostgreSQL, Better Auth secrets or a shared backend.

Set these Vercel environment variables:

```env
NEXT_PUBLIC_PAPERO_DATA_MODE="demo"
PAPERO_DATA_MODE="demo"
```

In demo mode, fictional data is seeded into each visitor's browser `localStorage`. Visitor-created data stays in that browser and can be reset or cleared from the dashboard. This is useful for public exploration, not for a production SaaS deployment.

Papero runs `prisma generate` during install so clean Vercel builds have Prisma Client types available. This generation step does not connect to a database and does not make database variables required for demo mode.

Use `database` mode separately when you want PostgreSQL persistence and real auth.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- next-intl
- Prisma
- PostgreSQL
- Docker Compose
- Zustand
- Recharts
- TanStack Table
- React Hook Form
- Zod
- Biome

## Local/Demo Quick Start

Install dependencies:

```bash
nvm use
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

For local mode, set:

```env
NEXT_PUBLIC_PAPERO_DATA_MODE="local"
PAPERO_DATA_MODE="local"
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/dashboard/finance
```

For demo mode, set both mode variables to `demo`, restart the dev server, then open `/dashboard/finance`. Demo mode auto-loads fictional localStorage data when the browser stores are empty.

## Database Auth Setup

Database infrastructure is included for contributors and database-backed finance work.

Running migrations prepares a PostgreSQL database and enables Better Auth for `database` mode.

The same Prisma setup works with local Docker PostgreSQL, Supabase, Render, Neon, Railway or another hosted PostgreSQL provider as long as `DATABASE_URL` is valid.

### Option A: Local Postgres with Docker

Docker is optional and only needed if you want to run PostgreSQL locally.

Create a local environment file:

```bash
cp .env.example .env.local
```

Start local PostgreSQL:

```bash
docker compose up -d postgres
```

Generate Prisma Client:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

### Option B: Hosted Postgres

You can also use Supabase, Render, Neon, Railway or another hosted PostgreSQL provider.

1. Create a PostgreSQL database with your provider.
2. Copy the provider's PostgreSQL connection string.
3. Create `.env.local` from `.env.example`.
4. Replace `DATABASE_URL` in `.env.local` with the hosted connection string.
5. Run the same Prisma commands:

```bash
npm run db:generate
npm run db:migrate
```

No Docker is required when using hosted Postgres. Hosted providers may require SSL in the connection string, such as `sslmode=require`.

### Environment Variables

For database auth testing, set these values in `.env.local`:

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="replace-with-a-strong-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_PAPERO_DATA_MODE="database"
PAPERO_DATA_MODE="database"
```

Generate a strong Better Auth secret with:

```bash
openssl rand -base64 32
```

`NEXT_PUBLIC_PAPERO_DATA_MODE` controls client behavior. `PAPERO_DATA_MODE` controls server/proxy behavior. They should usually match.

### Database Mode Validation

After applying migrations and starting the dev server:

1. Open `/dashboard/finance` while logged out.
2. Expected: redirect to `/auth/v2/login`.
3. Open `/auth/v2/register` and create an account.
4. Expected: Papero creates or ensures `User`, `Account`, `Session`, `Company` and `CompanyMember` with OWNER role.
5. Expected: successful registration redirects to `/dashboard/finance`.
6. Log out from the user menu.
7. Expected: logout redirects to `/auth/v2/login`.
8. Log in again.
9. Expected: login redirects to `/dashboard/finance` and the user menu shows the authenticated user.

### Prisma Studio

Open Prisma Studio with:

```bash
npm run db:studio
```

Useful tables to inspect while testing auth:

- `User`
- `Account`
- `Session`
- `Company`
- `CompanyMember`

### Security Notes

- Never commit `.env.local`.
- Never commit real secrets or database URLs.
- Use a strong `BETTER_AUTH_SECRET`.
- Rotate database passwords if they are leaked.
- Use provider-recommended SSL settings for hosted PostgreSQL.

Fresh production builds may require network access because `next/font/google` fetches optimized font assets during build.

## Scripts

- `npm run dev` - start the local development server
- `npm run check` - run Biome checks
- `npm run build` - create a production build
- `npm run db:generate` - generate Prisma Client
- `npm run db:migrate` - run Prisma migrations in development
- `npm run db:seed` - seed the local database
- `npm run db:studio` - open Prisma Studio

## Current Limitation

Papero is still an early MVP. Transfers now support source and target accounts and are treated as account movements in balances, but advanced transfer workflows may still need product and QA polish. Recurring and installment workflows exist but may also need refinement. Database mode requires external PostgreSQL setup.

Local/demo modes remain browser-local by design.

## Contributing

Papero welcomes QA reports, bug reports, feature requests and pull requests.

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
- Use GitHub issue templates for bugs, feature requests and QA reports.
- Run `npm run check` and `npm run build` before submitting code changes.
- Never commit `.env.local`, real database URLs or secrets.

## Roadmap

- Import localStorage data into the database
- Advanced account-to-account transfer workflows
- Polish recurrence and installment workflows
- Reports
- Attachments and receipts
- Hosted deployment documentation
- Optional bank/Open Finance integrations later

## Credits

Papero was originally built on top of the [Next shadcn Admin Dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) template by [arhamkhnz](https://github.com/arhamkhnz).

The template provided the initial dashboard structure, UI foundation and layout patterns. Papero has since been heavily adapted into a finance-focused, local-first product experience for income, expenses, customers, suppliers and cash flow management.

Papero also builds on the open-source ecosystem around Next.js, shadcn/ui, Tailwind CSS, Prisma, PostgreSQL and many other libraries listed in `package.json`.

## License

Papero is released under the MIT License.

This project was originally built from an MIT-licensed dashboard template. The original template MIT notice has been preserved in `LICENSE`, and attribution is provided in the Credits section above.
