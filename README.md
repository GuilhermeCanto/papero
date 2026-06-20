# Papero

Papero is an open-source, local-first finance dashboard for small businesses, solo founders, agencies and developers who want a simple way to track income, expenses, customers, suppliers and cash flow. It works locally today and is moving toward a self-hostable setup with PostgreSQL, Prisma and real authentication.

Screenshot coming soon.

## Status

Papero is currently a local-first MVP.

- Active finance data is stored in browser `localStorage`.
- Prisma/PostgreSQL infrastructure is prepared, but the UI is not connected to the database yet.
- Auth screens exist, but real authentication is not connected yet.
- Papero is not production-ready accounting software yet.

The current goal is to make Papero useful as a polished local-first finance workspace before adding real persistence, authentication and hosted deployment flows.

## What Works Today

Papero currently works as a polished local-first finance MVP.

- You can manage finance records in the browser using `localStorage`.
- Local data persists across page refreshes and app restarts in the same browser profile.
- Local data can be lost if browser data is cleared, a different browser or device is used, private browsing is used, or Papero's clear local data control is clicked.
- You can create and edit transactions, incomes, expenses, categories, customers and suppliers.
- Demo data can be loaded, reset and cleared from the app.
- Database and auth infrastructure exists or is being prepared, but the active product experience is still local-first.

For serious daily use, database mode is planned and recommended once it is fully connected to the product UI.

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

## Optional Database Setup

Database infrastructure is included for contributors and future database mode.

Running migrations and seed commands prepares a PostgreSQL database, but it does not automatically switch the UI from `localStorage` to PostgreSQL yet. The current Papero UI still uses browser `localStorage` until database mode is connected.

The same Prisma setup works with local Docker PostgreSQL, Supabase, Render, Neon, Railway or another hosted PostgreSQL provider as long as `DATABASE_URL` is valid.

### Option A: Local Postgres with Docker

Docker is optional and only needed if you want to run PostgreSQL locally.

Create a local environment file:

```bash
cp .env.example .env
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

Seed demo database records:

```bash
npm run db:seed
```

Open Prisma Studio:

```bash
npm run db:studio
```

### Option B: Hosted Postgres

You can also use Supabase, Render, Neon, Railway or another hosted PostgreSQL provider.

1. Create a PostgreSQL database with your provider.
2. Copy the provider's PostgreSQL connection string.
3. Create `.env` from `.env.example`.
4. Replace `DATABASE_URL` in `.env` with the hosted connection string.
5. Run the same Prisma commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

No Docker is required when using hosted Postgres. Use demo/seed data only until auth and database mode are fully connected to the app. Never commit `.env`.

Fresh production builds may require network access because `next/font/google` fetches optimized font assets during build.

## Scripts

- `npm run dev` - start the local development server
- `npm run check` - run Biome checks
- `npm run build` - create a production build
- `npm run db:generate` - generate Prisma Client
- `npm run db:migrate` - run Prisma migrations in development
- `npm run db:seed` - seed the local database
- `npm run db:studio` - open Prisma Studio

## Roadmap

- Connect finance pages to database mode
- Real authentication
- Import localStorage data into the database
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
