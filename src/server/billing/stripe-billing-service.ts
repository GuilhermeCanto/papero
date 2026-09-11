import type { BillingInterval, BillingPlan, Prisma, Subscription, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";
import { z } from "zod";

import {
  type BillingIntervalSlug,
  type BillingPlanSlug,
  getBillingPlan,
  getBillingPlanPrice,
} from "@/config/billing-plans";
import { getActiveCompanyContext } from "@/server/auth/active-company";
import { ensureDefaultCompanyBilling } from "@/server/billing/billing-repository";
import {
  getBillingAppUrl,
  getStripeClient,
  getStripeWebhookSecret,
  STRIPE_PROVIDER,
  StripeBillingConfigurationError,
} from "@/server/billing/stripe";
import { prisma } from "@/server/db/prisma";

import { randomUUID } from "node:crypto";

export { StripeBillingConfigurationError } from "@/server/billing/stripe";

const checkoutInputSchema = z
  .object({
    interval: z.enum(["monthly", "yearly"]),
    plan: z.enum(["hosted", "custom"]),
  })
  .strict();

const stripeStatusToPrisma = {
  active: "ACTIVE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  past_due: "PAST_DUE",
  paused: "PAUSED",
  trialing: "TRIALING",
  unpaid: "UNPAID",
} as const satisfies Record<Stripe.Subscription.Status, SubscriptionStatus>;

const slugToPrismaPlan = {
  custom: "CUSTOM",
  hosted: "HOSTED",
  open_source: "OPEN_SOURCE",
} as const satisfies Record<BillingPlanSlug, BillingPlan>;

const slugToPrismaInterval = {
  monthly: "MONTHLY",
  yearly: "YEARLY",
} as const satisfies Record<BillingIntervalSlug, BillingInterval>;

const handledWebhookTypes = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export class BillingForbiddenError extends Error {
  constructor() {
    super("Only a workspace owner can manage billing.");
    this.name = "BillingForbiddenError";
  }
}

export class BillingRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "BillingRequestError";
    this.status = status;
  }
}

function expandableId(value: string | { id: string } | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function unixDate(value: number | null | undefined) {
  return value ? new Date(value * 1000) : null;
}

function configuredPriceId(plan: "hosted" | "custom", interval: BillingIntervalSlug) {
  const price = getBillingPlanPrice(plan, interval);
  if (!price) throw new BillingRequestError("This billing interval is not available for the selected plan.");

  const priceId = process.env[price.providerPriceEnv]?.trim();
  if (!priceId) {
    throw new StripeBillingConfigurationError(`${price.providerPriceEnv} is not configured.`);
  }
  return priceId;
}

function resolveConfiguredPrice(priceId: string) {
  const matches: Array<{ interval: BillingIntervalSlug; plan: "hosted" | "custom" }> = [];
  for (const plan of ["hosted", "custom"] as const) {
    for (const interval of ["monthly", "yearly"] as const) {
      const price = getBillingPlanPrice(plan, interval);
      if (price && process.env[price.providerPriceEnv]?.trim() === priceId) matches.push({ interval, plan });
    }
  }

  if (matches.length !== 1) {
    throw new StripeBillingConfigurationError(
      matches.length === 0
        ? "The Stripe subscription uses an unknown price ID."
        : "A Stripe price ID is assigned to more than one Papero plan.",
    );
  }
  return matches[0];
}

async function requireOwner(headers: Headers) {
  const context = await getActiveCompanyContext(headers);
  if (context.role !== "OWNER") throw new BillingForbiddenError();
  return context;
}

async function getOrCreateStripeCustomer(
  companyId: string,
  subscription: Subscription,
  userId: string,
  stripe: Stripe,
) {
  if (subscription.provider && subscription.provider !== STRIPE_PROVIDER) {
    throw new BillingRequestError("This workspace is already connected to another billing provider.", 409);
  }

  if (subscription.providerCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(subscription.providerCustomerId);
      if (!customer.deleted) return customer.id;
    } catch (error) {
      if (!(typeof error === "object" && error && "code" in error && error.code === "resource_missing")) throw error;
    }
  }

  const [company, user] = await Promise.all([
    prisma.company.findUnique({ select: { name: true }, where: { id: companyId } }),
    prisma.user.findUnique({ select: { email: true, name: true }, where: { id: userId } }),
  ]);
  if (!company || !user) throw new BillingRequestError("Workspace billing identity could not be resolved.", 404);

  const customer = await stripe.customers.create(
    {
      email: user.email,
      metadata: { paperoCompanyId: companyId },
      name: company.name || user.name || undefined,
    },
    { idempotencyKey: `papero-customer-${companyId}-${subscription.updatedAt.getTime()}` },
  );

  await prisma.subscription.update({
    data: { provider: STRIPE_PROVIDER, providerCustomerId: customer.id },
    where: { companyId },
  });
  return customer.id;
}

