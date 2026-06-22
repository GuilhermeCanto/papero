"use server";

import { cookies } from "next/headers";

// The cookie name should match the one in src/i18n/request.ts
const COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || "pt";
}

export async function setUserLocale(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale, {
    // Cookie options
    path: "/",
    maxAge: 31536000, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
