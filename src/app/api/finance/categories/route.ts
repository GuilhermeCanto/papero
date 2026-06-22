import { NextResponse } from "next/server";

import { ActiveCompanyError, getActiveCompanyContext, UnauthorizedError } from "@/server/auth/active-company";
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
    const { companyId } = await getActiveCompanyContext(request.headers);
    const categories = await listFinanceCategories(companyId);

    return NextResponse.json({ categories });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await getActiveCompanyContext(request.headers);
    const input = await request.json();
    const category = await createFinanceCategory(companyId, input);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
