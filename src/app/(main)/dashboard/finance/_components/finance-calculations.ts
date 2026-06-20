import type { FinanceTransaction, TransactionKind } from "./finance-transactions-store";

export type UpcomingFinanceItem = FinanceTransaction & {
  parsedDate: Date;
};

export type CashFlowDay = {
  date: Date;
  day: number;
  expenseCents: number;
  incomeCents: number;
  netCents: number;
};

export type DashboardFinanceMetrics = {
  availableCashCents: number;
  cashHealthScore: number;
  currentBalanceCents: number;
  currentMonthExpenseCents: number;
  currentMonthIncomeCents: number;
  currentMonthResultCents: number;
  forecastedEndOfMonthBalanceCents: number;
  overdueAmountCents: number;
  overdueTransactions: FinanceTransaction[];
  paidExpenseCents: number;
  paidIncomeCents: number;
  recentTransactions: FinanceTransaction[];
  upcomingBills: UpcomingFinanceItem[];
  upcomingBillsAmountCents: number;
  upcomingIncomes: UpcomingFinanceItem[];
  upcomingIncomesAmountCents: number;
};

export type CategoryAmountTotal = {
  amountCents: number;
  category: string;
  share: number;
};

export type TransactionUsage = {
  count: number;
  openAmountCents: number;
  paidAmountCents: number;
  totalAmountCents: number;
};

const EXPENSE_KINDS = new Set<TransactionKind>(["fixed", "variable", "people", "taxes", "transfer"]);

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameMonth(date: Date, monthDate: Date) {
  return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
}

function compareTransactionsByDate(a: FinanceTransaction, b: FinanceTransaction) {
  const aDate = parseFinanceDate(a.date)?.getTime() ?? 0;
  const bDate = parseFinanceDate(b.date)?.getTime() ?? 0;

  return bDate - aDate;
}

function getSignedAmountCents(transaction: FinanceTransaction) {
  return isIncomeTransaction(transaction) ? transaction.amountCents : -transaction.amountCents;
}

function getUniqueTransactionsById(transactions: FinanceTransaction[]) {
  const seenTransactionIds = new Set<string>();

  return transactions.filter((transaction) => {
    if (seenTransactionIds.has(transaction.id)) return false;

    seenTransactionIds.add(transaction.id);
    return true;
  });
}

export function getFinanceUsageKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function createEmptyUsage(): TransactionUsage {
  return {
    count: 0,
    openAmountCents: 0,
    paidAmountCents: 0,
    totalAmountCents: 0,
  };
}

function addTransactionUsage(usage: Record<string, TransactionUsage>, key: string, transaction: FinanceTransaction) {
  if (!key) return usage;

  const currentUsage = usage[key] ?? createEmptyUsage();
  usage[key] = {
    count: currentUsage.count + 1,
    openAmountCents: currentUsage.openAmountCents + (transaction.paid ? 0 : transaction.amountCents),
    paidAmountCents: currentUsage.paidAmountCents + (transaction.paid ? transaction.amountCents : 0),
    totalAmountCents: currentUsage.totalAmountCents + transaction.amountCents,
  };

  return usage;
}

export function parseFinanceDate(date: string): Date | null {
  const trimmedDate = date.trim();
  if (!trimmedDate) return null;

  const brazilianMatch = trimmedDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brazilianMatch) {
    const [, day, month, year] = brazilianMatch;
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      parsedDate.getFullYear() === Number(year) &&
      parsedDate.getMonth() === Number(month) - 1 &&
      parsedDate.getDate() === Number(day)
    ) {
      return parsedDate;
    }

    return null;
  }

  const isoDate = new Date(trimmedDate);
  return Number.isNaN(isoDate.getTime()) ? null : isoDate;
}

export function isIncomeTransaction(transaction: FinanceTransaction) {
  return transaction.kind === "income";
}

export function isExpenseTransaction(transaction: FinanceTransaction) {
  return EXPENSE_KINDS.has(transaction.kind);
}

export function getMonthTransactions(transactions: FinanceTransaction[], monthDate: Date) {
  return getUniqueTransactionsById(transactions).filter((transaction) => {
    const transactionDate = parseFinanceDate(transaction.date);
    return transactionDate ? isSameMonth(transactionDate, monthDate) : false;
  });
}

export function sumAmountCents(transactions: FinanceTransaction[]) {
  return getUniqueTransactionsById(transactions).reduce((total, transaction) => total + transaction.amountCents, 0);
}

export function sumIncomeCents(transactions: FinanceTransaction[]) {
  return sumAmountCents(transactions.filter(isIncomeTransaction));
}

export function sumExpenseCents(transactions: FinanceTransaction[]) {
  return sumAmountCents(transactions.filter(isExpenseTransaction));
}

export function sumPaidIncomeCents(transactions: FinanceTransaction[]) {
  return sumAmountCents(transactions.filter((transaction) => transaction.paid && isIncomeTransaction(transaction)));
}

