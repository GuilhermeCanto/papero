import { NextResponse } from "next/server";

import { auth } from "@/server/auth/auth";
import { ensureDefaultCompanyForUser } from "@/server/auth/company-bootstrap";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const company = await ensureDefaultCompanyForUser(session.user);

  return NextResponse.json({ company });
}
