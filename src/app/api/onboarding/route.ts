import { NextResponse } from "next/server";

import { isDatabaseMode } from "@/config/papero-mode";

export async function POST(request: Request) {
  if (!isDatabaseMode()) {
    return NextResponse.json({ error: "Onboarding is disabled in this Papero data mode." }, { status: 404 });
  }

  const [{ ActiveCompanyError, UnauthorizedError }, onboarding] = await Promise.all([
    import("@/server/auth/active-company"),
    import("@/server/onboarding/onboarding-service"),
  ]);

  try {
    const input = await request.json();
    const result = await onboarding.completeCompanyOnboarding(request.headers, input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof onboarding.OnboardingForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ActiveCompanyError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof onboarding.OnboardingValidationError) {
      return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    return NextResponse.json({ error: "Papero could not finish onboarding. Please try again." }, { status: 500 });
  }
}
