import type { PaymentForm, PaymentTime, Transaction, TransactionKind } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type FinanceTransactionKind = "income" | "fixed" | "variable" | "people" | "taxes" | "transfer";
export type FinanceTransactionPaymentTime = "cash" | "installment" | "recurring";

export type FinanceTransactionRecord = {
  accountId?: string;
  amountCents: number;
  category: string;
  categoryId?: string;
  competenceDate?: string;
  contactId?: string;
  createdAt: string;
  date: string;
  description: string;
  documentNumber?: string;
  from: string;
  id: string;
  kind: FinanceTransactionKind;
  notes?: string;
  paid: boolean;
  paymentMode: string;
  paymentTime: FinanceTransactionPaymentTime;
  paymentType: string;
  tags?: string;
  transferTargetAccountId?: string;
  updatedAt: string;
};

export type FinanceTransactionInput = {
  accountId?: unknown;
  amountCents?: unknown;
  category?: unknown;
  categoryId?: unknown;
  competenceDate?: unknown;
  contactId?: unknown;
  date?: unknown;
  description?: unknown;
  documentNumber?: unknown;
  from?: unknown;
  installmentGroupId?: unknown;
  kind?: unknown;
  notes?: unknown;
  paid?: unknown;
  paymentMode?: unknown;
  paymentTime?: unknown;
  paymentType?: unknown;
  recurrenceGroupId?: unknown;
  tags?: unknown;
  transferTargetAccountId?: unknown;
};

export type FinanceTransactionListFilters = {
  dateFrom?: string;
  dateTo?: string;
  kind?: string;
};

type TransactionWithRelations = Transaction & {
  bankAccount: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  contact: { id: string; name: string } | null;
};

export class FinanceTransactionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceTransactionValidationError";
  }
}

export class FinanceTransactionNotFoundError extends Error {
  constructor(message = "Transaction was not found.") {
    super(message);
    this.name = "FinanceTransactionNotFoundError";
  }
}

const localToPrismaKind = {
  fixed: "FIXED",
  income: "INCOME",
  people: "PEOPLE",
  taxes: "TAXES",
  transfer: "TRANSFER",
  variable: "VARIABLE",
} as const satisfies Record<FinanceTransactionKind, TransactionKind>;

const prismaToLocalKind = {
  FIXED: "fixed",
  INCOME: "income",
  PEOPLE: "people",
  TAXES: "taxes",
  TRANSFER: "transfer",
  VARIABLE: "variable",
} as const satisfies Record<TransactionKind, FinanceTransactionKind>;

const localToPrismaPaymentTime = {
  cash: "CASH",
  installment: "INSTALLMENT",
  recurring: "RECURRING",
} as const satisfies Record<FinanceTransactionPaymentTime, PaymentTime>;

const prismaToLocalPaymentTime = {
  CASH: "cash",
  INSTALLMENT: "installment",
  RECURRING: "recurring",
} as const satisfies Record<PaymentTime, FinanceTransactionPaymentTime>;

const localToPrismaPaymentForm = {
  automatic: "AUTOMATIC",
  bankDeposit: "BANK_DEPOSIT",
  bankTransfer: "BANK_TRANSFER",
  boleto: "BOLETO",
  creditCard: "CREDIT_CARD",
  crypto: "CRYPTO",
  debitCard: "DEBIT_CARD",
  digitalWallet: "DIGITAL_WALLET",
  other: "OTHER",
  paypal: "PAYPAL",
  pix: "PIX",
  stripe: "STRIPE",
  zelle: "ZELLE",
} as const satisfies Record<string, PaymentForm>;

const prismaToLocalPaymentForm = {
  AUTOMATIC: "automatic",
  BANK_DEPOSIT: "bankDeposit",
  BANK_TRANSFER: "bankTransfer",
  BOLETO: "boleto",
  CREDIT_CARD: "creditCard",
  CRYPTO: "crypto",
  DEBIT_CARD: "debitCard",
  DIGITAL_WALLET: "digitalWallet",
  OTHER: "other",
  PAYPAL: "paypal",
  PIX: "pix",
  STRIPE: "stripe",
  ZELLE: "zelle",
} as const satisfies Record<PaymentForm, string>;

type FinanceTransactionPaymentForm = keyof typeof localToPrismaPaymentForm;

