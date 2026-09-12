import type { CompanyRole, Prisma } from "@prisma/client";
import { z } from "zod";

import { type OnboardingRequest, onboardingRequestSchema, parseDateOnly, parseMoneyToCents } from "@/lib/onboarding";
import { getActiveCompanyContext } from "@/server/auth/active-company";
import { prisma } from "@/server/db/prisma";

export class OnboardingForbiddenError extends Error {
  constructor(message = "Only a workspace owner can complete onboarding.") {
    super(message);
    this.name = "OnboardingForbiddenError";
  }
}

export class OnboardingValidationError extends Error {
  fieldErrors?: Record<string, string[] | undefined>;

  constructor(message: string, fieldErrors?: Record<string, string[] | undefined>) {
    super(message);
    this.name = "OnboardingValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export type CompanyOnboardingState = {
  account: {
    institution: string;
    name: string;
    openingBalanceCents: number;
  };
  companyName: string;
  needsOnboarding: boolean;
  role: CompanyRole;
};

async function findInitialAccount(companyId: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
  return client.bankAccount.findFirst({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      bankName: true,
      id: true,
      initialBalanceCents: true,
      name: true,
    },
    where: { companyId },
  });
}

async function createInitialAccount(companyId: string, client: Prisma.TransactionClient) {
  return client.bankAccount.create({
    data: {
      cashFlowRole: "OPERATING",
      companyId,
      currency: "BRL",
      initialBalanceCents: 0,
      name: "Main Account",
      type: "CHECKING",
    },
    select: {
      bankName: true,
      id: true,
      initialBalanceCents: true,
      name: true,
    },
  });
}

export async function getCompanyOnboardingState(headers: Headers): Promise<CompanyOnboardingState> {
  const context = await getActiveCompanyContext(headers);
  const [company, account] = await Promise.all([
    prisma.company.findUnique({
      select: { name: true, onboardingCompletedAt: true },
      where: { id: context.companyId },
    }),
    findInitialAccount(context.companyId),
  ]);

  if (!company) {
    throw new OnboardingValidationError("Workspace was not found.");
  }

  return {
    account: {
      institution: account?.bankName ?? "",
      name: account?.name ?? "Main Account",
      openingBalanceCents: account?.initialBalanceCents ?? 0,
    },
    companyName: company.name,
    needsOnboarding: context.role === "OWNER" && company.onboardingCompletedAt === null,
    role: context.role,
  };
}

function parseRequest(input: unknown): OnboardingRequest {
  const result = onboardingRequestSchema.safeParse(input);
  if (result.success) return result.data;

  throw new OnboardingValidationError(
    "Check the highlighted fields and try again.",
    z.flattenError(result.error).fieldErrors,
  );
}

export async function completeCompanyOnboarding(headers: Headers, input: unknown) {
  const context = await getActiveCompanyContext(headers);
  if (context.role !== "OWNER") throw new OnboardingForbiddenError();

  const request = parseRequest(input);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Company" WHERE "id" = ${context.companyId} FOR UPDATE`;

    const [company, membership] = await Promise.all([
      tx.company.findUnique({
        select: { onboardingCompletedAt: true },
        where: { id: context.companyId },
      }),
      tx.companyMember.findUnique({
        select: { role: true },
        where: { userId_companyId: { companyId: context.companyId, userId: context.userId } },
      }),
    ]);

    if (!company) throw new OnboardingValidationError("Workspace was not found.");
    if (membership?.role !== "OWNER") throw new OnboardingForbiddenError();

    // A retried request becomes a no-op after the first transaction commits.
    if (company.onboardingCompletedAt) return { completed: true, createdTransaction: false };

    if (request.action === "skip") {
      await tx.company.update({
        data: { onboardingCompletedAt: new Date() },
        where: { id: context.companyId },
      });
      return { completed: true, createdTransaction: false };
    }

    const account =
      (await findInitialAccount(context.companyId, tx)) ?? (await createInitialAccount(context.companyId, tx));
    const openingBalanceCents = parseMoneyToCents(request.openingBalance);
    if (openingBalanceCents === null) throw new OnboardingValidationError("Opening balance is invalid.");

    await Promise.all([
      tx.company.update({
        data: { name: request.workspaceName },
        where: { id: context.companyId },
      }),
      tx.bankAccount.update({
        data: {
          archived: false,
          bankName: request.institution || null,
          cashFlowRole: "OPERATING",
          currency: "BRL",
          initialBalanceCents: openingBalanceCents,
          name: request.accountName,
        },
        where: { id: account.id },
      }),
    ]);

    if (request.addTransaction) {
      const amountCents = parseMoneyToCents(request.transactionAmount);
      const date = parseDateOnly(request.transactionDate);
      if (!amountCents || !date) throw new OnboardingValidationError("Planned transaction is invalid.");

      await tx.transaction.create({
        data: {
          amountCents,
          bankAccountId: account.id,
          companyId: context.companyId,
          date,
          description: request.transactionDescription.trim(),
          kind: request.transactionKind === "income" ? "INCOME" : "VARIABLE",
          paid: false,
          paymentTime: "CASH",
          tags: [],
        },
      });
    }

    await tx.company.update({
      data: { onboardingCompletedAt: new Date() },
      where: { id: context.companyId },
    });

    return { completed: true, createdTransaction: request.addTransaction };
  });
}
