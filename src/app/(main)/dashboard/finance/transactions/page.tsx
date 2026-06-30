"use client";

import * as React from "react";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

import { getDefaultFinanceAccount, getFinanceAccountsWithFallback } from "../_components/finance-accounts-store";
import { getAccountBalanceSummaries, getDashboardFinanceMetrics } from "../_components/finance-calculations";
import { FinanceTransactionsTable } from "../_components/finance-transactions-table";
import { useFinanceAccountsData } from "../_components/use-finance-accounts-data";
import { useFinanceTransactionsData } from "../_components/use-finance-transactions-data";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatMoney(amountCents: number) {
  return moneyFormatter.format(amountCents / 100);
}

function getPrimaryAccountId(accounts: { archived: boolean; id: string; name: string }[]) {
  const activeAccounts = accounts.filter((account) => !account.archived);
  const mainAccount = activeAccounts.find((account) => {
    const normalizedName = account.name.trim().toLowerCase();
    return normalizedName === "main account" || normalizedName === "conta principal" || account.id === "main-account";
  });

  return mainAccount?.id ?? activeAccounts[0]?.id;
}

function TransactionsKpiStrip({
  accountOptions,
  accountSelectionLabel,
  currentBalanceCents,
  expensePaidCents,
  expenseProjectedCents,
  incomePaidCents,
  incomeProjectedCents,
  monthLabel,
  onToggleAccount,
  projectedResultCents,
  selectedAccountIds,
}: {
  accountOptions: { id: string; name: string }[];
  accountSelectionLabel: string;
  currentBalanceCents: number;
  expensePaidCents: number;
  expenseProjectedCents: number;
  incomePaidCents: number;
  incomeProjectedCents: number;
  monthLabel: string;
  onToggleAccount: (accountId: string) => void;
  projectedResultCents: number;
  selectedAccountIds: string[];
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
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="font-normal">{accountSelectionLabel}</CardTitle>
              {accountOptions.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label={t("kpi.selectAccounts")}
                      className="-mt-1 size-8"
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {accountOptions.map((account) => (
                      <DropdownMenuCheckboxItem
                        checked={selectedAccountIds.includes(account.id)}
                        key={account.id}
                        onCheckedChange={() => onToggleAccount(account.id)}
                      >
                        {account.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
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
  const t = useTranslations("Dashboard.financeTransactions");
  const today = React.useMemo(() => new Date(), []);
  const { accounts, isDatabaseMode: isDatabaseAccountsMode } = useFinanceAccountsData();
  const { transactions } = useFinanceTransactionsData();
  const accountsWithFallback = React.useMemo(
    () => (isDatabaseAccountsMode ? accounts : getFinanceAccountsWithFallback(accounts)),
    [accounts, isDatabaseAccountsMode],
  );
  const activeAccounts = React.useMemo(
    () => accountsWithFallback.filter((account) => !account.archived),
    [accountsWithFallback],
  );
  const defaultAccount = React.useMemo(() => getDefaultFinanceAccount(accountsWithFallback), [accountsWithFallback]);
  const accountSummaries = React.useMemo(
    () => getAccountBalanceSummaries(accountsWithFallback, transactions, defaultAccount),
    [accountsWithFallback, defaultAccount, transactions],
  );
  const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setSelectedAccountIds((currentSelection) => {
      const activeAccountIds = activeAccounts.map((account) => account.id);
      if (activeAccountIds.length === 0) return [];

      const validCurrentSelection = currentSelection.filter((accountId) => activeAccountIds.includes(accountId));
      if (validCurrentSelection.length > 0) return validCurrentSelection;

      const primaryAccountId = getPrimaryAccountId(activeAccounts);
      return primaryAccountId ? [primaryAccountId] : activeAccountIds;
    });
  }, [activeAccounts]);

  const selectedAccountIdSet = React.useMemo(() => new Set(selectedAccountIds), [selectedAccountIds]);
  const selectedCurrentBalanceCents = React.useMemo(
    () =>
      accountSummaries
        .filter((summary) => selectedAccountIdSet.has(summary.account.id))
        .reduce((total, summary) => total + summary.currentBalanceCents, 0),
    [accountSummaries, selectedAccountIdSet],
  );
  const accountSelectionLabel = React.useMemo(() => {
    if (activeAccounts.length === 0) return t("kpi.account");
    if (selectedAccountIds.length === activeAccounts.length) return t("kpi.allAccounts");
    if (selectedAccountIds.length > 1) return t("kpi.multipleAccounts");

    return activeAccounts.find((account) => account.id === selectedAccountIds[0])?.name ?? t("kpi.account");
  }, [activeAccounts, selectedAccountIds, t]);
  const handleToggleAccount = React.useCallback((accountId: string) => {
    setSelectedAccountIds((currentSelection) => {
      if (currentSelection.includes(accountId)) {
        const nextSelection = currentSelection.filter((selectedAccountId) => selectedAccountId !== accountId);
        return nextSelection.length > 0 ? nextSelection : currentSelection;
      }

      return [...currentSelection, accountId];
    });
  }, []);
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
        accountOptions={activeAccounts.map((account) => ({ id: account.id, name: account.name }))}
        accountSelectionLabel={accountSelectionLabel}
        currentBalanceCents={selectedCurrentBalanceCents}
        expensePaidCents={metrics.paidExpenseCents}
        expenseProjectedCents={metrics.currentMonthExpenseCents}
        incomePaidCents={metrics.paidIncomeCents}
        incomeProjectedCents={metrics.currentMonthIncomeCents}
        monthLabel={monthLabel}
        onToggleAccount={handleToggleAccount}
        projectedResultCents={metrics.currentMonthResultCents}
        selectedAccountIds={selectedAccountIds}
      />

      <FinanceTransactionsTable />
    </div>
  );
}