function isFinanceTransactionKind(value: unknown): value is FinanceTransactionKind {
  return (
    value === "income" ||
    value === "fixed" ||
    value === "variable" ||
    value === "people" ||
    value === "taxes" ||
    value === "transfer"
  );
}

function isFinanceTransactionPaymentTime(value: unknown): value is FinanceTransactionPaymentTime {
  return value === "cash" || value === "installment" || value === "recurring";
}

function sanitizeString(value: unknown, fieldName: string, required: boolean) {
  if (value === undefined || value === null) {
    if (required) throw new FinanceTransactionValidationError(`${fieldName} is required.`);
    return undefined;
  }

  if (typeof value !== "string") {
    throw new FinanceTransactionValidationError(`${fieldName} must be a string.`);
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized && required) {
    throw new FinanceTransactionValidationError(`${fieldName} is required.`);
  }

  return normalized || undefined;
}

function sanitizeOptionalId(value: unknown, fieldName: string) {
  const id = sanitizeString(value, fieldName, false);
  return id ?? undefined;
}

function sanitizeAmountCents(value: unknown, required: boolean) {
  if (value === undefined || value === null) {
    if (required) throw new FinanceTransactionValidationError("Amount is required.");
    return undefined;
  }

  if (!(typeof value === "number" && Number.isInteger(value))) {
    throw new FinanceTransactionValidationError("Amount must be an integer amount in cents.");
  }

  return value;
}

function sanitizeBoolean(value: unknown, fieldName: string, required: boolean) {
  if (value === undefined || value === null) {
    if (required) throw new FinanceTransactionValidationError(`${fieldName} is required.`);
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new FinanceTransactionValidationError(`${fieldName} must be a boolean.`);
  }

  return value;
}

function sanitizeKind(value: unknown, required: boolean) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new FinanceTransactionValidationError("Transaction kind is required.");
    return undefined;
  }

  if (!isFinanceTransactionKind(value)) {
    throw new FinanceTransactionValidationError("Transaction kind is not supported.");
  }

  return value;
}

function sanitizePaymentTime(value: unknown) {
  if (value === undefined || value === null || value === "") return "cash";
  if (!isFinanceTransactionPaymentTime(value)) {
    throw new FinanceTransactionValidationError("Payment time is not supported.");
  }

  return value;
}

function normalizePaymentForm(value: string) {
  const normalized = value.trim();
  const aliases: Record<string, string> = {
    AUTOMATIC: "automatic",
    BANK_DEPOSIT: "bankDeposit",
    BANK_TRANSFER: "bankTransfer",
    BOLETO: "boleto",
    CREDIT_CARD: "creditCard",
    CRYPTO: "crypto",
    DEBIT_CARD: "debitCard",
    DIGITAL_WALLET: "digitalWallet",
    OTHER: "other",
    PAYPAL: "paypal",
    PIX: "pix",
    STRIPE: "stripe",
    ZELLE: "zelle",
    bank_deposit: "bankDeposit",
    bank_transfer: "bankTransfer",
    credit_card: "creditCard",
    debit_card: "debitCard",
    digital_wallet: "digitalWallet",
  };

  return aliases[normalized] ?? normalized;
}

function isFinanceTransactionPaymentForm(value: string): value is FinanceTransactionPaymentForm {
  return value in localToPrismaPaymentForm;
}

function sanitizePaymentForm(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new FinanceTransactionValidationError("Payment form must be a string.");
  }

  const paymentMode = normalizePaymentForm(value);
  if (!isFinanceTransactionPaymentForm(paymentMode)) {
    throw new FinanceTransactionValidationError("Payment form is not supported.");
  }

  return paymentMode;
}

function sanitizeDate(value: unknown, fieldName: string, required: boolean) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new FinanceTransactionValidationError(`${fieldName} is required.`);
    return undefined;
  }

  if (typeof value !== "string") {
    throw new FinanceTransactionValidationError(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  const date = brazilianDate
    ? new Date(Date.UTC(Number(brazilianDate[3]), Number(brazilianDate[2]) - 1, Number(brazilianDate[1])))
    : new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    throw new FinanceTransactionValidationError(`${fieldName} must be a valid date.`);
  }

  return date;
}

