import { NextResponse } from "next/server";

import { isDatabaseMode } from "@/config/papero-mode";

function authDisabledResponse() {
  return NextResponse.json({ error: "Authentication is disabled in this Papero data mode." }, { status: 404 });
}

async function handleAuthRequest(request: Request, method: "GET" | "POST") {
  if (!isDatabaseMode()) {
    return authDisabledResponse();
  }

  const [{ toNextJsHandler }, { auth }] = await Promise.all([
    import("better-auth/next-js"),
    import("@/server/auth/auth"),
  ]);
  const handlers = toNextJsHandler(auth);

  return handlers[method](request);
}

export function GET(request: Request) {
  return handleAuthRequest(request, "GET");
}

export function POST(request: Request) {
  return handleAuthRequest(request, "POST");
}
