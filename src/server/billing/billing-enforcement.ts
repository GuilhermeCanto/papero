export type BillingEnforcementMode = "optional" | "required";

export function getBillingEnforcementMode(): BillingEnforcementMode {
  const configuredMode = process.env.PAPERO_BILLING_ENFORCEMENT?.trim().toLowerCase();

  if (!configuredMode || configuredMode === "optional") return "optional";
  if (configuredMode === "required") return "required";

  throw new Error('PAPERO_BILLING_ENFORCEMENT must be either "optional" or "required".');
}

export function isBillingEnforcementRequired() {
  return getBillingEnforcementMode() === "required";
}
