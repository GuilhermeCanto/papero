import { NextResponse } from "next/server";

import { isDatabaseMode } from "@/config/papero-mode";

export async function POST(request: Request) {
  if (!isDatabaseMode()) {
    return NextResponse.json(
      { error: "Stripe Customer Portal is disabled in this Papero data mode." },
      { status: 404 },
    );
  }

  const [{ ActiveCompanyError, UnauthorizedError }, billing] = await Promise.all([
    import("@/server/auth/active-company"),
    import("@/server/billing/stripe-billing-service"),
  ]);

  try {
    return NextResponse.json(await billing.createPortalSession(request.headers));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof billing.BillingForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ActiveCompanyError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof billing.BillingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof billing.StripeBillingConfigurationError) {
      return NextResponse.json({ error: "Stripe billing is not configured for this deployment." }, { status: 503 });
    }

    return NextResponse.json({ error: "Papero could not open billing management. Please try again." }, { status: 500 });
  }
}
