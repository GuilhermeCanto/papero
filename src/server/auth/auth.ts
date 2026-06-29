import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

import { prisma } from "@/server/db/prisma";

const knownWeakSecrets = new Set([
  "replace-me-with-a-long-random-secret-before-production",
  "better-auth-secret-12345678901234567890",
]);

const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;

if (!authSecret || knownWeakSecrets.has(authSecret)) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set to a unique high-entropy value. Generate one with: openssl rand -base64 32",
  );
}

const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;

if (!authBaseUrl) {
  throw new Error("BETTER_AUTH_URL must be set to the app's public URL.");
}

const trustedOrigins = Array.from(
  new Set([authBaseUrl, process.env.NEXT_PUBLIC_APP_URL].filter((origin): origin is string => Boolean(origin))),
);

export const auth = betterAuth({
  baseURL: authBaseUrl,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    enabled: true,
    max: 10,
    storage: "memory",
    window: 60,
  },
  secret: authSecret,
  trustedOrigins,
});
