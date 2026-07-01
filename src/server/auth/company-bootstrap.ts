import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

async function ensureDefaultMainAccount(companyId: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const existingMainAccount = await client.bankAccount.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      name: {
        in: ["Main Account", "Conta Principal"],
      },
    },
  });

  if (existingMainAccount) return;

  await client.bankAccount.create({
    data: {
      cashFlowRole: "OPERATING",
      companyId,
      currency: "BRL",
      initialBalanceCents: 0,
      name: "Main Account",
      type: "CHECKING",
    },
  });
}

export async function ensureDefaultCompanyForUser(user: { id: string; name?: string | null }) {
  const existingMembership = await prisma.companyMember.findFirst({
    select: {
      companyId: true,
      id: true,
      role: true,
    },
    where: {
      userId: user.id,
    },
  });

  if (existingMembership) {
    await ensureDefaultMainAccount(existingMembership.companyId);

    return {
      companyId: existingMembership.companyId,
      created: false,
      membershipId: existingMembership.id,
    };
  }

  const companyName = user.name?.trim() ? `${user.name.trim()}'s workspace` : "My workspace";

  const result = await prisma.$transaction(async (tx) => {
    const membershipCreatedDuringRetry = await tx.companyMember.findFirst({
      select: {
        companyId: true,
        id: true,
      },
      where: {
        userId: user.id,
      },
    });

    if (membershipCreatedDuringRetry) {
      await ensureDefaultMainAccount(membershipCreatedDuringRetry.companyId, tx);

      return {
        companyId: membershipCreatedDuringRetry.companyId,
        created: false,
        membershipId: membershipCreatedDuringRetry.id,
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

    await ensureDefaultMainAccount(company.id, tx);

    return {
      companyId: company.id,
      created: true,
      membershipId: membership.id,
    };
  });

  return result;
}
