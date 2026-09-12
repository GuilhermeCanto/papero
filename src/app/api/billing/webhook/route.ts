import { NextResponse } from "next/server";

import { isDatabaseMode } from "@/config/papero-mode";

export async function POST(request: Request) {
  if (!isDatabaseMode()) {
    return NextResponse.json({ error: "Stripe webhooks are disabled in this Papero data mode." }, { status: 404 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  const payload = await request.text();
  const billing = await import("@/server/billing/stripe-billing-service");

  try {
    const event = billing.constructStripeWebhookEvent(payload, signature);
    const result = await billing.processStripeWebhook(event);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    if (error instanceof billing.StripeBillingConfigurationError) {
      return NextResponse.json({ error: "Stripe webhooks are not configured for this deployment." }, { status: 503 });
    }
    if (error instanceof billing.BillingRequestError) {
      return NextResponse.json({ error: "Stripe event could not be synchronized." }, { status: error.status });
    }
    if (error instanceof Error && error.name === "StripeSignatureVerificationError") {
      return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    }

    return NextResponse.json({ error: "Stripe event processing failed." }, { status: 500 });
  }
}
