"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { OnboardingFlow } from "./onboarding-flow";

type OnboardingDashboardGateProps = {
  billingEnforcementRequired: boolean;
  canAccessFinanceFeatures: boolean;
  initialAccount: {
    institution: string;
    name: string;
    openingBalanceCents: number;
  };
  initialWorkspaceName: string;
  needsOnboarding: boolean;
};

type OnboardingView = "plans" | "setup" | null;

function removeBillingReturnParameters() {
  const url = new URL(window.location.href);
  url.searchParams.delete("billing_checkout");
  url.searchParams.delete("onboarding_plan");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function OnboardingDashboardGate({
  billingEnforcementRequired,
  canAccessFinanceFeatures,
  initialAccount,
  initialWorkspaceName,
  needsOnboarding,
}: OnboardingDashboardGateProps) {
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const billingAccessBlocked = billingEnforcementRequired && !canAccessFinanceFeatures;
  const [view, setView] = React.useState<OnboardingView>(
    needsOnboarding ? "setup" : billingAccessBlocked ? "plans" : null,
  );
  const [billingReturn, setBillingReturn] = React.useState<"canceled" | "confirming" | "delayed" | null>(null);
  const handledReturn = React.useRef(false);

  React.useEffect(() => {
    if (needsOnboarding || handledReturn.current) return;
    handledReturn.current = true;

    const parameters = new URLSearchParams(window.location.search);
    const checkoutReturn = parameters.get("billing_checkout");
    const shouldReturnToPlans = checkoutReturn === "canceled" || parameters.get("onboarding_plan") === "1";

    if (checkoutReturn === "success") {
      if (billingAccessBlocked) {
        setBillingReturn("confirming");
        setView("plans");
      } else {
        toast.success(t("billingReturn.success.title"), {
          description: t("billingReturn.success.description"),
        });
        removeBillingReturnParameters();
      }
      return;
    }

    if (shouldReturnToPlans) {
      setBillingReturn(checkoutReturn === "canceled" ? "canceled" : null);
      setView("plans");
    }
  }, [billingAccessBlocked, needsOnboarding, t]);

  React.useEffect(() => {
    if (billingReturn !== "confirming" || !billingAccessBlocked) return;

    let canceled = false;
    let attempts = 0;
    let timeout: number | undefined;

    async function refreshBillingStatus() {
      try {
        const response = await fetch("/api/billing", { cache: "no-store" });
        const body = (await response.json().catch(() => null)) as {
          entitlements?: { canAccessFinanceFeatures?: boolean };
        } | null;

        if (response.ok && body?.entitlements?.canAccessFinanceFeatures) {
          if (canceled) return;
          removeBillingReturnParameters();
          toast.success(t("billingReturn.success.title"), {
            description: t("billingReturn.success.description"),
          });
          setView(null);
          router.refresh();
          return;
        }
      } catch {
        // A transient status request failure is retried below.
      }

      if (canceled) return;
      attempts += 1;
      if (attempts >= 20) {
        setBillingReturn("delayed");
        return;
      }
      timeout = window.setTimeout(refreshBillingStatus, 1500);
    }

    timeout = window.setTimeout(refreshBillingStatus, 500);
    return () => {
      canceled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [billingAccessBlocked, billingReturn, router, t]);

  if (!view) return null;

  return (
    <OnboardingFlow
      initialAccount={initialAccount}
      initialBillingReturn={billingReturn}
      initialStep={view === "plans" ? 4 : 1}
      initialWorkspaceName={initialWorkspaceName}
      onboardingCompleted={view === "plans"}
      billingEnforcementRequired={billingEnforcementRequired}
      onClosed={() => {
        removeBillingReturnParameters();
        setView(null);
      }}
      onRetryBillingStatus={() => setBillingReturn("confirming")}
    />
  );
}
