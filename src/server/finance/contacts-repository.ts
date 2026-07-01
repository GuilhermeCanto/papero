import type { Contact } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type FinanceContactType = "customer" | "supplier";

export type FinanceContactRecord = {
  address?: string;
  id: string;
  name: string;
  taxId?: string;
  type: FinanceContactType;
  website?: string;
};

export type FinanceContactInput = {
  address?: unknown;
  name?: unknown;
  taxId?: unknown;
  type?: unknown;
  website?: unknown;
};

export class FinanceContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceContactValidationError";
  }
}

export class FinanceContactNotFoundError extends Error {
  constructor(message = "Contact was not found.") {
    super(message);
    this.name = "FinanceContactNotFoundError";
  }
}

const localToPrismaType = {
  customer: "CUSTOMER",
  supplier: "SUPPLIER",
} as const satisfies Record<FinanceContactType, Contact["type"]>;

const prismaToLocalType = {
  CUSTOMER: "customer",
  SUPPLIER: "supplier",
} as const satisfies Record<Contact["type"], FinanceContactType>;

function isFinanceContactType(value: unknown): value is FinanceContactType {
  return value === "customer" || value === "supplier";
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function sanitizeName(value: unknown, required: boolean) {
  if (value === undefined || value === null) {
    if (required) throw new FinanceContactValidationError("Contact name is required.");
    return undefined;
  }

  if (typeof value !== "string") {
    throw new FinanceContactValidationError("Contact name must be a string.");
  }

  const name = normalizeText(value);
  if (!name && required) {
    throw new FinanceContactValidationError("Contact name is required.");
  }

  return name || undefined;
}

function sanitizeContactType(value: unknown, required: boolean) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new FinanceContactValidationError("Contact type is required.");
    return undefined;
  }

  if (!isFinanceContactType(value)) {
    throw new FinanceContactValidationError("Contact type is not supported.");
  }

  return value;
}

function sanitizeOptionalString(value: unknown, fieldName: string) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new FinanceContactValidationError(`${fieldName} must be a string.`);
  }

  return normalizeText(value) || undefined;
}

function toFinanceContact(contact: Contact): FinanceContactRecord {
  return {
    address: contact.address ?? undefined,
    id: contact.id,
    name: contact.name,
    taxId: contact.document ?? undefined,
    type: prismaToLocalType[contact.type],
    website: contact.website ?? undefined,
  };
}

export async function listFinanceContacts(companyId: string, type?: FinanceContactType) {
  const contacts = await prisma.contact.findMany({
    orderBy: {
      name: "asc",
    },
    where: {
      companyId,
      ...(type ? { type: localToPrismaType[type] } : {}),
    },
  });

  return contacts.map(toFinanceContact);
}

export async function createFinanceContact(companyId: string, input: FinanceContactInput) {
  const name = sanitizeName(input.name, true);
  const type = sanitizeContactType(input.type, true);
  const prismaType = localToPrismaType[type ?? "supplier"];

  const existingContact = await prisma.contact.findFirst({
    where: {
      companyId,
      name: {
        equals: name ?? "",
        mode: "insensitive",
      },
      type: prismaType,
    },
  });

  if (existingContact) {
    return {
      contact: toFinanceContact(existingContact),
      created: false,
    };
  }

  const contact = await prisma.contact.create({
    data: {
      address: sanitizeOptionalString(input.address, "Address"),
      companyId,
      document: sanitizeOptionalString(input.taxId, "Tax ID"),
      name: name ?? "",
      type: prismaType,
      website: sanitizeOptionalString(input.website, "Website"),
    },
  });

  return {
    contact: toFinanceContact(contact),
    created: true,
  };
}

export async function updateFinanceContact(companyId: string, id: string, input: FinanceContactInput) {
  const currentContact = await prisma.contact.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      id,
    },
  });

  if (!currentContact) {
    throw new FinanceContactNotFoundError();
  }

  const data: Parameters<typeof prisma.contact.update>[0]["data"] = {};
  const name = sanitizeName(input.name, false);
  const type = sanitizeContactType(input.type, false);

  if (name !== undefined) data.name = name;
  if (type !== undefined) data.type = localToPrismaType[type];
  if (input.taxId !== undefined) data.document = sanitizeOptionalString(input.taxId, "Tax ID") ?? null;
  if (input.address !== undefined) data.address = sanitizeOptionalString(input.address, "Address") ?? null;
  if (input.website !== undefined) data.website = sanitizeOptionalString(input.website, "Website") ?? null;

  const updateResult = await prisma.contact.updateMany({
    data,
    where: {
      companyId,
      id,
    },
  });

  if (updateResult.count !== 1) {
    throw new FinanceContactNotFoundError();
  }

  const contact = await prisma.contact.findFirst({
    where: {
      companyId,
      id,
    },
  });

  if (!contact) {
    throw new FinanceContactNotFoundError();
  }

  return toFinanceContact(contact);
}
