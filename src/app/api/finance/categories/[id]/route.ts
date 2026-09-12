import { NextResponse } from "next/server";

import { ActiveCompanyError, UnauthorizedError } from "@/server/auth/active-company";
import {
  BILLING_ACCESS_REQUIRED_CODE,
  BillingAccessRequiredError,
  requireActiveCompanyFinanceAccess,
} from "@/server/billing/finance-access";
import {
  FinanceCategoryDuplicateError,
  FinanceCategoryNotFoundError,
  FinanceCategoryValidationError,
  updateFinanceCategory,
} from "@/server/finance/categories-repository";

function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof BillingAccessRequiredError) {
    return NextResponse.json({ code: BILLING_ACCESS_REQUIRED_CODE, error: error.message }, { status: 402 });
  }

  if (error instanceof FinanceCategoryValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof FinanceCategoryDuplicateError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof ActiveCompanyError || error instanceof FinanceCategoryNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: "Unexpected error while handling finance category." }, { status: 500 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireActiveCompanyFinanceAccess(request.headers);
    const { id } = await params;
    const input = await request.json();
    const category = await updateFinanceCategory(companyId, id, input);

    return NextResponse.json({ category });
  } catch (error) {
    return toErrorResponse(error);
  }
}