export function sumPaidExpenseCents(transactions: FinanceTransaction[]) {
  return sumAmountCents(transactions.filter((transaction) => transaction.paid && isExpenseTransaction(transaction)));
}

export function getMonthlyIncomeCents(transactions: FinanceTransaction[], monthDate: Date) {
  return sumIncomeCents(getMonthTransactions(transactions, monthDate));
}

export function getMonthlyExpenseCents(transactions: FinanceTransaction[], monthDate: Date) {
  return sumExpenseCents(getMonthTransactions(transactions, monthDate));
}

export function getMonthlyResultCents(transactions: FinanceTransaction[], monthDate: Date) {
  const monthTransactions = getMonthTransactions(transactions, monthDate);

  return sumIncomeCents(monthTransactions) - sumExpenseCents(monthTransactions);
}

export function getCurrentBalanceCents(transactions: FinanceTransaction[]) {
  return getUniqueTransactionsById(transactions)
    .filter((transaction) => transaction.paid)
    .reduce((total, transaction) => total + getSignedAmountCents(transaction), 0);
}

export function getAvailableCashCents(transactions: FinanceTransaction[]) {
  return getCurrentBalanceCents(transactions);
}

export function getUpcomingBills(transactions: FinanceTransaction[], today: Date, limit: number) {
  const todayStart = startOfDay(today);

  return transactions
    .map((transaction) => ({ ...transaction, parsedDate: parseFinanceDate(transaction.date) }))
    .filter(
      (transaction): transaction is UpcomingFinanceItem =>
        transaction.parsedDate !== null &&
        !transaction.paid &&
        isExpenseTransaction(transaction) &&
        transaction.parsedDate >= todayStart,
    )
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
    .slice(0, limit);
}

export function getUpcomingIncomes(transactions: FinanceTransaction[], today: Date, limit: number) {
  const todayStart = startOfDay(today);

  return transactions
    .map((transaction) => ({ ...transaction, parsedDate: parseFinanceDate(transaction.date) }))
    .filter(
      (transaction): transaction is UpcomingFinanceItem =>
        transaction.parsedDate !== null &&
        !transaction.paid &&
        isIncomeTransaction(transaction) &&
        transaction.parsedDate >= todayStart,
    )
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
    .slice(0, limit);
}

export function getOverdueTransactions(transactions: FinanceTransaction[], today: Date) {
  const todayStart = startOfDay(today);

  return transactions.filter((transaction) => {
    const transactionDate = parseFinanceDate(transaction.date);

    return transactionDate !== null && !transaction.paid && transactionDate < todayStart;
  });
}

export function groupTransactionsByKind(transactions: FinanceTransaction[]) {
  return transactions.reduce<Record<TransactionKind, FinanceTransaction[]>>(
    (groups, transaction) => {
      groups[transaction.kind].push(transaction);
      return groups;
    },
    {
      fixed: [],
      income: [],
      people: [],
      taxes: [],
      transfer: [],
      variable: [],
    },
  );
}

export function groupTransactionsByCategory(transactions: FinanceTransaction[]) {
  return transactions.reduce<Record<string, FinanceTransaction[]>>((groups, transaction) => {
    const category = transaction.category || "Uncategorized";
    groups[category] = [...(groups[category] ?? []), transaction];

    return groups;
  }, {});
}

