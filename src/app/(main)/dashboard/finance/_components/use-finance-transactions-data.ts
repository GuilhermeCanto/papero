"use client";

import * as React from "react";

import { isDatabaseMode as resolveIsDatabaseMode } from "@/config/papero-mode";

import {
  FINANCE_TRANSACTIONS_UPDATE_EVENT,
  type FinanceTransaction,
  type TransactionKind,
  useFinanceTransactions,
} from "./finance-transactions-store";

type CreateFinanceTransactionInput = Omit<FinanceTransaction, "createdAt" | "id" | "updatedAt">;
type UpdateFinanceTransactionInput = Partial<Omit<FinanceTransaction, "createdAt" | "id" | "updatedAt">>;

type FinanceTransactionsApiResponse = {
  error?: string;
  transactions?: FinanceTransaction[];
};

type FinanceTransactionApiResponse = {
  error?: string;
  transaction?: FinanceTransaction;
};

export type FinanceTransactionsData = {
  addTransaction: (transaction: CreateFinanceTransactionInput) => Promise<FinanceTransaction>;
  deleteTransaction: (id: string) => Promise<void>;
  error: string | null;
  isDatabaseMode: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  transactions: FinanceTransaction[];
  updateTransaction: (id: string, patch: UpdateFinanceTransactionInput) => Promise<FinanceTransaction | undefined>;
};

function getApiErrorMessage(response: Response, fallback: string) {
  return response
    .json()
    .then((body: { error?: unknown }) => (typeof body.error === "string" ? body.error : fallback))
    .catch(() => fallback);
}

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

function isFinanceTransaction(value: unknown): value is FinanceTransaction {
  if (!value || typeof value !== "object") return false;

  const transaction = value as Partial<FinanceTransaction>;
  return (
    typeof transaction.id === "string" &&
    typeof transaction.amountCents === "number" &&
    typeof transaction.category === "string" &&
    typeof transaction.date === "string" &&
    typeof transaction.description === "string" &&
    typeof transaction.from === "string" &&
    isTransactionKind(transaction.kind) &&
    typeof transaction.paid === "boolean" &&
    typeof transaction.paymentMode === "string" &&
    (transaction.paymentTime === "cash" ||
      transaction.paymentTime === "installment" ||
      transaction.paymentTime === "recurring") &&
    typeof transaction.paymentType === "string"
  );
}

function normalizeApiTransactions(transactions: unknown) {
  return Array.isArray(transactions) ? transactions.filter(isFinanceTransaction) : [];
}

function notifyFinanceTransactionsUpdated(transactions: FinanceTransaction[]) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(FINANCE_TRANSACTIONS_UPDATE_EVENT, { detail: transactions }));
}

