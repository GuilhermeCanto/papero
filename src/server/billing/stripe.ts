import Stripe from "stripe";

export const STRIPE_PROVIDER = "stripe";

export class StripeBillingConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeBillingConfigurationError";
  }
}

let stripeClient: Stripe | null = null;

function requireEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new StripeBillingConfigurationError(`${name} is not configured.`);
  }
  return value;
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnvironmentValue("STRIPE_SECRET_KEY"), {
      appInfo: { name: "Papero" },
    });
  }
  return stripeClient;
}

export function getStripeWebhookSecret() {
  return requireEnvironmentValue("STRIPE_WEBHOOK_SECRET");
}

export function getBillingAppUrl() {
  const configuredUrl = requireEnvironmentValue("NEXT_PUBLIC_APP_URL");
  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new StripeBillingConfigurationError("NEXT_PUBLIC_APP_URL must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new StripeBillingConfigurationError("NEXT_PUBLIC_APP_URL must be a clean HTTP(S) origin.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new StripeBillingConfigurationError("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
  }

  return url.origin;
}
