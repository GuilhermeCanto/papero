"use client";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboardPrivacyStore } from "@/stores/dashboard-privacy-store";

export function PrivacyToggle() {
  const numbersHidden = useDashboardPrivacyStore((state) => state.numbersHidden);
  const toggleNumbersHidden = useDashboardPrivacyStore((state) => state.toggleNumbersHidden);
  const label = numbersHidden ? "Show dashboard numbers" : "Hide dashboard numbers";
  const Icon = numbersHidden ? EyeOff : Eye;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} onClick={toggleNumbersHidden} size="icon" type="button">
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="center" side="bottom">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
