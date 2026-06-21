import { NextResponse } from "next/server";

import { ActiveCompanyError, getActiveCompanyContext, UnauthorizedError } from "@/server/auth/active-company";
import {
  FinanceAccountNotFoundError,
  FinanceAccountValidationError,
  updateFinanceAccount,
} from "@/server/finance/accounts-repository";

function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof FinanceAccountValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof ActiveCompanyError || error instanceof FinanceAccountNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: "Unexpected error while handling finance account." }, { status: 500 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await getActiveCompanyContext(request.headers);
    const { id } = await params;
    const input = await request.json();
    const account = await updateFinanceAccount(companyId, id, input);

    return NextResponse.json({ account });
  } catch (error) {
    return toErrorResponse(error);
  }
}
