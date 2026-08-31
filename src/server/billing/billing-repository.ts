import type { BillingInterval, BillingPlan, Prisma, Subscription, SubscriptionStatus } from "@prisma/client";

import type { BillingIntervalSlug, BillingPlanSlug } from "@/config/billing-plans";
import { prisma } from "@/server/db/prisma";

export type BillingStatusSlug = "free" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";

export type CompanyBillingState = {
  billingInterval: BillingIntervalSlug | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  companyId: string;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  plan: BillingPlanSlug;
  status: BillingStatusSlug;
  trialEnd: string | null;
  trialStart: string | null;
};

const prismaPlanToSlug = {
  CUSTOM: "custom",
  HOSTED: "hosted",
  OPEN_SOURCE: "open_source",
} as const satisfies Record<BillingPlan, BillingPlanSlug>;

const prismaIntervalToSlug = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const satisfies Record<BillingInterval, BillingIntervalSlug>;

const prismaStatusToSlug = {
  ACTIVE: "active",
  CANCELED: "canceled",
  FREE: "free",
  INCOMPLETE: "incomplete",
  PAST_DUE: "past_due",
  TRIALING: "trialing",
  UNPAID: "unpaid",
} as const satisfies Record<SubscriptionStatus, BillingStatusSlug>;

function toIsoString(value: Date | null) {
  return value?.toISOString() ?? null;
}

export function toCompanyBillingState(subscription: Subscription): CompanyBillingState {
  return {
    billingInterval: subscription.billingInterval ? prismaIntervalToSlug[subscription.billingInterval] : null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: toIsoString(subscription.canceledAt),
    companyId: subscription.companyId,
    currentPeriodEnd: toIsoString(subscription.currentPeriodEnd),
    currentPeriodStart: toIsoString(subscription.currentPeriodStart),
    plan: prismaPlanToSlug[subscription.plan],
    status: prismaStatusToSlug[subscription.status],
    trialEnd: toIsoString(subscription.trialEnd),
    trialStart: toIsoString(subscription.trialStart),
  };
}

export async function ensureDefaultCompanyBilling(
  companyId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return client.subscription.upsert({
    create: {
      companyId,
      plan: "OPEN_SOURCE",
      status: "FREE",
    },
    update: {},
    where: {
      companyId,
    },
  });
}

export async function getCompanyBillingState(companyId: string) {
  const subscription = await ensureDefaultCompanyBilling(companyId);
  return toCompanyBillingState(subscription);
}
