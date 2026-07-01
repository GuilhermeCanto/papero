import type { BankAccount } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type FinanceAccountType = "cash" | "checking" | "credit_card" | "investment" | "other" | "savings" | "wallet";
export type FinanceAccountCashFlowRole = "operating" | "reserve";

export type FinanceAccountRecord = {
  archived: boolean;
  cashFlowRole: FinanceAccountCashFlowRole;
  createdAt: string;
  currency: string;
  id: string;
  institution?: string;
  name: string;
  openingBalanceCents: number;
  type: FinanceAccountType;
  updatedAt: string;
};

export type FinanceAccountInput = {
  archived?: unknown;
  cashFlowRole?: unknown;
  currency?: unknown;
  institution?: unknown;
  name?: unknown;
  openingBalanceCents?: unknown;
  type?: unknown;
};

export class FinanceAccountValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceAccountValidationError";
  }
}

export class FinanceAccountNotFoundError extends Error {
  constructor(message = "Account was not found.") {
    super(message);
    this.name = "FinanceAccountNotFoundError";
  }
}

const localToPrismaType = {
  cash: "CASH",
  checking: "CHECKING",
  credit_card: "CREDIT_CARD",
  investment: "INVESTMENT",
  other: "OTHER",
  savings: "SAVINGS",
  wallet: "WALLET",
} as const satisfies Record<FinanceAccountType, BankAccount["type"]>;

const prismaToLocalType = {
  CASH: "cash",
  CHECKING: "checking",
  CREDIT_CARD: "credit_card",
  INVESTMENT: "investment",
  OTHER: "other",
  SAVINGS: "savings",
  WALLET: "wallet",
} as const satisfies Record<BankAccount["type"], FinanceAccountType>;

const localToPrismaCashFlowRole = {
  operating: "OPERATING",
  reserve: "RESERVE",
} as const satisfies Record<FinanceAccountCashFlowRole, BankAccount["cashFlowRole"]>;

const prismaToLocalCashFlowRole = {
  OPERATING: "operating",
  RESERVE: "reserve",
} as const satisfies Record<BankAccount["cashFlowRole"], FinanceAccountCashFlowRole>;

function isFinanceAccountType(value: unknown): value is FinanceAccountType {
  return (
    value === "cash" ||
    value === "checking" ||
    value === "credit_card" ||
    value === "investment" ||
    value === "other" ||
    value === "savings" ||
    value === "wallet"
  );
}

function isFinanceAccountCashFlowRole(value: unknown): value is FinanceAccountCashFlowRole {
  return value === "operating" || value === "reserve";
}

function sanitizeOptionalString(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new FinanceAccountValidationError("Expected a string value.");
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function sanitizeCurrency(value: unknown) {
  if (value === undefined || value === null || value === "") return "BRL";
  if (typeof value !== "string") {
    throw new FinanceAccountValidationError("Currency must be a string.");
  }

  const currency = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new FinanceAccountValidationError("Currency must be a three-letter code.");
  }

  return currency;
}

function sanitizeOpeningBalanceCents(value: unknown) {
  if (value === undefined || value === null) return 0;
  if (!(typeof value === "number" && Number.isInteger(value))) {
    throw new FinanceAccountValidationError("Opening balance must be an integer amount in cents.");
  }

  return value;
}

function sanitizeArchived(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new FinanceAccountValidationError("Archived must be a boolean.");
  }

  return value;
}

function sanitizeAccountType(value: unknown) {
  if (value === undefined || value === null || value === "") return "checking";
  if (!isFinanceAccountType(value)) {
    throw new FinanceAccountValidationError("Account type is not supported.");
  }

  return value;
}

function sanitizeCashFlowRole(value: unknown) {
  if (value === undefined || value === null || value === "") return "operating";
  if (!isFinanceAccountCashFlowRole(value)) {
    throw new FinanceAccountValidationError("Account cash flow role is not supported.");
  }

  return value;
}