function isLiveStripeSubscription(subscription: Stripe.Subscription) {
  return !["canceled", "incomplete_expired"].includes(subscription.status);
}

export async function createCheckoutSession(headers: Headers, input: unknown) {
  const context = await requireOwner(headers);
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) throw new BillingRequestError("Choose a valid plan and billing interval.");

  const stripe = getStripeClient();
  const appUrl = getBillingAppUrl();
  const subscription = await ensureDefaultCompanyBilling(context.companyId);
  const customerId = await getOrCreateStripeCustomer(context.companyId, subscription, context.userId, stripe);
  const priceId = configuredPriceId(parsed.data.plan, parsed.data.interval);

  const stripeSubscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 100, status: "all" });
  if (stripeSubscriptions.data.some(isLiveStripeSubscription)) {
    throw new BillingRequestError("This workspace already has a Stripe subscription. Manage it from Billing.", 409);
  }

  const openSessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 100, status: "open" });
  const matchingSession = openSessions.data.find(
    (session) =>
      session.mode === "subscription" &&
      session.metadata?.paperoCompanyId === context.companyId &&
      session.metadata?.paperoPlan === parsed.data.plan &&
      session.metadata?.paperoInterval === parsed.data.interval &&
      session.url,
  );
  if (matchingSession?.url) return { url: matchingSession.url };

  const otherPaperoSessions = openSessions.data.filter(
    (session) =>
      session.mode === "subscription" && session.metadata?.paperoCompanyId === context.companyId && session.id,
  );
  for (const session of otherPaperoSessions) {
    await stripe.checkout.sessions.expire(session.id);
  }

  const metadata = {
    paperoCompanyId: context.companyId,
    paperoInterval: parsed.data.interval,
    paperoPlan: parsed.data.plan,
  };
  const session = await stripe.checkout.sessions.create({
    cancel_url: `${appUrl}/dashboard/finance?billing_checkout=canceled`,
    client_reference_id: context.companyId,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    mode: "subscription",
    payment_method_collection: "always",
    subscription_data: {
      metadata,
      trial_period_days: getBillingPlan(parsed.data.plan).trialDays ?? undefined,
    },
    success_url: `${appUrl}/dashboard/finance?billing_checkout=success`,
  });

  if (!session.url) throw new BillingRequestError("Stripe did not return a Checkout URL.", 502);
  return { url: session.url };
}

export async function createPortalSession(headers: Headers) {
  const context = await requireOwner(headers);
  const subscription = await ensureDefaultCompanyBilling(context.companyId);
  if (subscription.provider !== STRIPE_PROVIDER || !subscription.providerCustomerId) {
    throw new BillingRequestError("No Stripe billing account is available for this workspace.", 409);
  }

  const session = await getStripeClient().billingPortal.sessions.create({
    customer: subscription.providerCustomerId,
    return_url: `${getBillingAppUrl()}/dashboard/finance`,
  });
  return { url: session.url };
}

function subscriptionFromEvent(event: Stripe.Event) {
  if (event.type.startsWith("customer.subscription.")) return event.data.object as Stripe.Subscription;
  return null;
}

async function resolveEventSubscription(event: Stripe.Event, stripe: Stripe) {
  const direct = subscriptionFromEvent(event);
  if (direct) {
    return event.type === "customer.subscription.deleted" ? direct : stripe.subscriptions.retrieve(direct.id);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = expandableId(session.subscription);
    return subscriptionId ? stripe.subscriptions.retrieve(subscriptionId) : null;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = expandableId(invoice.parent?.subscription_details?.subscription ?? null);
    return subscriptionId ? stripe.subscriptions.retrieve(subscriptionId) : null;
  }

  return null;
}