function sanitizeTags(value: unknown) {
  if (value === undefined || value === null || value === "") return [];

  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  throw new FinanceTransactionValidationError("Tags must be a string or an array of strings.");
}

function toIsoDateString(date: Date) {
  return date.toISOString();
}

function paymentTypeFromPaymentTime(paymentTime: FinanceTransactionPaymentTime) {
  if (paymentTime === "installment") return "Parcelado";
  if (paymentTime === "recurring") return "Recorrente";
  return "À vista";
}

function toFinanceTransaction(transaction: TransactionWithRelations): FinanceTransactionRecord {
  const paymentTime = prismaToLocalPaymentTime[transaction.paymentTime];

  return {
    accountId: transaction.bankAccountId ?? undefined,
    amountCents: transaction.amountCents,
    category: transaction.category?.name ?? "",
    categoryId: transaction.categoryId ?? undefined,
    competenceDate: transaction.competenceDate ? toIsoDateString(transaction.competenceDate) : undefined,
    contactId: transaction.contactId ?? undefined,
    createdAt: toIsoDateString(transaction.createdAt),
    date: toIsoDateString(transaction.date),
    description: transaction.description,
    documentNumber: transaction.documentNumber ?? undefined,
    from: transaction.contact?.name ?? "",
    id: transaction.id,
    kind: prismaToLocalKind[transaction.kind],
    notes: transaction.notes ?? undefined,
    paid: transaction.paid,
    paymentMode: transaction.paymentForm ? prismaToLocalPaymentForm[transaction.paymentForm] : "other",
    paymentTime,
    paymentType: paymentTypeFromPaymentTime(paymentTime),
    tags: transaction.tags.join(", "),
    updatedAt: toIsoDateString(transaction.updatedAt),
  };
}

async function validateCategory(companyId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      id: categoryId,
    },
  });

  if (!category) {
    throw new FinanceTransactionValidationError("Category does not belong to the active company.");
  }
}

async function validateContact(companyId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      id: contactId,
    },
  });

  if (!contact) {
    throw new FinanceTransactionValidationError("Contact does not belong to the active company.");
  }
}

async function validateBankAccount(companyId: string, bankAccountId: string) {
  const bankAccount = await prisma.bankAccount.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      id: bankAccountId,
    },
  });

  if (!bankAccount) {
    throw new FinanceTransactionValidationError("Account does not belong to the active company.");
  }
}

async function validateRelations(companyId: string, input: FinanceTransactionInput) {
  const categoryId = sanitizeOptionalId(input.categoryId, "Category ID");
  const contactId = sanitizeOptionalId(input.contactId, "Contact ID");
  const bankAccountId = sanitizeOptionalId(input.accountId, "Account ID");

  await Promise.all([
    categoryId ? validateCategory(companyId, categoryId) : Promise.resolve(),
    contactId ? validateContact(companyId, contactId) : Promise.resolve(),
    bankAccountId ? validateBankAccount(companyId, bankAccountId) : Promise.resolve(),
  ]);

  return {
    bankAccountId,
    categoryId,
    contactId,
  };
}

function getTransactionInclude() {
  return {
    bankAccount: {
      select: {
        id: true,
        name: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
      },
    },
    contact: {
      select: {
        id: true,
        name: true,
      },
    },
  } as const;
}

