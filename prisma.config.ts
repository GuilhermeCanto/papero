import "dotenv/config";

import { defineConfig, env } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.argv.includes("generate")
    ? "postgresql://papero:papero@localhost:5432/papero?schema=public"
    : env("DATABASE_URL"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node -P tsconfig.scripts.json prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