function sanitizeName(value: unknown, required: boolean) {
  if (value === undefined || value === null) {
    if (required) throw new FinanceAccountValidationError("Account name is required.");
    return undefined;
  }

  if (typeof value !== "string") {
    throw new FinanceAccountValidationError("Account name must be a string.");
  }

  const name = value.trim().replace(/\s+/g, " ");
  if (!name && required) {
    throw new FinanceAccountValidationError("Account name is required.");
  }

  return name || undefined;
}

function toFinanceAccount(account: BankAccount): FinanceAccountRecord {
  return {
    archived: account.archived,
    cashFlowRole: prismaToLocalCashFlowRole[account.cashFlowRole],
    createdAt: account.createdAt.toISOString(),
    currency: account.currency,
    id: account.id,
    institution: account.bankName ?? undefined,
    name: account.name,
    openingBalanceCents: account.initialBalanceCents,
    type: prismaToLocalType[account.type],
    updatedAt: account.updatedAt.toISOString(),
  };
}

export async function listFinanceAccounts(companyId: string) {
  const accounts = await prisma.bankAccount.findMany({
    orderBy: {
      createdAt: "asc",
    },
    where: {
      companyId,
    },
  });

  return accounts.map(toFinanceAccount);
}

export async function createFinanceAccount(companyId: string, input: FinanceAccountInput) {
  const name = sanitizeName(input.name, true);
  const type = sanitizeAccountType(input.type);
  const cashFlowRole = sanitizeCashFlowRole(input.cashFlowRole);

  const account = await prisma.bankAccount.create({
    data: {
      archived: sanitizeArchived(input.archived) ?? false,
      bankName: sanitizeOptionalString(input.institution),
      companyId,
      currency: sanitizeCurrency(input.currency),
      initialBalanceCents: sanitizeOpeningBalanceCents(input.openingBalanceCents),
      name: name ?? "",
      cashFlowRole: localToPrismaCashFlowRole[cashFlowRole],
      type: localToPrismaType[type],
    },
  });

  return toFinanceAccount(account);
}

export async function updateFinanceAccount(companyId: string, id: string, input: FinanceAccountInput) {
  const currentAccount = await prisma.bankAccount.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      id,
    },
  });

  if (!currentAccount) {
    throw new FinanceAccountNotFoundError();
  }

  const data: Parameters<typeof prisma.bankAccount.update>[0]["data"] = {};
  const name = sanitizeName(input.name, false);
  const institution = sanitizeOptionalString(input.institution);
  const archived = sanitizeArchived(input.archived);

  if (name !== undefined) data.name = name;
  if (input.institution !== undefined) data.bankName = institution ?? null;
  if (input.currency !== undefined) data.currency = sanitizeCurrency(input.currency);
  if (input.openingBalanceCents !== undefined) {
    data.initialBalanceCents = sanitizeOpeningBalanceCents(input.openingBalanceCents);
  }
  if (input.type !== undefined) {
    data.type = localToPrismaType[sanitizeAccountType(input.type)];
  }
  if (input.cashFlowRole !== undefined) {
    data.cashFlowRole = localToPrismaCashFlowRole[sanitizeCashFlowRole(input.cashFlowRole)];
  }
  if (archived !== undefined) data.archived = archived;

  const updateResult = await prisma.bankAccount.updateMany({
    data,
    where: {
      companyId,
      id,
    },
  });

  if (updateResult.count !== 1) {
    throw new FinanceAccountNotFoundError();
  }

  const account = await prisma.bankAccount.findFirst({
    where: {
      companyId,
      id,
    },
  });

  if (!account) {
    throw new FinanceAccountNotFoundError();
  }

  return toFinanceAccount(account);
}

export async function archiveFinanceAccount(companyId: string, id: string) {
  return updateFinanceAccount(companyId, id, { archived: true });
}
