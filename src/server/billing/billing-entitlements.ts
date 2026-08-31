import type { BillingPlanSlug } from "@/config/billing-plans";
import type { BillingStatusSlug, CompanyBillingState } from "@/server/billing/billing-repository";

export type BillingEntitlements = {
  canAccessFinanceFeatures: true;
  canAccessSupportFeatures: boolean;
  canUseCustomIntegrations: boolean;
  canUseHostedDatabase: boolean;
};

const entitledStatuses = new Set<BillingStatusSlug>(["active", "trialing"]);

function hasPaidAccess(plan: BillingPlanSlug, status: BillingStatusSlug) {
  return plan !== "open_source" && entitledStatuses.has(status);
}

export function getBillingEntitlements(billing: Pick<CompanyBillingState, "plan" | "status">): BillingEntitlements {
  const paidAccess = hasPaidAccess(billing.plan, billing.status);

  return {
    canAccessFinanceFeatures: true,
    canAccessSupportFeatures: paidAccess,
    canUseCustomIntegrations: paidAccess && billing.plan === "custom",
    canUseHostedDatabase: paidAccess,
  };
}
