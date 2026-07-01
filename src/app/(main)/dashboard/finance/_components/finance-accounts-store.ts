"use client";

import * as React from "react";

export type FinanceAccountType = "cash" | "checking" | "credit_card" | "investment" | "other" | "savings" | "wallet";
export type FinanceAccountCashFlowRole = "operating" | "reserve";

export type FinanceAccount = {
  archived: boolean;
  cashFlowRole: FinanceAccountCashFlowRole;
  createdAt: string;
  currency: string;
  id: string;
  institution?: string;
  name: string;
  openingBalanceCents: number;
  type: FinanceAccountType;
  updatedAt: string;
};

export const FINANCE_ACCOUNTS_STORAGE_KEY = "papero:finance-accounts:v1";
export const FINANCE_ACCOUNTS_UPDATE_EVENT = "papero:finance-accounts-updated";

const nowIso = "2026-06-01T00:00:00.000Z";

export const defaultFinanceAccount: FinanceAccount = {
  archived: false,
  cashFlowRole: "operating",
  createdAt: nowIso,
  currency: "BRL",
  id: "main-account",
  institution: "Papero",
  name: "Main account",
  openingBalanceCents: 0,
  type: "checking",
  updatedAt: nowIso,
};

function isFinanceAccountType(value: unknown): value is FinanceAccountType {
  return (
    value === "cash" ||
    value === "checking" ||
    value === "credit_card" ||
    value === "investment" ||
    value === "other" ||
    value === "savings" ||
    value === "wallet"
  );
}

function isFinanceAccountCashFlowRole(value: unknown): value is FinanceAccountCashFlowRole {
  return value === "operating" || value === "reserve";
}

function normalizeFinanceAccount(account: FinanceAccount) {
  return {
    ...account,
    cashFlowRole: isFinanceAccountCashFlowRole(account.cashFlowRole) ? account.cashFlowRole : "operating",
  };
}

function isFinanceAccount(value: unknown): value is FinanceAccount {
  if (!value || typeof value !== "object") return false;

  const account = value as Partial<FinanceAccount>;
  return (
    typeof account.id === "string" &&
    typeof account.name === "string" &&
    isFinanceAccountType(account.type) &&
    (account.cashFlowRole === undefined || isFinanceAccountCashFlowRole(account.cashFlowRole)) &&
    typeof account.currency === "string" &&
    typeof account.openingBalanceCents === "number" &&
    typeof account.archived === "boolean" &&
    typeof account.createdAt === "string" &&
    typeof account.updatedAt === "string" &&
    (account.institution === undefined || typeof account.institution === "string")
  );
}

function uniqueAccountsById(accounts: FinanceAccount[]) {
  const seenAccountIds = new Set<string>();

  return accounts.map(normalizeFinanceAccount).filter((account) => {
    if (seenAccountIds.has(account.id)) return false;

    seenAccountIds.add(account.id);
    return true;
  });
}

function normalizeAccountName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function createAccountId(name: string) {
  const slug = normalizeAccountName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `account-${slug || "custom"}-${crypto.randomUUID()}`;
  }

  return `account-${slug || "custom"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredAccounts() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FINANCE_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return uniqueAccountsById(parsed.filter(isFinanceAccount));
  } catch {
    return [];
  }
}

function writeStoredAccounts(accounts: FinanceAccount[]) {
  const uniqueAccounts = uniqueAccountsById(accounts);

  window.localStorage.setItem(FINANCE_ACCOUNTS_STORAGE_KEY, JSON.stringify(uniqueAccounts));
  window.dispatchEvent(new CustomEvent(FINANCE_ACCOUNTS_UPDATE_EVENT, { detail: uniqueAccounts }));
}

export function getDefaultFinanceAccount(accounts: FinanceAccount[] = []) {
  return (
    accounts.find((account) => !account.archived && account.id === defaultFinanceAccount.id) ?? defaultFinanceAccount
  );
}

export function getFinanceAccountsWithFallback(accounts: FinanceAccount[]) {
  const uniqueAccounts = uniqueAccountsById(accounts);
  return uniqueAccounts.length > 0 ? uniqueAccounts : [defaultFinanceAccount];
}

export function useFinanceAccounts() {
  const [accounts, setAccountsState] = React.useState<FinanceAccount[]>([]);

  React.useEffect(() => {
    setAccountsState(readStoredAccounts());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FINANCE_ACCOUNTS_STORAGE_KEY) {
        setAccountsState(readStoredAccounts());
      }
    };

    const handleCustomUpdate = (event: Event) => {
      const nextAccounts = (event as CustomEvent<FinanceAccount[]>).detail;
      if (Array.isArray(nextAccounts)) {
        setAccountsState(uniqueAccountsById(nextAccounts.filter(isFinanceAccount)));
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FINANCE_ACCOUNTS_UPDATE_EVENT, handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FINANCE_ACCOUNTS_UPDATE_EVENT, handleCustomUpdate);
    };
  }, []);

  const setAccounts = React.useCallback((updater: React.SetStateAction<FinanceAccount[]>) => {
    const currentAccounts = readStoredAccounts();
    const nextAccounts = typeof updater === "function" ? updater(currentAccounts) : updater;

    writeStoredAccounts(nextAccounts);
    setAccountsState(uniqueAccountsById(nextAccounts));
  }, []);

  const createAccount = React.useCallback(
    (account: Omit<FinanceAccount, "createdAt" | "id" | "updatedAt">) => {
      const timestamp = new Date().toISOString();
      const nextAccount = {
        ...account,
        id: createAccountId(account.name),
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      setAccounts((currentAccounts) => [nextAccount, ...currentAccounts]);
      return nextAccount;
    },
    [setAccounts],
  );

  const updateAccount = React.useCallback(
    (id: string, patch: Partial<Omit<FinanceAccount, "createdAt" | "id">>) => {
      setAccounts((currentAccounts) =>
        currentAccounts.map((account) =>
          account.id === id ? { ...account, ...patch, updatedAt: new Date().toISOString() } : account,
        ),
      );
    },
    [setAccounts],
  );

  const archiveAccount = React.useCallback((id: string) => updateAccount(id, { archived: true }), [updateAccount]);

  const replaceAccounts = React.useCallback(
    (nextAccounts: FinanceAccount[]) => setAccounts(nextAccounts),
    [setAccounts],
  );

  return {
    accounts,
    archiveAccount,
    createAccount,
    defaultAccount: getDefaultFinanceAccount(accounts),
    replaceAccounts,
    setAccounts,
    updateAccount,
  };
}
