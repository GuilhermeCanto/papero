"use client";

import * as React from "react";

import { isDatabaseMode as resolveIsDatabaseMode } from "@/config/papero-mode";

import { type FinanceAccount, getDefaultFinanceAccount, useFinanceAccounts } from "./finance-accounts-store";

type CreateFinanceAccountInput = Omit<FinanceAccount, "createdAt" | "id" | "updatedAt">;
type UpdateFinanceAccountInput = Partial<Omit<FinanceAccount, "createdAt" | "id">>;

type FinanceAccountsApiResponse = {
  accounts?: FinanceAccount[];
  error?: string;
};

type FinanceAccountApiResponse = {
  account?: FinanceAccount;
  error?: string;
};

export type FinanceAccountsData = {
  accounts: FinanceAccount[];
  archiveAccount: (id: string) => Promise<FinanceAccount | undefined>;
  createAccount: (account: CreateFinanceAccountInput) => Promise<FinanceAccount>;
  defaultAccount: FinanceAccount;
  error: string | null;
  isDatabaseMode: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  replaceAccounts: (accounts: FinanceAccount[]) => void;
  setAccounts: React.Dispatch<React.SetStateAction<FinanceAccount[]>>;
  updateAccount: (id: string, patch: UpdateFinanceAccountInput) => Promise<FinanceAccount | undefined>;
};

function getApiErrorMessage(response: Response, fallback: string) {
  return response
    .json()
    .then((body: { error?: unknown }) => (typeof body.error === "string" ? body.error : fallback))
    .catch(() => fallback);
}

function isFinanceAccount(value: unknown): value is FinanceAccount {
  if (!value || typeof value !== "object") return false;

  const account = value as Partial<FinanceAccount>;
  return (
    typeof account.id === "string" &&
    typeof account.name === "string" &&
    typeof account.type === "string" &&
    typeof account.currency === "string" &&
    typeof account.openingBalanceCents === "number" &&
    typeof account.archived === "boolean" &&
    typeof account.createdAt === "string" &&
    typeof account.updatedAt === "string"
  );
}

function normalizeApiAccounts(accounts: unknown) {
  return Array.isArray(accounts) ? accounts.filter(isFinanceAccount) : [];
}

export function useFinanceAccountsData(): FinanceAccountsData {
  const localAccounts = useFinanceAccounts();
  const isDatabaseMode = resolveIsDatabaseMode();
  const [databaseAccounts, setDatabaseAccounts] = React.useState<FinanceAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!isDatabaseMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/finance/accounts", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Could not load finance accounts."));
      }

      const body = (await response.json()) as FinanceAccountsApiResponse;
      setDatabaseAccounts(normalizeApiAccounts(body.accounts));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load finance accounts.");
      setDatabaseAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isDatabaseMode]);

  React.useEffect(() => {
    if (isDatabaseMode) {
      void refresh();
    }
  }, [isDatabaseMode, refresh]);

  const createAccount = React.useCallback(
    async (account: CreateFinanceAccountInput) => {
      if (!isDatabaseMode) {
        return localAccounts.createAccount(account);
      }

      setError(null);
      const response = await fetch("/api/finance/accounts", {
        body: JSON.stringify(account),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not create finance account.");
        setError(message);
        throw new Error(message);
      }

      const body = (await response.json()) as FinanceAccountApiResponse;
      const nextAccount = body.account;
      if (!isFinanceAccount(nextAccount)) {
        throw new Error("The finance account response was invalid.");
      }

      await refresh();
      return nextAccount;
    },
    [isDatabaseMode, localAccounts.createAccount, refresh],
  );

  const updateAccount = React.useCallback(
    async (id: string, patch: UpdateFinanceAccountInput) => {
      if (!isDatabaseMode) {
        localAccounts.updateAccount(id, patch);
        return;
      }

      setError(null);
      const response = await fetch(`/api/finance/accounts/${id}`, {
        body: JSON.stringify(patch),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not update finance account.");
        setError(message);
        throw new Error(message);
      }

      const body = (await response.json()) as FinanceAccountApiResponse;
      await refresh();
      return body.account;
    },
    [isDatabaseMode, localAccounts.updateAccount, refresh],
  );

  const archiveAccount = React.useCallback((id: string) => updateAccount(id, { archived: true }), [updateAccount]);

  const accounts = isDatabaseMode ? databaseAccounts : localAccounts.accounts;

  return {
    accounts,
    archiveAccount,
    createAccount,
    defaultAccount: getDefaultFinanceAccount(accounts),
    error,
    isDatabaseMode,
    isLoading,
    refresh,
    replaceAccounts: localAccounts.replaceAccounts,
    setAccounts: localAccounts.setAccounts,
    updateAccount,
  };
}
