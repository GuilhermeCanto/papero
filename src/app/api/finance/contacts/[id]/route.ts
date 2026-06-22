import { NextResponse } from "next/server";

import { ActiveCompanyError, getActiveCompanyContext, UnauthorizedError } from "@/server/auth/active-company";
import {
  FinanceContactNotFoundError,
  FinanceContactValidationError,
  updateFinanceContact,
} from "@/server/finance/contacts-repository";

function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof FinanceContactValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof ActiveCompanyError || error instanceof FinanceContactNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: "Unexpected error while handling finance contact." }, { status: 500 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await getActiveCompanyContext(request.headers);
    const { id } = await params;
    const input = await request.json();
    const contact = await updateFinanceContact(companyId, id, input);

    return NextResponse.json({ contact });
  } catch (error) {
    return toErrorResponse(error);
  }
}
