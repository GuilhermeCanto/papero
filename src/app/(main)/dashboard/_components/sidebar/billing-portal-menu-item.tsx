"use client";

import * as React from "react";

import { CreditCard, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { isDatabaseMode } from "@/config/papero-mode";

export function BillingPortalMenuItem({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations("AccountMenu");
  const [isPending, setIsPending] = React.useState(false);
  const enabled = isDatabaseMode() && isAuthenticated;

  async function openPortal() {
    if (!enabled || isPending) return;
    setIsPending(true);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const body = (await response.json().catch(() => null)) as { error?: string; url?: string } | null;
      if (!response.ok || !body?.url) throw new Error(body?.error || t("billingPortalError"));
      window.location.assign(body.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("billingPortalError"));
      setIsPending(false);
    }
  }

  return (
    <DropdownMenuItem disabled={!enabled || isPending} onClick={() => void openPortal()}>
      {isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <CreditCard />}
      {isPending ? t("billingPortalOpening") : enabled ? t("manageSubscription") : t("billing")}
    </DropdownMenuItem>
  );
}
