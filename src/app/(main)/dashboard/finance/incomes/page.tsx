"use client";

import * as React from "react";

import { useTranslations } from "next-intl";

import {
  getCashFlowByDay,
  getMonthTransactions,
  getTopCategoriesByAmount,
  getUpcomingIncomes,
  isIncomeTransaction,
  sumAmountCents,
} from "../_components/finance-calculations";
import { useFinanceTransactions } from "../_components/finance-transactions-store";
import { FinanceTransactionsTable } from "../_components/finance-transactions-table";
import { IncomeBreakdown } from "../_components/income-breakdown";
import { TransactionsOverviewCard } from "../_components/transactions-overview-card";
import { UpcomingTransactions } from "../_components/upcoming-transactions";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatMoney(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

export default function IncomesPage() {
  const t = useTranslations("Dashboard.financeOperationalPages.incomes");
  const today = React.useMemo(() => new Date(), []);
  const { transactions } = useFinanceTransactions([]);
  const incomeTransactions = React.useMemo(() => transactions.filter(isIncomeTransaction), [transactions]);
  const monthIncomeTransactions = React.useMemo(
    () => getMonthTransactions(incomeTransactions, today),
    [incomeTransactions, today],
  );
  const cashFlowDays = React.useMemo(() => getCashFlowByDay(incomeTransactions, today), [incomeTransactions, today]);
  const upcomingIncomes = React.useMemo(() => getUpcomingIncomes(transactions, today, 3), [transactions, today]);
  const breakdownItems = React.useMemo(
    () =>
      getTopCategoriesByAmount(monthIncomeTransactions, 3).map((category) => ({
        amountLabel: formatMoney(category.amountCents),
        label: category.category,
        share: category.share,
      })),
    [monthIncomeTransactions],
  );
  const upcomingItems = upcomingIncomes.map((transaction) => ({
    amount: formatMoney(transaction.amountCents),
    category: transaction.category,
    date: transaction.date,
    id: transaction.id,
    title: transaction.description,
  }));
  const upcomingTotalCents = sumAmountCents(upcomingIncomes);

  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-12 lg:pt-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-foreground leading-none tracking-tight">{t("title")}</h1>
        <p className="text-lg text-muted-foreground leading-none">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-4">
          <IncomeBreakdown items={breakdownItems} />
          <TransactionsOverviewCard cashFlowDays={cashFlowDays} compact />
        </div>
        <div className="xl:col-span-8">
          <UpcomingTransactions
            autopayAmount={upcomingIncomes[0] ? formatMoney(upcomingIncomes[0].amountCents) : formatMoney(0)}
            emptyLabel={t("upcomingEmpty")}
            highlightLabel={t("upcomingHighlight")}
            items={upcomingItems}
            summaryLabel={t("upcomingSummary", { count: upcomingIncomes.length })}
            title={t("upcomingTitle")}
            total={formatMoney(upcomingTotalCents)}
          />
        </div>
      </div>

      <FinanceTransactionsTable mode="incomes" />
    </div>
  );
}
