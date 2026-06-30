import { prisma } from "@/server/db/prisma";

const defaultBankAccountNames = ["Main Account", "Conta Principal"];

async function ensureDefaultBankAccount(companyId: string) {
  const existingAccount = await prisma.bankAccount.findFirst({
    select: {
      id: true,
    },
    where: {
      companyId,
      OR: defaultBankAccountNames.map((name) => ({
        name: {
          equals: name,
          mode: "insensitive" as const,
        },
      })),
    },
  });

  if (existingAccount) {
    return existingAccount;
  }

  return prisma.bankAccount.create({
    data: {
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
    await ensureDefaultBankAccount(existingMembership.companyId);

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
      const existingDefaultAccount = await tx.bankAccount.findFirst({
        select: {
          id: true,
        },
        where: {
          companyId: membershipCreatedDuringRetry.companyId,
          OR: defaultBankAccountNames.map((name) => ({
            name: {
              equals: name,
              mode: "insensitive" as const,
            },
          })),
        },
      });

      if (!existingDefaultAccount) {
        await tx.bankAccount.create({
          data: {
            companyId: membershipCreatedDuringRetry.companyId,
            currency: "BRL",
            initialBalanceCents: 0,
            name: "Main Account",
            type: "CHECKING",
          },
        });
      }

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

    await tx.bankAccount.create({
      data: {
        companyId: company.id,
        currency: "BRL",
        initialBalanceCents: 0,
        name: "Main Account",
        type: "CHECKING",
      },
    });

    return {
      companyId: company.id,
      created: true,
      membershipId: membership.id,
    };
  });

  return result;
}
