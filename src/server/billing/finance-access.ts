import { getActiveCompanyContext } from "@/server/auth/active-company";
import { isBillingEnforcementRequired } from "@/server/billing/billing-enforcement";
import { getBillingEntitlements } from "@/server/billing/billing-entitlements";
import { getCompanyBillingState } from "@/server/billing/billing-repository";

export const BILLING_ACCESS_REQUIRED_CODE = "BILLING_ACCESS_REQUIRED";

export class BillingAccessRequiredError extends Error {
  code = BILLING_ACCESS_REQUIRED_CODE;

  constructor() {
    super("An active Hosted or Custom subscription is required to access finance features.");
    this.name = "BillingAccessRequiredError";
  }
}

export async function getActiveCompanyFinanceAccess(headers: Headers) {
  const context = await getActiveCompanyContext(headers);
  const billingEnforcementRequired = isBillingEnforcementRequired();

  if (!billingEnforcementRequired) {
    return {
      billingEnforcementRequired,
      canAccessFinanceFeatures: true,
      context,
    };
  }

  const billing = await getCompanyBillingState(context.companyId);
  const entitlements = getBillingEntitlements(billing);

  return {
    billingEnforcementRequired,
    canAccessFinanceFeatures: entitlements.canAccessFinanceFeatures,
    context,
  };
}

export async function requireActiveCompanyFinanceAccess(headers: Headers) {
  const access = await getActiveCompanyFinanceAccess(headers);
  if (!access.canAccessFinanceFeatures) throw new BillingAccessRequiredError();
  return access.context;
}
