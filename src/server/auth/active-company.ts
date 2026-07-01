import { isDatabaseMode } from "@/config/papero-mode";
import { ensureDefaultCompanyForUser } from "@/server/auth/company-bootstrap";
import { prisma } from "@/server/db/prisma";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication is required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ActiveCompanyError extends Error {
  constructor(message = "No company membership was found for this user.") {
    super(message);
    this.name = "ActiveCompanyError";
  }
}

export type ActiveCompanyContext = {
  companyId: string;
  role: "ADMIN" | "MEMBER" | "OWNER";
  userId: string;
};

export async function getActiveCompanyContext(headers: Headers): Promise<ActiveCompanyContext> {
  if (!isDatabaseMode()) {
    throw new UnauthorizedError();
  }

  const { auth } = await import("@/server/auth/auth");
  const session = await auth.api.getSession({ headers });

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const membership =
    (await prisma.companyMember.findFirst({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        companyId: true,
        role: true,
      },
      where: {
        userId: session.user.id,
      },
    })) ?? null;

  if (membership) {
    return {
      companyId: membership.companyId,
      role: membership.role,
      userId: session.user.id,
    };
  }

  const company = await ensureDefaultCompanyForUser(session.user);
  const bootstrappedMembership = await prisma.companyMember.findUnique({
    select: {
      role: true,
    },
    where: {
      id: company.membershipId,
    },
  });

  if (!bootstrappedMembership) {
    throw new ActiveCompanyError();
  }

  return {
    companyId: company.companyId,
    role: bootstrappedMembership.role,
    userId: session.user.id,
  };
}
