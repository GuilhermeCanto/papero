import { NextResponse } from "next/server";

import { ActiveCompanyError, getActiveCompanyContext, UnauthorizedError } from "@/server/auth/active-company";
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
    const { companyId } = await getActiveCompanyContext(request.headers);
    const { id } = await params;
    const input = await request.json();
    const category = await updateFinanceCategory(companyId, id, input);

    return NextResponse.json({ category });
  } catch (error) {
    return toErrorResponse(error);
  }
}
