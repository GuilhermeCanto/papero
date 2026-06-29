import { type NextRequest, NextResponse } from "next/server";

type PaperoServerDataMode = "local" | "demo" | "database";

const validPaperoServerDataModes = new Set<PaperoServerDataMode>(["local", "demo", "database"]);

function normalizePaperoDataMode(value: string | undefined): PaperoServerDataMode | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();

  return validPaperoServerDataModes.has(normalized as PaperoServerDataMode)
    ? (normalized as PaperoServerDataMode)
    : null;
}

function getServerPaperoDataMode(): PaperoServerDataMode {
  const serverMode = normalizePaperoDataMode(process.env.PAPERO_DATA_MODE);
  const publicMode = normalizePaperoDataMode(process.env.NEXT_PUBLIC_PAPERO_DATA_MODE);

  if (publicMode === "local" || publicMode === "demo") {
    return publicMode;
  }

  if (serverMode === "database") {
    return "database";
  }

  return serverMode ?? publicMode ?? "local";
}

function setDebugHeaders(response: NextResponse, mode: PaperoServerDataMode) {
  if (process.env.NODE_ENV !== "production") {
    response.headers.set("x-papero-data-mode", mode);
    response.headers.set("x-papero-proxy", "true");
  }

  return response;
}

function continueWithoutAuth(mode: PaperoServerDataMode) {
  return setDebugHeaders(NextResponse.next(), mode);
}

function redirectWithDebug(url: URL, mode: PaperoServerDataMode) {
  return setDebugHeaders(NextResponse.redirect(url), mode);
}

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isAuthV2Path(pathname: string) {
  return pathname === "/auth/v2/login" || pathname === "/auth/v2/register";
}

export async function proxy(request: NextRequest) {
  const mode = getServerPaperoDataMode();

  if (mode !== "database") {
    return continueWithoutAuth(mode);
  }

  const pathname = request.nextUrl.pathname;

  if (!(isDashboardPath(pathname) || isAuthV2Path(pathname))) {
    return continueWithoutAuth(mode);
  }

  const { auth } = await import("@/server/auth/auth");
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const isAuthenticated = Boolean(session?.user);

  if (isDashboardPath(pathname) && !isAuthenticated) {
    return redirectWithDebug(new URL("/auth/v2/login", request.url), mode);
  }

  if (isAuthV2Path(pathname) && isAuthenticated) {
    return redirectWithDebug(new URL("/dashboard/finance", request.url), mode);
  }

  return continueWithoutAuth(mode);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