export function countTransactionsByCategory(transactions: FinanceTransaction[]) {
  return transactions.reduce<Record<string, number>>((counts, transaction) => {
    const key = getFinanceUsageKey(transaction.category);
    if (!key) return counts;

    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function countTransactionsByContact(transactions: FinanceTransaction[]) {
  return transactions.reduce<Record<string, number>>((counts, transaction) => {
    const key = getFinanceUsageKey(transaction.from);
    if (!key) return counts;

    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function sumTransactionsByContact(transactions: FinanceTransaction[]) {
  return transactions.reduce<Record<string, number>>((totals, transaction) => {
    const key = getFinanceUsageKey(transaction.from);
    if (!key) return totals;

    totals[key] = (totals[key] ?? 0) + transaction.amountCents;
    return totals;
  }, {});
}

export function getCategoryUsage(transactions: FinanceTransaction[]) {
  return transactions.reduce<Record<string, TransactionUsage>>((usage, transaction) => {
    const key = getFinanceUsageKey(transaction.category);

    return addTransactionUsage(usage, key, transaction);
  }, {});
}

export function getContactUsage(transactions: FinanceTransaction[]) {
  return transactions.reduce<Record<string, TransactionUsage>>((usage, transaction) => {
    const key = getFinanceUsageKey(transaction.from);

    return addTransactionUsage(usage, key, transaction);
  }, {});
}

export function getCustomerUsage(transactions: FinanceTransaction[]) {
  return getContactUsage(transactions.filter(isIncomeTransaction));
}

export function getSupplierUsage(transactions: FinanceTransaction[]) {
  return getContactUsage(transactions.filter(isExpenseTransaction));
}

export function getTopCategoriesByAmount(transactions: FinanceTransaction[], limit: number): CategoryAmountTotal[] {
  const groupedTransactions = groupTransactionsByCategory(transactions);
  const totalAmountCents = sumAmountCents(transactions);

  return Object.entries(groupedTransactions)
    .map(([category, categoryTransactions]) => {
      const amountCents = sumAmountCents(categoryTransactions);

      return {
        amountCents,
        category,
        share: totalAmountCents > 0 ? Math.round((amountCents / totalAmountCents) * 100) : 0,
      };
    })
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, limit);
}

export function getCashFlowByDay(transactions: FinanceTransaction[], monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const daysInMonth = endOfMonth(monthDate).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index): CashFlowDay => {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1);

    return {
      date,
      day: index + 1,
      expenseCents: 0,
      incomeCents: 0,
      netCents: 0,
    };
  });

  for (const transaction of getMonthTransactions(transactions, monthDate)) {
    const transactionDate = parseFinanceDate(transaction.date);
    if (!transactionDate) continue;

    const day = days[transactionDate.getDate() - 1];
    if (!day) continue;

    if (isIncomeTransaction(transaction)) {
      day.incomeCents += transaction.amountCents;
    }

    if (isExpenseTransaction(transaction)) {
      day.expenseCents += transaction.amountCents;
    }

    day.netCents = day.incomeCents - day.expenseCents;
  }

  return days;
}

export function getForecastedEndOfMonthBalanceCents(transactions: FinanceTransaction[], monthDate: Date) {
  const monthTransactions = getMonthTransactions(transactions, monthDate);
  const openMonthTransactions = monthTransactions.filter((transaction) => !transaction.paid);
  const openProjectedCents = openMonthTransactions.reduce(
    (total, transaction) => total + getSignedAmountCents(transaction),
    0,
  );

  return getCurrentBalanceCents(transactions) + openProjectedCents;
}

export function getCashHealthScore(transactions: FinanceTransaction[], today: Date) {
  const currentBalanceCents = getCurrentBalanceCents(transactions);
  const monthResultCents = getMonthlyResultCents(transactions, today);
  const overdueTransactions = getOverdueTransactions(transactions, today);
  const overdueAmountCents = sumExpenseCents(overdueTransactions);
  const upcomingBillsAmountCents = sumAmountCents(getUpcomingBills(transactions, today, Number.POSITIVE_INFINITY));
  const upcomingIncomesAmountCents = sumAmountCents(getUpcomingIncomes(transactions, today, Number.POSITIVE_INFINITY));

  let score = 50;

  score += monthResultCents >= 0 ? 20 : -20;
  score += currentBalanceCents > 0 ? 15 : -15;
  score += overdueAmountCents === 0 ? 15 : -Math.min(25, Math.ceil(overdueAmountCents / 10_000));
  score += upcomingIncomesAmountCents >= upcomingBillsAmountCents ? 10 : -10;

  return Math.max(0, Math.min(100, score));
}

export function getRecentTransactions(transactions: FinanceTransaction[], limit: number) {
  return [...transactions].sort(compareTransactionsByDate).slice(0, limit);
}

export function getDashboardFinanceMetrics(transactions: FinanceTransaction[], today: Date): DashboardFinanceMetrics {
  const uniqueTransactions = getUniqueTransactionsById(transactions);
  const currentMonthTransactions = getMonthTransactions(uniqueTransactions, today);
  const upcomingBills = getUpcomingBills(uniqueTransactions, today, 3);
  const upcomingIncomes = getUpcomingIncomes(uniqueTransactions, today, 3);
  const overdueTransactions = getOverdueTransactions(uniqueTransactions, today);

  return {
    availableCashCents: getAvailableCashCents(uniqueTransactions),
    cashHealthScore: getCashHealthScore(uniqueTransactions, today),
    currentBalanceCents: getCurrentBalanceCents(uniqueTransactions),
    currentMonthExpenseCents: sumExpenseCents(currentMonthTransactions),
    currentMonthIncomeCents: sumIncomeCents(currentMonthTransactions),
    currentMonthResultCents: getMonthlyResultCents(uniqueTransactions, today),
    forecastedEndOfMonthBalanceCents: getForecastedEndOfMonthBalanceCents(uniqueTransactions, today),
    overdueAmountCents: sumExpenseCents(overdueTransactions),
    overdueTransactions,
    paidExpenseCents: sumPaidExpenseCents(currentMonthTransactions),
    paidIncomeCents: sumPaidIncomeCents(currentMonthTransactions),
    recentTransactions: getRecentTransactions(uniqueTransactions, 5),
    upcomingBills,
    upcomingBillsAmountCents: sumAmountCents(upcomingBills),
    upcomingIncomes,
    upcomingIncomesAmountCents: sumAmountCents(upcomingIncomes),
  };
}