export function useFinanceTransactionsData(): FinanceTransactionsData {
  const localTransactions = useFinanceTransactions([]);
  const isDatabaseMode = resolveIsDatabaseMode();
  const [databaseTransactions, setDatabaseTransactions] = React.useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!isDatabaseMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/finance/transactions", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Could not load finance transactions."));
      }

      const body = (await response.json()) as FinanceTransactionsApiResponse;
      const nextTransactions = normalizeApiTransactions(body.transactions);
      setDatabaseTransactions(nextTransactions);
      notifyFinanceTransactionsUpdated(nextTransactions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load finance transactions.");
      setDatabaseTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isDatabaseMode]);

  React.useEffect(() => {
    if (isDatabaseMode) {
      void refresh();
    }
  }, [isDatabaseMode, refresh]);

  React.useEffect(() => {
    if (!isDatabaseMode || typeof window === "undefined") return;

    const handleCustomUpdate = (event: Event) => {
      const nextTransactions = (event as CustomEvent<FinanceTransaction[]>).detail;
      if (Array.isArray(nextTransactions)) {
        setDatabaseTransactions(normalizeApiTransactions(nextTransactions));
      }
    };

    window.addEventListener(FINANCE_TRANSACTIONS_UPDATE_EVENT, handleCustomUpdate);

    return () => {
      window.removeEventListener(FINANCE_TRANSACTIONS_UPDATE_EVENT, handleCustomUpdate);
    };
  }, [isDatabaseMode]);

  const addTransaction = React.useCallback(
    async (transaction: CreateFinanceTransactionInput) => {
      if (!isDatabaseMode) {
        return localTransactions.addTransaction(transaction);
      }

      setError(null);
      const response = await fetch("/api/finance/transactions", {
        body: JSON.stringify(transaction),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not create finance transaction.");
        setError(message);
        throw new Error(message);
      }

      const body = (await response.json()) as FinanceTransactionApiResponse;
      const nextTransaction = body.transaction;
      if (!isFinanceTransaction(nextTransaction)) {
        throw new Error("The finance transaction response was invalid.");
      }

      setDatabaseTransactions((current) => {
        const nextTransactions = [nextTransaction, ...current];
        notifyFinanceTransactionsUpdated(nextTransactions);
        return nextTransactions;
      });
      return nextTransaction;
    },
    [isDatabaseMode, localTransactions.addTransaction],
  );

  const updateTransaction = React.useCallback(
    async (id: string, patch: UpdateFinanceTransactionInput) => {
      if (!isDatabaseMode) {
        let nextTransaction: FinanceTransaction | undefined;
        localTransactions.setTransactions((current) =>
          current.map((transaction) => {
            if (transaction.id !== id) return transaction;

            nextTransaction = {
              ...transaction,
              ...patch,
            };
            return nextTransaction;
          }),
        );

        return nextTransaction;
      }

      setError(null);
      const previousTransactions = databaseTransactions;
      let optimisticTransaction: FinanceTransaction | undefined;

      setDatabaseTransactions((current) =>
        current.map((transaction) => {
          if (transaction.id !== id) return transaction;

          optimisticTransaction = {
            ...transaction,
            ...patch,
          };
          return optimisticTransaction;
        }),
      );

      const response = await fetch(`/api/finance/transactions/${id}`, {
        body: JSON.stringify(patch),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not update finance transaction.");
        setError(message);
        setDatabaseTransactions(previousTransactions);
        throw new Error(message);
      }

      const body = (await response.json()) as FinanceTransactionApiResponse;
      const updatedTransaction = body.transaction;
      if (isFinanceTransaction(updatedTransaction)) {
        setDatabaseTransactions((current) => {
          const nextTransactions = current.map((transaction) =>
            transaction.id === id ? updatedTransaction : transaction,
          );
          notifyFinanceTransactionsUpdated(nextTransactions);
          return nextTransactions;
        });
        return updatedTransaction;
      }

      return optimisticTransaction;
    },
    [databaseTransactions, isDatabaseMode, localTransactions.setTransactions],
  );

  const deleteTransaction = React.useCallback(
    async (id: string) => {
      if (!isDatabaseMode) {
        localTransactions.setTransactions((current) => current.filter((transaction) => transaction.id !== id));
        return;
      }

      setError(null);
      const previousTransactions = databaseTransactions;
      setDatabaseTransactions((current) => current.filter((transaction) => transaction.id !== id));

      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not delete finance transaction.");
        setError(message);
        setDatabaseTransactions(previousTransactions);
        notifyFinanceTransactionsUpdated(previousTransactions);
        throw new Error(message);
      }

      notifyFinanceTransactionsUpdated(databaseTransactions.filter((transaction) => transaction.id !== id));
    },
    [databaseTransactions, isDatabaseMode, localTransactions.setTransactions],
  );

  return {
    addTransaction,
    deleteTransaction,
    error,
    isDatabaseMode,
    isLoading,
    refresh,
    transactions: isDatabaseMode ? databaseTransactions : localTransactions.transactions,
    updateTransaction,
  };
}
