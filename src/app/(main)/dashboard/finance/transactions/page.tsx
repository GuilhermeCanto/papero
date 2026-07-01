"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { useLocale, useTranslations } from "next-intl";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { getDashboardFinanceMetrics } from "../_components/finance-calculations";
import { useFinanceTransactions } from "../_components/finance-transactions-store";
import { FinanceTransactionsTable } from "../_components/finance-transactions-table";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatMoney(amountCents: number) {
  return moneyFormatter.format(amountCents / 100);
}

function TransactionsKpiStrip({
  currentBalanceCents,
  expensePaidCents,
  expenseProjectedCents,
  incomePaidCents,
  incomeProjectedCents,
  monthLabel,
  projectedResultCents,
}: {
  currentBalanceCents: number;
  expensePaidCents: number;
  expenseProjectedCents: number;
  incomePaidCents: number;
  incomeProjectedCents: number;
  monthLabel: string;
  projectedResultCents: number;
}) {
  const t = useTranslations("Dashboard.financeTransactions");
  const incomeProgress =
    incomeProjectedCents > 0
      ? Math.min(100, Math.max(0, Math.round((incomePaidCents / incomeProjectedCents) * 100)))
      : 0;
  const expenseProgress =
    expenseProjectedCents > 0
      ? Math.min(100, Math.max(0, Math.round((expensePaidCents / expenseProjectedCents) * 100)))
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="grid h-full grid-cols-1 md:grid-cols-2">
          <Card className="h-full gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 md:border-r md:border-b-0">
            <CardHeader>
              <CardTitle className="font-normal">{t("kpi.account")}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <div className="text-3xl leading-none tracking-tight">
                  <PrivacyValue>{formatMoney(currentBalanceCents)}</PrivacyValue>
                </div>
                <p className="text-muted-foreground text-xs">{t("kpi.accountSubtitle")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full gap-5 overflow-hidden rounded-none border-0 ring-0">
            <CardHeader>
              <CardTitle className="font-normal">{t("kpi.projected")}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <div className="text-3xl leading-none tracking-tight">
                  <PrivacyValue>{formatMoney(projectedResultCents)}</PrivacyValue>
                </div>
                <p className="text-muted-foreground text-xs">{t("kpi.projectedSubtitle", { month: monthLabel })}</p>
              </div>
              <Badge variant="outline">{t("kpi.projectedBadge")}</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 md:border-r md:border-b-0">
            <CardHeader>
              <CardTitle className="font-normal">{t("kpi.income")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="text-3xl leading-none tracking-tight">
                    <PrivacyValue>{formatMoney(incomePaidCents)}</PrivacyValue>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("kpi.incomeProjected", { amount: formatMoney(incomeProjectedCents) })}
                  </p>
                </div>
                <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                  {t("kpi.incomeBadge")}
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                <Progress className="h-2 [&_[data-slot=progress-indicator]]:bg-green-500" value={incomeProgress} />
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>{t("kpi.incomeProgress")}</span>
                  <PrivacyValue>{incomeProgress}%</PrivacyValue>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0">
            <CardHeader>
              <CardTitle className="font-normal">{t("kpi.expense")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="text-3xl leading-none tracking-tight">
                    <PrivacyValue>{formatMoney(expensePaidCents)}</PrivacyValue>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("kpi.expenseProjected", { amount: formatMoney(expenseProjectedCents) })}
                  </p>
                </div>
                <Badge className="bg-destructive/10 text-destructive" variant="destructive">
                  {t("kpi.expenseBadge")}
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                <Progress className="h-2 [&_[data-slot=progress-indicator]]:bg-destructive" value={expenseProgress} />
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>{t("kpi.expenseProgress")}</span>
                  <PrivacyValue>{expenseProgress}%</PrivacyValue>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations("Dashboard.financeTransactions");
  const today = React.useMemo(() => new Date(), []);
  const { transactions } = useFinanceTransactions([]);
  const tableMode =
    searchParams.get("type") === "income" ? "incomes" : searchParams.get("type") === "expense" ? "expenses" : "all";
  const editTransactionId = searchParams.get("edit") ?? undefined;
  const metrics = React.useMemo(() => getDashboardFinanceMetrics(transactions, today), [transactions, today]);
  const monthLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        year: "numeric",
      }).format(today),
    [locale, today],
  );

  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-12 lg:pt-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-foreground leading-none tracking-tight">{t("title")}</h1>
        <p className="text-lg text-muted-foreground leading-none">{t("subtitle")}</p>
      </div>

      <TransactionsKpiStrip
        currentBalanceCents={metrics.currentBalanceCents}
        expensePaidCents={metrics.paidExpenseCents}
        expenseProjectedCents={metrics.currentMonthExpenseCents}
        incomePaidCents={metrics.paidIncomeCents}
        incomeProjectedCents={metrics.currentMonthIncomeCents}
        monthLabel={monthLabel}
        projectedResultCents={metrics.currentMonthResultCents}
      />

      <FinanceTransactionsTable editTransactionId={editTransactionId} mode={tableMode} />
    </div>
  );
}
