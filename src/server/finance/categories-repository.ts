import { type Category, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type FinanceCategoryType = "income" | "fixed" | "variable" | "people" | "taxes" | "transfer";

export type FinanceCategoryRecord = {
  id: string;
  name: string;
  type: FinanceCategoryType;
};

export type FinanceCategoryInput = {
  name?: unknown;
  type?: unknown;
};

export class FinanceCategoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceCategoryValidationError";
  }
}

export class FinanceCategoryDuplicateError extends Error {
  constructor(message = "Category already exists.") {
    super(message);
    this.name = "FinanceCategoryDuplicateError";
  }
}

export class FinanceCategoryNotFoundError extends Error {
  constructor(message = "Category was not found.") {
    super(message);
    this.name = "FinanceCategoryNotFoundError";
  }
}

const localToPrismaType = {
  fixed: "FIXED_EXPENSE",
  income: "INCOME",
  people: "PEOPLE",
  taxes: "TAXES",
  transfer: "TRANSFER",
  variable: "VARIABLE_EXPENSE",
} as const satisfies Record<FinanceCategoryType, Category["type"]>;

const prismaToLocalType = {
  FIXED_EXPENSE: "fixed",
  INCOME: "income",
  PEOPLE: "people",
  TAXES: "taxes",
  TRANSFER: "transfer",
  VARIABLE_EXPENSE: "variable",
} as const satisfies Record<Category["type"], FinanceCategoryType>;

function isFinanceCategoryType(value: unknown): value is FinanceCategoryType {
  return (
    value === "income" ||
    value === "fixed" ||
    value === "variable" ||
    value === "people" ||
    value === "taxes" ||
    value === "transfer"
  );
}

function sanitizeName(value: unknown, required: boolean) {
  if (value === undefined || value === null) {
    if (required) throw new FinanceCategoryValidationError("Category name is required.");
    return undefined;
  }

  if (typeof value !== "string") {
    throw new FinanceCategoryValidationError("Category name must be a string.");
  }

  const name = value.trim().replace(/\s+/g, " ");
  if (!name && required) {
    throw new FinanceCategoryValidationError("Category name is required.");
  }

  return name || undefined;
}

function sanitizeCategoryType(value: unknown, required: boolean) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new FinanceCategoryValidationError("Category type is required.");
    return undefined;
  }

  if (!isFinanceCategoryType(value)) {
    throw new FinanceCategoryValidationError("Category type is not supported.");
  }

  return value;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toFinanceCategory(category: Category): FinanceCategoryRecord {
  return {
    id: category.id,
    name: category.name,
    type: prismaToLocalType[category.type],
  };
}

export async function listFinanceCategories(companyId: string) {
  const categories = await prisma.category.findMany({
    orderBy: [
      {
        type: "asc",
      },
      {
        name: "asc",
      },
    ],
    where: {
      companyId,
    },
  });

  return categories.map(toFinanceCategory);
}

export async function createFinanceCategory(companyId: string, input: FinanceCategoryInput) {
  const name = sanitizeName(input.name, true);
  const type = sanitizeCategoryType(input.type, true);

  try {
    const category = await prisma.category.create({
      data: {
        companyId,
        name: name ?? "",
        type: localToPrismaType[type ?? "income"],
      },
    });

    return toFinanceCategory(category);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new FinanceCategoryDuplicateError();
    }

    throw error;
  }
}

export async function updateFinanceCategory(companyId: string, id: string, input: FinanceCategoryInput) {
  const currentCategory = await prisma.category.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      id,
    },
  });

  if (!currentCategory) {
    throw new FinanceCategoryNotFoundError();
  }

  const data: Parameters<typeof prisma.category.update>[0]["data"] = {};
  const name = sanitizeName(input.name, false);
  const type = sanitizeCategoryType(input.type, false);

  if (name !== undefined) data.name = name;
  if (type !== undefined) data.type = localToPrismaType[type];

  try {
    const category = await prisma.category.update({
      data,
      where: {
        id,
      },
    });

    return toFinanceCategory(category);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new FinanceCategoryDuplicateError();
    }

    throw error;
  }
}
