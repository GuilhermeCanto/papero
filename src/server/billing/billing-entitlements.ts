import type { BillingPlanSlug } from "@/config/billing-plans";
import { isBillingEnforcementRequired } from "@/server/billing/billing-enforcement";
import type { BillingStatusSlug, CompanyBillingState } from "@/server/billing/billing-repository";

export type BillingEntitlements = {
  canAccessFinanceFeatures: boolean;
  canAccessSupportFeatures: boolean;
  canUseCustomIntegrations: boolean;
  canUseHostedDatabase: boolean;
};

const entitledStatuses = new Set<BillingStatusSlug>(["active", "trialing"]);

function hasPaidAccess(plan: BillingPlanSlug, status: BillingStatusSlug) {
  return (plan === "hosted" || plan === "custom") && entitledStatuses.has(status);
}

export function getBillingEntitlements(billing: Pick<CompanyBillingState, "plan" | "status">): BillingEntitlements {
  const paidAccess = hasPaidAccess(billing.plan, billing.status);

  return {
    canAccessFinanceFeatures: !isBillingEnforcementRequired() || paidAccess,
    canAccessSupportFeatures: paidAccess,
    canUseCustomIntegrations: paidAccess && billing.plan === "custom",
    canUseHostedDatabase: paidAccess,
  };
}