async function resolveSubscriptionCompanyId(subscription: Stripe.Subscription) {
  const metadataCompanyId = subscription.metadata.paperoCompanyId?.trim();
  if (metadataCompanyId) return metadataCompanyId;

  const customerId = expandableId(subscription.customer);
  const existing = await prisma.subscription.findFirst({
    select: { companyId: true },
    where: {
      provider: STRIPE_PROVIDER,
      OR: [{ providerSubscriptionId: subscription.id }, ...(customerId ? [{ providerCustomerId: customerId }] : [])],
    },
  });
  return existing?.companyId ?? null;
}

function stripeSubscriptionData(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  if (!item) throw new BillingRequestError("Stripe subscription does not contain a price.", 500);
  const priceId = item.price.id;
  const resolved = resolveConfiguredPrice(priceId);
  const customerId = expandableId(subscription.customer);
  if (!customerId) throw new BillingRequestError("Stripe subscription does not contain a customer.", 500);
  const status = stripeStatusToPrisma[subscription.status as keyof typeof stripeStatusToPrisma];
  if (!status) throw new BillingRequestError("Stripe returned an unsupported subscription status.", 500);

  return {
    billingInterval: slugToPrismaInterval[resolved.interval],
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: unixDate(subscription.canceled_at),
    currentPeriodEnd: unixDate(item.current_period_end),
    currentPeriodStart: unixDate(item.current_period_start),
    plan: slugToPrismaPlan[resolved.plan],
    provider: STRIPE_PROVIDER,
    providerCustomerId: customerId,
    providerPriceId: priceId,
    providerSubscriptionId: subscription.id,
    status,
    trialEnd: unixDate(subscription.trial_end),
    trialStart: unixDate(subscription.trial_start),
  } satisfies Prisma.SubscriptionUncheckedUpdateInput;
}

export async function processStripeWebhook(event: Stripe.Event) {
  if (!handledWebhookTypes.has(event.type)) return { duplicate: false, handled: false };

  const stripe = getStripeClient();
  const stripeSubscription = await resolveEventSubscription(event, stripe);
  if (!stripeSubscription) {
    await prisma.billingWebhookEvent.upsert({
      create: { eventType: event.type, provider: STRIPE_PROVIDER, providerEventId: event.id },
      update: {},
      where: { provider_providerEventId: { provider: STRIPE_PROVIDER, providerEventId: event.id } },
    });
    return { duplicate: false, handled: true };
  }

  const companyId = await resolveSubscriptionCompanyId(stripeSubscription);
  if (!companyId) throw new BillingRequestError("Stripe subscription is not linked to a Papero workspace.", 500);
  const data = stripeSubscriptionData(stripeSubscription);

  const transactionResult = await prisma.$transaction(async (tx) => {
    const insertedEvents = await tx.$executeRaw`
      INSERT INTO "BillingWebhookEvent" ("id", "provider", "providerEventId", "eventType")
      VALUES (${randomUUID()}, ${STRIPE_PROVIDER}, ${event.id}, ${event.type})
      ON CONFLICT ("provider", "providerEventId") DO NOTHING
    `;
    if (insertedEvents === 0) return "duplicate" as const;

    const current = await tx.subscription.findUnique({ where: { companyId } });
    if (current?.provider && current.provider !== STRIPE_PROVIDER) {
      throw new BillingRequestError("Workspace billing is connected to another provider.", 409);
    }
    if (current?.providerCustomerId && current.providerCustomerId !== data.providerCustomerId) {
      throw new BillingRequestError("Stripe customer does not match this workspace.", 409);
    }
    if (
      current?.providerSubscriptionId &&
      current.providerSubscriptionId !== stripeSubscription.id &&
      !["CANCELED", "INCOMPLETE", "UNPAID"].includes(current.status)
    ) {
      throw new BillingRequestError("Workspace already has a different active subscription.", 409);
    }

    await tx.subscription.upsert({
      create: { companyId, ...data },
      update: data,
      where: { companyId },
    });

    return "processed" as const;
  });
  if (transactionResult === "duplicate") return { duplicate: true, handled: true };

  console.info("[billing:webhook] Stripe event processed", {
    companyId,
    eventId: event.id,
    eventType: event.type,
    subscriptionId: stripeSubscription.id,
  });
  return { duplicate: false, handled: true };
}

export function constructStripeWebhookEvent(payload: string, signature: string) {
  return getStripeClient().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
}
