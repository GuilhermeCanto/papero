import { NextResponse } from "next/server";

import { isDatabaseMode } from "@/config/papero-mode";

export async function POST(request: Request) {
  if (!isDatabaseMode()) {
    return NextResponse.json({ error: "Authentication is disabled in this Papero data mode." }, { status: 404 });
  }

  const [{ auth }, { ensureDefaultCompanyForUser }] = await Promise.all([
    import("@/server/auth/auth"),
    import("@/server/auth/company-bootstrap"),
  ]);
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const company = await ensureDefaultCompanyForUser(session.user);

  return NextResponse.json({ company });
}
