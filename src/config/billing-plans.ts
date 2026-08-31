export type BillingPlanSlug = "open_source" | "hosted" | "custom";
export type BillingIntervalSlug = "monthly" | "yearly";

export type BillingPlanPrice = {
  amountCents: number;
  currency: "BRL";
  interval: BillingIntervalSlug;
  monthlyEquivalentCents: number;
  providerPriceEnv: string;
};

export type BillingPlanDefinition = {
  description: string;
  name: string;
  prices: Partial<Record<BillingIntervalSlug, BillingPlanPrice>>;
  slug: BillingPlanSlug;
};

export const billingPlanCatalog = {
  open_source: {
    description: "Free local and self-hosted Papero usage.",
    name: "Open Source",
    prices: {},
    slug: "open_source",
  },
  hosted: {
    description: "Papero hosted and ready to use without infrastructure setup.",
    name: "Hosted",
    prices: {
      monthly: {
        amountCents: 1900,
        currency: "BRL",
        interval: "monthly",
        monthlyEquivalentCents: 1900,
        providerPriceEnv: "BILLING_HOSTED_MONTHLY_PRICE_ID",
      },
      yearly: {
        amountCents: 16800,
        currency: "BRL",
        interval: "yearly",
        monthlyEquivalentCents: 1400,
        providerPriceEnv: "BILLING_HOSTED_YEARLY_PRICE_ID",
      },
    },
    slug: "hosted",
  },
  custom: {
    description: "Hosted Papero with onboarding, priority support and custom work.",
    name: "Custom",
    prices: {
      monthly: {
        amountCents: 4900,
        currency: "BRL",
        interval: "monthly",
        monthlyEquivalentCents: 4900,
        providerPriceEnv: "BILLING_CUSTOM_MONTHLY_PRICE_ID",
      },
      yearly: {
        amountCents: 46800,
        currency: "BRL",
        interval: "yearly",
        monthlyEquivalentCents: 3900,
        providerPriceEnv: "BILLING_CUSTOM_YEARLY_PRICE_ID",
      },
    },
    slug: "custom",
  },
} as const satisfies Record<BillingPlanSlug, BillingPlanDefinition>;

export function getBillingPlan(slug: BillingPlanSlug) {
  return billingPlanCatalog[slug];
}
