"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { PRIVATE_VALUE_MASK, useDashboardPrivacyStore } from "@/stores/dashboard-privacy-store";

export function PrivacyValue({
  children,
  className,
  mask = PRIVATE_VALUE_MASK,
}: {
  children: ReactNode;
  className?: string;
  mask?: string;
}) {
  const numbersHidden = useDashboardPrivacyStore((state) => state.numbersHidden);

  return <span className={cn("tabular-nums", className)}>{numbersHidden ? mask : children}</span>;
}
