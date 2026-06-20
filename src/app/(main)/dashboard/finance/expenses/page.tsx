"use client";

import * as React from "react";

import { useTranslations } from "next-intl";

import {
  getCashFlowByDay,
  getMonthTransactions,
  getTopCategoriesByAmount,
  getUpcomingBills,
  isExpenseTransaction,
  sumAmountCents,
} from "../_components/finance-calculations";
import { useFinanceTransactions } from "../_components/finance-transactions-store";
import { FinanceTransactionsTable } from "../_components/finance-transactions-table";
import { ExpenseBreakdown } from "../_components/transaction-flow";
import { TransactionsOverviewCard } from "../_components/transactions-overview-card";
import { UpcomingTransactions } from "../_components/upcoming-transactions";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatMoney(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

export default function ExpensesPage() {
  const t = useTranslations("Dashboard.financeOperationalPages.expenses");
  const today = React.useMemo(() => new Date(), []);
  const { transactions } = useFinanceTransactions([]);
  const expenseTransactions = React.useMemo(() => transactions.filter(isExpenseTransaction), [transactions]);
  const monthExpenseTransactions = React.useMemo(
    () => getMonthTransactions(expenseTransactions, today),
    [expenseTransactions, today],
  );
  const cashFlowDays = React.useMemo(() => getCashFlowByDay(expenseTransactions, today), [expenseTransactions, today]);
  const upcomingBills = React.useMemo(() => getUpcomingBills(transactions, today, 3), [transactions, today]);
  const breakdownItems = React.useMemo(
    () =>
      getTopCategoriesByAmount(monthExpenseTransactions, 3).map((category, index) => ({
        amountLabel: formatMoney(category.amountCents),
        label: category.category,
        share: category.share,
        tone: ["bg-destructive", "bg-destructive/75", "bg-destructive/50"][index],
      })),
    [monthExpenseTransactions],
  );
  const upcomingItems = upcomingBills.map((transaction) => ({
    amount: formatMoney(transaction.amountCents),
    category: transaction.category,
    date: transaction.date,
    id: transaction.id,
    title: transaction.description,
  }));
  const upcomingTotalCents = sumAmountCents(upcomingBills);

  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-12 lg:pt-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-foreground leading-none tracking-tight">{t("title")}</h1>
        <p className="text-lg text-muted-foreground leading-none">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-4">
          <ExpenseBreakdown items={breakdownItems} />
          <TransactionsOverviewCard cashFlowDays={cashFlowDays} compact />
        </div>
        <div className="xl:col-span-8">
          <UpcomingTransactions
            autopayAmount={upcomingBills[0] ? formatMoney(upcomingBills[0].amountCents) : formatMoney(0)}
            emptyLabel={t("upcomingEmpty")}
            highlightLabel={t("upcomingHighlight")}
            items={upcomingItems}
            summaryLabel={t("upcomingSummary", { count: upcomingBills.length })}
            title={t("upcomingTitle")}
            total={formatMoney(upcomingTotalCents)}
          />
        </div>
      </div>

      <FinanceTransactionsTable mode="expenses" />
    </div>
  );
}
