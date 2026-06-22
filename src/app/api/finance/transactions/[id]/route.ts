import { NextResponse } from "next/server";

import { ActiveCompanyError, getActiveCompanyContext, UnauthorizedError } from "@/server/auth/active-company";
import {
  deleteFinanceTransaction,
  FinanceTransactionNotFoundError,
  FinanceTransactionValidationError,
  updateFinanceTransaction,
} from "@/server/finance/transactions-repository";

function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof FinanceTransactionValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof ActiveCompanyError || error instanceof FinanceTransactionNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: "Unexpected error while handling finance transaction." }, { status: 500 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await getActiveCompanyContext(request.headers);
    const { id } = await params;
    const input = await request.json();
    const transaction = await updateFinanceTransaction(companyId, id, input);

    return NextResponse.json({ transaction });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await getActiveCompanyContext(request.headers);
    const { id } = await params;
    await deleteFinanceTransaction(companyId, id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
