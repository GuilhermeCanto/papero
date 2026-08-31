"use client";

import { createAuthClient } from "better-auth/react";

// Keep browser auth requests same-origin so custom and Vercel domains receive
// their own host-scoped session cookie.
export const authClient = createAuthClient();