export async function listFinanceTransactions(companyId: string, filters: FinanceTransactionListFilters = {}) {
  const kind = filters.kind ? sanitizeKind(filters.kind, false) : undefined;
  const dateFrom = filters.dateFrom ? sanitizeDate(filters.dateFrom, "Start date", false) : undefined;
  const dateTo = filters.dateTo ? sanitizeDate(filters.dateTo, "End date", false) : undefined;

  const transactions = await prisma.transaction.findMany({
    include: getTransactionInclude(),
    orderBy: [
      {
        date: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    where: {
      companyId,
      ...(kind ? { kind: localToPrismaKind[kind] } : {}),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
  });

  return transactions.map(toFinanceTransaction);
}

export async function createFinanceTransaction(companyId: string, input: FinanceTransactionInput) {
  const kind = sanitizeKind(input.kind, true);
  const date = sanitizeDate(input.date, "Date", true);
  const paymentTime = sanitizePaymentTime(input.paymentTime);
  const paymentMode = sanitizePaymentForm(input.paymentMode);
  const relations = await validateRelations(companyId, input);

  const transaction = await prisma.transaction.create({
    data: {
      amountCents: sanitizeAmountCents(input.amountCents, true) ?? 0,
      bankAccountId: relations.bankAccountId,
      categoryId: relations.categoryId,
      companyId,
      competenceDate: sanitizeDate(input.competenceDate, "Competence date", false),
      contactId: relations.contactId,
      date: date ?? new Date(),
      description: sanitizeString(input.description, "Description", true) ?? "",
      documentNumber: sanitizeString(input.documentNumber, "Document number", false),
      installmentGroupId: sanitizeString(input.installmentGroupId, "Installment group ID", false),
      kind: localToPrismaKind[kind ?? "variable"],
      notes: sanitizeString(input.notes, "Notes", false),
      paid: sanitizeBoolean(input.paid, "Paid", false) ?? false,
      paymentForm: paymentMode ? localToPrismaPaymentForm[paymentMode] : undefined,
      paymentTime: localToPrismaPaymentTime[paymentTime],
      recurrenceGroupId: sanitizeString(input.recurrenceGroupId, "Recurrence group ID", false),
      tags: sanitizeTags(input.tags),
    },
    include: getTransactionInclude(),
  });

  return toFinanceTransaction(transaction);
}

export async function updateFinanceTransaction(companyId: string, id: string, input: FinanceTransactionInput) {
  const currentTransaction = await prisma.transaction.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      id,
    },
  });

  if (!currentTransaction) {
    throw new FinanceTransactionNotFoundError();
  }

  const data: Parameters<typeof prisma.transaction.update>[0]["data"] = {};

  if (input.kind !== undefined) {
    const kind = sanitizeKind(input.kind, false);
    if (kind) data.kind = localToPrismaKind[kind];
  }
  if (input.description !== undefined) data.description = sanitizeString(input.description, "Description", true);
  if (input.amountCents !== undefined) data.amountCents = sanitizeAmountCents(input.amountCents, true);
  if (input.date !== undefined) data.date = sanitizeDate(input.date, "Date", true);
  if (input.competenceDate !== undefined) {
    data.competenceDate = sanitizeDate(input.competenceDate, "Competence date", false) ?? null;
  }
  if (input.paid !== undefined) data.paid = sanitizeBoolean(input.paid, "Paid", true);
  if (input.paymentTime !== undefined) {
    data.paymentTime = localToPrismaPaymentTime[sanitizePaymentTime(input.paymentTime)];
  }
  if (input.paymentMode !== undefined) {
    const paymentMode = sanitizePaymentForm(input.paymentMode);
    data.paymentForm = paymentMode ? localToPrismaPaymentForm[paymentMode] : null;
  }
  if (input.documentNumber !== undefined) {
    data.documentNumber = sanitizeString(input.documentNumber, "Document number", false) ?? null;
  }
  if (input.notes !== undefined) data.notes = sanitizeString(input.notes, "Notes", false) ?? null;
  if (input.installmentGroupId !== undefined) {
    data.installmentGroupId = sanitizeString(input.installmentGroupId, "Installment group ID", false) ?? null;
  }
  if (input.recurrenceGroupId !== undefined) {
    data.recurrenceGroupId = sanitizeString(input.recurrenceGroupId, "Recurrence group ID", false) ?? null;
  }
  if (input.tags !== undefined) data.tags = sanitizeTags(input.tags);

  if (input.categoryId !== undefined || input.contactId !== undefined || input.accountId !== undefined) {
    const relations = await validateRelations(companyId, input);
    if (input.categoryId !== undefined) data.categoryId = relations.categoryId ?? null;
    if (input.contactId !== undefined) data.contactId = relations.contactId ?? null;
    if (input.accountId !== undefined) data.bankAccountId = relations.bankAccountId ?? null;
  }

  const transaction = await prisma.transaction.update({
    data,
    include: getTransactionInclude(),
    where: {
      id,
    },
  });

  return toFinanceTransaction(transaction);
}

export async function deleteFinanceTransaction(companyId: string, id: string) {
  const currentTransaction = await prisma.transaction.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      id,
    },
  });

  if (!currentTransaction) {
    throw new FinanceTransactionNotFoundError();
  }

  await prisma.transaction.delete({
    where: {
      id,
    },
  });
}
