import { NextResponse } from "next/server";

import { ActiveCompanyError, UnauthorizedError } from "@/server/auth/active-company";
import {
  BILLING_ACCESS_REQUIRED_CODE,
  BillingAccessRequiredError,
  requireActiveCompanyFinanceAccess,
} from "@/server/billing/finance-access";
import {
  createFinanceTransaction,
  FinanceTransactionValidationError,
  listFinanceTransactions,
} from "@/server/finance/transactions-repository";

function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof BillingAccessRequiredError) {
    return NextResponse.json({ code: BILLING_ACCESS_REQUIRED_CODE, error: error.message }, { status: 402 });
  }

  if (error instanceof FinanceTransactionValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof ActiveCompanyError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: "Unexpected error while handling finance transactions." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { companyId } = await requireActiveCompanyFinanceAccess(request.headers);
    const { searchParams } = new URL(request.url);
    const transactions = await listFinanceTransactions(companyId, {
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      kind: searchParams.get("kind") ?? undefined,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireActiveCompanyFinanceAccess(request.headers);
    const input = await request.json();
    const transaction = await createFinanceTransaction(companyId, input);

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
