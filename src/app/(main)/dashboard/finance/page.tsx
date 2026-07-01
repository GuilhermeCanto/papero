"use client";

import * as React from "react";

import { Download, RotateCw, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isDemoMode } from "@/config/papero-mode";

import { AccountActivityFlow } from "./_components/account-activity-flow";
import { BalanceDistributionCard } from "./_components/balance-distribution-card";
import { getDefaultFinanceAccount, getFinanceAccountsWithFallback } from "./_components/finance-accounts-store";
import {
  getAccountActivityByMonth,
  getAccountBalanceSummaries,
  getAvailableCashCentsByAccount,
  getCashFlowByDay,
  getDashboardFinanceMetrics,
  getForecastedEndOfMonthBalanceCents,
  getMonthTransactions,
  getOverdueTransactions,
  getTopCategoriesByAmount,
  getUpcomingBills,
  getUpcomingIncomes,
  isExpenseTransaction,
  isIncomeTransaction,
  parseFinanceDate,
  sumExpenseCents,
  sumIncomeCents,
} from "./_components/finance-calculations";
import { FinanceDemoAutoSeed } from "./_components/finance-demo-auto-seed";
import { FinanceDemoDataControls } from "./_components/finance-demo-data-controls";
import type { FinanceTransaction } from "./_components/finance-transactions-store";
import { FinancialCalendarPanel } from "./_components/financial-calendar-panel";
import { HealthStatus } from "./_components/health-status";
import { IncomeBreakdown } from "./_components/income-breakdown";
import { MonthlyCashFlow } from "./_components/monthly-cash-flow";
import { OverviewKpis } from "./_components/overview-kpis";
import { ShortcutsCard } from "./_components/quick-actions";
import { ExpenseBreakdown, RecentTransactionFlow, type TransactionRecord } from "./_components/transaction-flow";
import { TransactionsOverviewCard } from "./_components/transactions-overview-card";
import { UpcomingTransactions } from "./_components/upcoming-transactions";
import { useFinanceAccountsData } from "./_components/use-finance-accounts-data";
import { useFinanceTransactionsData } from "./_components/use-finance-transactions-data";
import { Wallet } from "./_components/wallet";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatMoney(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function getPreviousMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function formatPeriodVariation(currentValueCents: number, previousValueCents: number) {
  const minimumMeaningfulPreviousValueCents = 100;

  if (previousValueCents === 0 && currentValueCents === 0) return formatSignedPercent(0);
  if (previousValueCents < minimumMeaningfulPreviousValueCents) {
    return formatSignedPercent(currentValueCents >= 0 ? 100 : -100);
  }

  const variation = Math.round(((currentValueCents - previousValueCents) / Math.abs(previousValueCents)) * 100);
  return formatSignedPercent(variation);
}

function countCurrentMonthUpcomingBills(transactions: FinanceTransaction[], today: Date) {
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return getUpcomingBills(transactions, today, Number.POSITIVE_INFINITY).filter(
    (transaction) => transaction.parsedDate <= monthEnd,
  ).length;
}

function countCurrentMonthUpcomingIncomes(transactions: FinanceTransaction[], today: Date) {
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return getUpcomingIncomes(transactions, today, Number.POSITIVE_INFINITY).filter(
    (transaction) => transaction.parsedDate <= monthEnd,
  ).length;
}

function formatShortDate(date: string) {
  const parsedDate = parseFinanceDate(date);
  if (!parsedDate) return date;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(parsedDate)
    .replace(".", "");
}

function getTransactionStatus(transaction: FinanceTransaction) {
  if (transaction.paid) return isIncomeTransaction(transaction) ? "Recebido" : "Pago";

  const transactionDate = parseFinanceDate(transaction.date);
  if (
    transactionDate &&
    transactionDate < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  ) {
    return "Vencido";
  }

  return "Agendado";
}

function toTransactionRecord(transaction: FinanceTransaction): TransactionRecord {
  return {
    amountCents: transaction.amountCents,
    category: transaction.category,
    contact: transaction.from || transaction.description,
    dueDate: formatShortDate(transaction.date),
    id: transaction.id,
    status: getTransactionStatus(transaction),
  };
}

export default function Page() {
  const t = useTranslations("Dashboard");
  const today = React.useMemo(() => new Date(), []);
  const demoMode = isDemoMode();
  const { accounts, isDatabaseMode: isDatabaseAccountsMode } = useFinanceAccountsData();
  const {
    error: transactionsError,
    isDatabaseMode: isDatabaseTransactionsMode,
    isLoading: isLoadingTransactions,
    refresh: refreshTransactions,
    transactions,
  } = useFinanceTransactionsData();
  const accountsWithFallback = React.useMemo(
    () => (isDatabaseAccountsMode ? accounts : getFinanceAccountsWithFallback(accounts)),
    [accounts, isDatabaseAccountsMode],
  );
  const defaultAccount = React.useMemo(() => getDefaultFinanceAccount(accountsWithFallback), [accountsWithFallback]);
  const accountSummaries = React.useMemo(
    () => getAccountBalanceSummaries(accountsWithFallback, transactions, defaultAccount),
    [accountsWithFallback, defaultAccount, transactions],
  );
  const currentBalanceCents = React.useMemo(
    () => accountSummaries.reduce((total, summary) => total + summary.currentBalanceCents, 0),
    [accountSummaries],
  );
  const availableCashCents = React.useMemo(
    () => getAvailableCashCentsByAccount(accountsWithFallback, transactions, defaultAccount.id),
    [accountsWithFallback, defaultAccount.id, transactions],
  );
  const accountActivityData = React.useMemo(
    () => getAccountActivityByMonth(transactions, today),
    [transactions, today],
  );
  const paidAccountMovementCount = React.useMemo(
    () => accountActivityData.reduce((total, item) => total + item.movementCount, 0),
    [accountActivityData],
  );
  const hasMeaningfulHealthData = transactions.some(
    (transaction) => isIncomeTransaction(transaction) || isExpenseTransaction(transaction),
  );
  const metrics = React.useMemo(() => getDashboardFinanceMetrics(transactions, today), [transactions, today]);
  const previousMonth = React.useMemo(() => getPreviousMonth(today), [today]);
  const currentMonthTransactions = React.useMemo(
    () => getMonthTransactions(transactions, today),
    [transactions, today],
  );
  const previousMonthTransactions = React.useMemo(
    () => getMonthTransactions(transactions, previousMonth),
    [previousMonth, transactions],
  );
  const currentMonthIncomeCents = React.useMemo(
    () => sumIncomeCents(currentMonthTransactions),
    [currentMonthTransactions],
  );
  const previousMonthIncomeCents = React.useMemo(
    () => sumIncomeCents(previousMonthTransactions),
    [previousMonthTransactions],
  );
  const currentMonthExpenseCents = React.useMemo(
    () => sumExpenseCents(currentMonthTransactions),
    [currentMonthTransactions],
  );
  const previousMonthExpenseCents = React.useMemo(
    () => sumExpenseCents(previousMonthTransactions),
    [previousMonthTransactions],
  );
  const currentMonthBalanceMovementCents = React.useMemo(
    () => currentMonthIncomeCents - currentMonthExpenseCents,
    [currentMonthExpenseCents, currentMonthIncomeCents],
  );
  const previousMonthBalanceMovementCents = React.useMemo(
    () => previousMonthIncomeCents - previousMonthExpenseCents,
    [previousMonthExpenseCents, previousMonthIncomeCents],
  );
  const overdueUnpaidCount = React.useMemo(
    () => getOverdueTransactions(transactions, today).filter(isExpenseTransaction).length,
    [transactions, today],
  );
  const upcomingUnpaidCount = React.useMemo(
    () => countCurrentMonthUpcomingBills(transactions, today),
    [transactions, today],
  );
  const overdueReceivablesCount = React.useMemo(
    () => getOverdueTransactions(transactions, today).filter(isIncomeTransaction).length,
    [transactions, today],
  );
  const upcomingReceivablesCount = React.useMemo(
    () => countCurrentMonthUpcomingIncomes(transactions, today),
    [transactions, today],
  );
  const cashFlowDays = React.useMemo(() => getCashFlowByDay(transactions, today), [transactions, today]);
  const cashFlowBars = React.useMemo(() => {
    const maxMovementCents = Math.max(...cashFlowDays.map((day) => day.incomeCents + day.expenseCents), 0);

    return cashFlowDays.map((day) => ({
      minute: day.day,
      visitors:
        maxMovementCents > 0
          ? Math.max(1, Math.round(((day.incomeCents + day.expenseCents) / maxMovementCents) * 20))
          : 0,
    }));
  }, [cashFlowDays]);
  const upcomingBillItems = metrics.upcomingBills.map((transaction) => ({
    amount: formatMoney(transaction.amountCents),
    category: transaction.category,
    date: transaction.date,
    id: transaction.id,
    title: transaction.description,
  }));
  const overviewProps = {
    availableCashBadge: formatPeriodVariation(currentMonthBalanceMovementCents, previousMonthBalanceMovementCents),
    availableCashDesc: t("kpis.availableCashDesc"),
    availableCashValue: formatMoney(availableCashCents),
    currentBalanceBadge: formatPeriodVariation(currentMonthBalanceMovementCents, previousMonthBalanceMovementCents),
    currentBalanceDesc: t("kpis.netWorthDesc"),
    currentBalanceValue: formatMoney(currentBalanceCents),
    monthlyExpenseBadge: formatPeriodVariation(currentMonthExpenseCents, previousMonthExpenseCents),
    monthlyExpenseDesc: t("kpis.monthlySpendDesc", { overdue: overdueUnpaidCount, upcoming: upcomingUnpaidCount }),
    monthlyExpenseValue: formatMoney(currentMonthExpenseCents),
    monthlyResultBadge: formatPeriodVariation(currentMonthIncomeCents, previousMonthIncomeCents),
    monthlyResultDesc: t("kpis.monthlyInflowsDesc", {
      overdue: overdueReceivablesCount,
      upcoming: upcomingReceivablesCount,
    }),
    monthlyResultValue: formatMoney(currentMonthIncomeCents),
  };
  const upcomingProps = {
    autopayAmount: metrics.upcomingBills[0] ? formatMoney(metrics.upcomingBills[0].amountCents) : formatMoney(0),
    descriptionCount: metrics.upcomingBills.length,
    items: upcomingBillItems,
    total: formatMoney(metrics.upcomingBillsAmountCents),
  };
  const cashFlowProps = {
    chartData: cashFlowBars,
    finalBalance: formatMoney(metrics.forecastedEndOfMonthBalanceCents),
    forecast: formatMoney(getForecastedEndOfMonthBalanceCents(transactions, today)),
    inflow: formatMoney(metrics.currentMonthIncomeCents),
    outflow: formatMoney(metrics.currentMonthExpenseCents),
    result: formatMoney(metrics.currentMonthResultCents),
  };
  const recentIncomeRecords = React.useMemo(
    () => transactions.filter(isIncomeTransaction).slice(0, 4).map(toTransactionRecord),
    [transactions],
  );
  const recentExpenseRecords = React.useMemo(
    () => transactions.filter(isExpenseTransaction).slice(0, 4).map(toTransactionRecord),
    [transactions],
  );
  const incomeTransactions = React.useMemo(() => transactions.filter(isIncomeTransaction), [transactions]);
  const expenseTransactions = React.useMemo(() => transactions.filter(isExpenseTransaction), [transactions]);
  const currentMonthIncomeTransactions = React.useMemo(
    () => getMonthTransactions(incomeTransactions, today),
    [incomeTransactions, today],
  );
  const currentMonthExpenseTransactions = React.useMemo(
    () => getMonthTransactions(expenseTransactions, today),
    [expenseTransactions, today],
  );
  const incomeBreakdownItems = React.useMemo(
    () =>
      getTopCategoriesByAmount(currentMonthIncomeTransactions, 3).map((category) => ({
        amountLabel: formatMoney(category.amountCents),
        label: category.category,
        share: category.share,
      })),
    [currentMonthIncomeTransactions],
  );
  const expenseBreakdownItems = React.useMemo(
    () =>
      getTopCategoriesByAmount(currentMonthExpenseTransactions, 3).map((category, index) => ({
        amountLabel: formatMoney(category.amountCents),
        label: category.category,
        share: category.share,
        tone: ["bg-destructive", "bg-destructive/75", "bg-destructive/50"][index],
      })),
    [currentMonthExpenseTransactions],
  );

  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-12 lg:pt-14">
      <FinanceDemoAutoSeed />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-foreground leading-none tracking-tight">{t("greeting", { name: "Guilherme" })}</h1>
        <p className="text-lg text-muted-foreground leading-none">{t("subtitle")}</p>
      </div>

      {demoMode ? (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-primary text-sm">
          <span className="font-medium">{t("financeDemo.mode")}.</span> {t("financeDemo.modeDescription")}
        </div>
      ) : null}

      {isDatabaseTransactionsMode && (isLoadingTransactions || transactionsError) ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {isLoadingTransactions ? t("financeData.loading") : transactionsError}
          </span>
          {transactionsError ? (
            <Button onClick={() => void refreshTransactions()} size="sm" variant="outline">
              {t("financeData.retry")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <Tabs defaultValue="30-days" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList variant="line">
            <TabsTrigger value="30-days">{t("tabs.dashboard")}</TabsTrigger>
            <TabsTrigger value="12-months">{t("tabs.accounts")}</TabsTrigger>
            <TabsTrigger value="custom">{t("tabs.transactions")}</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <RotateCw className="size-4" />
              <span>{t("updated", { time: "5 min" })}</span>
            </div>
            <Button size="sm" variant="outline">
              <Settings2 />
              {t("settings")}
            </Button>
            <Button size="sm" variant="outline">
              <Download data-icon="inline-start" />
              {t("export")}
            </Button>
          </div>
        </div>

        <TabsContent value="30-days" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-6">
              <OverviewKpis {...overviewProps} />
              <UpcomingTransactions {...upcomingProps} />
              <TransactionsOverviewCard cashFlowDays={cashFlowDays} />
            </div>

            <div className="flex flex-col gap-4 xl:col-span-6">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <div className="xl:col-span-3">
                  <MonthlyCashFlow {...cashFlowProps} />
                </div>
                <div className="grid grid-cols-1 gap-4 xl:col-span-2">
                  <ShortcutsCard />
                  <HealthStatus hasData={hasMeaningfulHealthData} score={metrics.cashHealthScore} />
                </div>
              </div>
              <FinancialCalendarPanel transactions={transactions} />
            </div>
          </div>
          {demoMode ? <FinanceDemoDataControls /> : null}
        </TabsContent>

        <TabsContent value="12-months" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <BalanceDistributionCard accounts={accountSummaries} />
            <Wallet
              accounts={accountSummaries}
              sourceLabel={isDatabaseAccountsMode ? "Database" : "Local"}
              statusDescription={isDatabaseAccountsMode ? "synced from database" : "available locally"}
            />
          </div>
          <AccountActivityFlow
            activityData={accountActivityData}
            copy={{
              title: t("accountsActivity.title"),
              chartLabel: t("accountsActivity.chartLabel"),
              rangePlaceholder: t("accountsActivity.rangePlaceholder"),
              ranges: {
                last30Days: t("accountsActivity.ranges.last30Days"),
                lastQuarter: t("accountsActivity.ranges.lastQuarter"),
                last12Months: t("accountsActivity.ranges.last12Months"),
              },
              totalUnit: t("accountsActivity.totalUnit"),
              totalDescription: t("accountsActivity.totalDescription"),
              progressTitle: t("accountsActivity.progressTitle"),
              progressValue: paidAccountMovementCount,
              progressUnit: t("accountsActivity.progressUnit"),
              progressDescription: t("accountsActivity.progressDescription", { progress: "{progress}" }),
              progressCurrentLabel: t("accountsActivity.progressCurrentLabel"),
              progressTotalLabel: t("accountsActivity.progressTotalLabel"),
            }}
          />
        </TabsContent>

        <TabsContent value="custom" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="flex flex-col gap-4">
              <IncomeBreakdown items={incomeBreakdownItems} />
              <RecentTransactionFlow
                title={t("financeBreakdown.recentIncomeTitle")}
                description={t("financeBreakdown.recentIncomeDescription")}
                records={recentIncomeRecords}
              />
            </div>
            <div className="flex flex-col gap-4">
              <ExpenseBreakdown items={expenseBreakdownItems} />
              <RecentTransactionFlow
                title={t("financeBreakdown.recentExpenseTitle")}
                description={t("financeBreakdown.recentExpenseDescription")}
                records={recentExpenseRecords}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
