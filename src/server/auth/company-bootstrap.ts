import { prisma } from "@/server/db/prisma";

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

    return {
      companyId: company.id,
      created: true,
      membershipId: membership.id,
    };
  });

  return result;
}
