-- Stripe can pause a subscription while retaining it for later resumption.
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAUSED';

-- Persist successfully handled provider events so webhook retries are idempotent.
CREATE TABLE "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingWebhookEvent_provider_providerEventId_key"
ON "BillingWebhookEvent"("provider", "providerEventId");

CREATE INDEX "BillingWebhookEvent_provider_processedAt_idx"
ON "BillingWebhookEvent"("provider", "processedAt");
