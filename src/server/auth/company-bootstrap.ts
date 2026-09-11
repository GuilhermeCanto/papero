import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

async function ensureInitialBankAccount(companyId: string, client: Prisma.TransactionClient) {
  await client.$queryRaw`SELECT "id" FROM "Company" WHERE "id" = ${companyId} FOR UPDATE`;

  const existingAccount = await client.bankAccount.findFirst({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
    },
    where: {
      companyId,
    },
  });

  if (existingAccount) {
    return existingAccount;
  }

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
      id: true,
    },
  });
}

export async function ensureDefaultCompanyForUser(user: { id: string; name?: string | null }) {
  const companyName = user.name?.trim() ? `${user.name.trim()}'s workspace` : "My workspace";

  const result = await prisma.$transaction(async (tx) => {
    // Serializes retries for the same user so bootstrap cannot create duplicate workspaces.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;

    const existingMembership = await tx.companyMember.findFirst({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        companyId: true,
        id: true,
      },
      where: {
        userId: user.id,
      },
    });

    if (existingMembership) {
      await ensureInitialBankAccount(existingMembership.companyId, tx);

      return {
        companyId: existingMembership.companyId,
        created: false,
        membershipId: existingMembership.id,
      };
    }

    const company = await tx.company.create({
      data: {
        name: companyName,
      },
      select: {
        id: true,
      },
    });

    const membership = await tx.companyMember.create({
      data: {
        companyId: company.id,
        role: "OWNER",
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    await ensureInitialBankAccount(company.id, tx);

    return {
      companyId: company.id,
      created: true,
      membershipId: membership.id,
    };
  });

  return result;
}
