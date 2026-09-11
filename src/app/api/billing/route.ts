import { NextResponse } from "next/server";

import { isDatabaseMode } from "@/config/papero-mode";

export async function GET(request: Request) {
  if (!isDatabaseMode()) {
    return NextResponse.json({ error: "Billing is disabled in this Papero data mode." }, { status: 404 });
  }

  try {
    const [activeCompany, { getBillingEntitlements }, { getCompanyBillingState }] = await Promise.all([
      import("@/server/auth/active-company"),
      import("@/server/billing/billing-entitlements"),
      import("@/server/billing/billing-repository"),
    ]);
    const { companyId } = await activeCompany.getActiveCompanyContext(request.headers);
    const billing = await getCompanyBillingState(companyId);

    return NextResponse.json({
      billing,
      entitlements: getBillingEntitlements(billing),
    });
  } catch (error) {
    const { ActiveCompanyError, UnauthorizedError } = await import("@/server/auth/active-company");

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ActiveCompanyError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Unexpected error while reading billing status." }, { status: 500 });
  }
}
