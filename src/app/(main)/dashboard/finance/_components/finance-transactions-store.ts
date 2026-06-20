"use client";

import * as React from "react";

export type TransactionKind = "income" | "fixed" | "variable" | "people" | "taxes" | "transfer";
export type PaymentTime = "cash" | "installment" | "recurring";

export type FinanceTransaction = {
  id: string;
  accountId?: string;
  amountCents: number;
  category: string;
  competenceDate?: string;
  date: string;
  description: string;
  documentNumber?: string;
  from: string;
  kind: TransactionKind;
  notes?: string;
  paid: boolean;
  paymentMode: string;
  paymentTime: PaymentTime;
  paymentType: string;
  tags?: string;
  transferTargetAccountId?: string;
};

export const FINANCE_TRANSACTIONS_STORAGE_KEY = "papero:finance-transactions:v1";
export const FINANCE_TRANSACTIONS_UPDATE_EVENT = "papero:finance-transactions-updated";

function isTransactionKind(value: unknown): value is TransactionKind {
  return (
    value === "income" ||
    value === "fixed" ||
    value === "variable" ||
    value === "people" ||
    value === "taxes" ||
    value === "transfer"
  );
}

function isPaymentTime(value: unknown): value is PaymentTime {
  return value === "cash" || value === "installment" || value === "recurring";
}

function isFinanceTransaction(value: unknown): value is FinanceTransaction {
  if (!value || typeof value !== "object") return false;

  const transaction = value as Partial<FinanceTransaction>;
  return (
    typeof transaction.id === "string" &&
    (transaction.accountId === undefined || typeof transaction.accountId === "string") &&
    typeof transaction.amountCents === "number" &&
    typeof transaction.category === "string" &&
    typeof transaction.date === "string" &&
    typeof transaction.description === "string" &&
    typeof transaction.from === "string" &&
    isTransactionKind(transaction.kind) &&
    typeof transaction.paid === "boolean" &&
    typeof transaction.paymentMode === "string" &&
    isPaymentTime(transaction.paymentTime) &&
    typeof transaction.paymentType === "string" &&
    (transaction.transferTargetAccountId === undefined || typeof transaction.transferTargetAccountId === "string")
  );
}

function uniqueTransactionsById(transactions: FinanceTransaction[]) {
  const seenTransactionIds = new Set<string>();

  return transactions.filter((transaction) => {
    if (seenTransactionIds.has(transaction.id)) return false;

    seenTransactionIds.add(transaction.id);
    return true;
  });
}

function readStoredTransactions(fallbackTransactions: FinanceTransaction[]) {
  if (typeof window === "undefined") return fallbackTransactions;

  try {
    const raw = window.localStorage.getItem(FINANCE_TRANSACTIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallbackTransactions;

    const transactions = parsed.filter(isFinanceTransaction);
    return uniqueTransactionsById(transactions);
  } catch {
    return fallbackTransactions;
  }
}

function writeStoredTransactions(transactions: FinanceTransaction[]) {
  const uniqueTransactions = uniqueTransactionsById(transactions);

  window.localStorage.setItem(FINANCE_TRANSACTIONS_STORAGE_KEY, JSON.stringify(uniqueTransactions));
  window.dispatchEvent(new CustomEvent(FINANCE_TRANSACTIONS_UPDATE_EVENT, { detail: uniqueTransactions }));

  return uniqueTransactions;
}

function createTransactionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `TXN-${crypto.randomUUID()}`;
  }

  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useFinanceTransactions(initialTransactions: FinanceTransaction[]) {
  const initialTransactionsRef = React.useRef(initialTransactions);
  const [transactions, setTransactionsState] = React.useState<FinanceTransaction[]>(initialTransactions);

  React.useEffect(() => {
    setTransactionsState(readStoredTransactions(initialTransactionsRef.current));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FINANCE_TRANSACTIONS_STORAGE_KEY) {
        setTransactionsState(readStoredTransactions(initialTransactionsRef.current));
      }
    };

    const handleCustomUpdate = (event: Event) => {
      const nextTransactions = (event as CustomEvent<FinanceTransaction[]>).detail;
      if (Array.isArray(nextTransactions)) {
        setTransactionsState(nextTransactions.filter(isFinanceTransaction));
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FINANCE_TRANSACTIONS_UPDATE_EVENT, handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FINANCE_TRANSACTIONS_UPDATE_EVENT, handleCustomUpdate);
    };
  }, []);

  const setTransactions = React.useCallback((updater: React.SetStateAction<FinanceTransaction[]>) => {
    const currentTransactions = readStoredTransactions(initialTransactionsRef.current);
    const nextTransactions = typeof updater === "function" ? updater(currentTransactions) : updater;

    const uniqueTransactions = writeStoredTransactions(nextTransactions);
    setTransactionsState(uniqueTransactions);
  }, []);

  const addTransaction = React.useCallback(
    (transaction: Omit<FinanceTransaction, "id">) => {
      const nextTransaction = {
        ...transaction,
        id: createTransactionId(),
      };

      setTransactions((current) => [nextTransaction, ...current]);
      return nextTransaction;
    },
    [setTransactions],
  );

  return {
    addTransaction,
    setTransactions,
    transactions,
  };
}
