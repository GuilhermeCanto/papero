import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

import { prisma } from "@/server/db/prisma";

const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
const trustedOrigins = [process.env.NEXT_PUBLIC_APP_URL, process.env.BETTER_AUTH_URL, process.env.AUTH_URL].filter(
  Boolean,
) as string[];

export const auth = betterAuth({
  baseURL: authBaseUrl,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  trustedOrigins,
});
