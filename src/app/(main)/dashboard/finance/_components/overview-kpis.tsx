import { useTranslations } from "next-intl";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OverviewKpisProps = {
  availableCashBadge?: string;
  availableCashDesc?: string;
  availableCashValue?: string;
  currentBalanceBadge?: string;
  currentBalanceDesc?: string;
  currentBalanceValue?: string;
  monthlyExpenseBadge?: string;
  monthlyExpenseDesc?: string;
  monthlyExpenseValue?: string;
  monthlyResultBadge?: string;
  monthlyResultDesc?: string;
  monthlyResultValue?: string;
};

export function OverviewKpis({
  availableCashBadge,
  availableCashDesc,
  availableCashValue,
  currentBalanceBadge,
  currentBalanceDesc,
  currentBalanceValue,
  monthlyExpenseBadge,
  monthlyExpenseDesc,
  monthlyExpenseValue,
  monthlyResultBadge,
  monthlyResultDesc,
  monthlyResultValue,
}: OverviewKpisProps) {
  const t = useTranslations("Dashboard.kpis");
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-1 xl:grid-cols-8">
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">{t("netWorth")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-3xl leading-none tracking-tight">
                <PrivacyValue>{currentBalanceValue ?? t("netWorthValue")}</PrivacyValue>
              </div>
              <p className="text-muted-foreground text-xs">
                <PrivacyValue>{currentBalanceDesc ?? t("netWorthDesc")}</PrivacyValue>
              </p>
            </div>
            <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
              <PrivacyValue>{currentBalanceBadge ?? t("netWorthBadge")}</PrivacyValue>
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">{t("availableCash")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">
                <PrivacyValue>{availableCashValue ?? t("availableCashValue")}</PrivacyValue>
              </div>
              <p className="text-muted-foreground text-xs">
                <PrivacyValue>{availableCashDesc ?? t("availableCashDesc")}</PrivacyValue>
              </p>
            </div>
            <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
              <PrivacyValue>{availableCashBadge ?? t("availableCashBadge")}</PrivacyValue>
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">{t("monthlySpend")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">
                <PrivacyValue>{monthlyExpenseValue ?? t("monthlySpendValue")}</PrivacyValue>
              </div>
              <p className="text-muted-foreground text-xs">
                <PrivacyValue>{monthlyExpenseDesc ?? t("monthlySpendDesc")}</PrivacyValue>
              </p>
            </div>
            <Badge variant="destructive" className="bg-destructive/10 text-destructive">
              <PrivacyValue>{monthlyExpenseBadge ?? t("monthlySpendBadge")}</PrivacyValue>
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">{t("savingsRate")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">
                <PrivacyValue>{monthlyResultValue ?? t("savingsRateValue")}</PrivacyValue>
              </div>
              <p className="text-muted-foreground text-xs">
                <PrivacyValue>{monthlyResultDesc ?? t("savingsRateDesc")}</PrivacyValue>
              </p>
            </div>
            <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
              <PrivacyValue>{monthlyResultBadge ?? t("savingsRateBadge")}</PrivacyValue>
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
