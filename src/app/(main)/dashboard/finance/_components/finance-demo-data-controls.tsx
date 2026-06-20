"use client";

import { Database, RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/config/papero-mode";

import { clearFinanceData, loadDemoFinanceData, resetFinanceDemoData } from "./finance-demo-data";

export function FinanceDemoDataControls() {
  const t = useTranslations("Dashboard.financeDemo");
  const demoMode = isDemoMode();

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="font-normal">{t("title")}</CardTitle>
          {demoMode ? (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
              {t("mode")}
            </span>
          ) : null}
        </div>
        <CardDescription>{demoMode ? t("modeDescription") : t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={loadDemoFinanceData} size="sm" type="button" variant="outline">
          <Database />
          {t("load")}
        </Button>
        <Button onClick={resetFinanceDemoData} size="sm" type="button" variant="outline">
          <RotateCcw />
          {t("reset")}
        </Button>
        <Button onClick={clearFinanceData} size="sm" type="button" variant="outline">
          <Trash2 />
          {t("clear")}
        </Button>
      </CardContent>
    </Card>
  );
}
