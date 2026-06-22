import { NextResponse } from "next/server";

import { ActiveCompanyError, getActiveCompanyContext, UnauthorizedError } from "@/server/auth/active-company";
import {
  createFinanceContact,
  type FinanceContactType,
  FinanceContactValidationError,
  listFinanceContacts,
} from "@/server/finance/contacts-repository";

function getContactTypeFromRequest(request: Request): FinanceContactType | undefined {
  const type = new URL(request.url).searchParams.get("type");
  return type === "customer" || type === "supplier" ? type : undefined;
}

function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof FinanceContactValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof ActiveCompanyError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ error: "Unexpected error while handling finance contacts." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { companyId } = await getActiveCompanyContext(request.headers);
    const contacts = await listFinanceContacts(companyId, getContactTypeFromRequest(request));

    return NextResponse.json({ contacts });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await getActiveCompanyContext(request.headers);
    const input = await request.json();
    const { contact, created } = await createFinanceContact(companyId, input);

    return NextResponse.json({ contact }, { status: created ? 201 : 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
