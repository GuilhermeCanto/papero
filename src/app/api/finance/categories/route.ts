import { NextResponse } from "next/server";

import { ActiveCompanyError, UnauthorizedError } from "@/server/auth/active-company";
import {
  BILLING_ACCESS_REQUIRED_CODE,
  BillingAccessRequiredError,
  requireActiveCompanyFinanceAccess,
} from "@/server/billing/finance-access";
import {
  createFinanceCategory,
  FinanceCategoryDuplicateError,
  FinanceCategoryValidationError,
  listFinanceCategories,
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

  if (error instanceof ActiveCompanyError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: "Unexpected error while handling finance categories." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { companyId } = await requireActiveCompanyFinanceAccess(request.headers);
    const categories = await listFinanceCategories(companyId);

    return NextResponse.json({ categories });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireActiveCompanyFinanceAccess(request.headers);
    const input = await request.json();
    const category = await createFinanceCategory(companyId, input);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
