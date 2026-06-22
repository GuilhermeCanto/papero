"use client";

import { useTranslations } from "next-intl";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  defaultFinanceAccount,
  type FinanceAccount,
  getDefaultFinanceAccount,
  getFinanceAccountsWithFallback,
} from "./finance-accounts-store";

type FinanceAccountSelectionOptions = {
  withFallback?: boolean;
};

export function getSelectableFinanceAccounts(
  accounts: FinanceAccount[],
  value?: string,
  { withFallback = true }: FinanceAccountSelectionOptions = {},
) {
  const accountsWithFallback = withFallback ? getFinanceAccountsWithFallback(accounts) : accounts;
  const defaultAccount = getDefaultFinanceAccount(accountsWithFallback);
  const activeAccounts = accountsWithFallback.filter((account) => !account.archived);
  const selectableActiveAccounts = activeAccounts.length > 0 ? activeAccounts : withFallback ? [defaultAccount] : [];
  const currentArchivedAccount = value
    ? accountsWithFallback.find((account) => account.archived && account.id === value)
    : undefined;

  return {
    accounts: currentArchivedAccount ? [...selectableActiveAccounts, currentArchivedAccount] : selectableActiveAccounts,
    defaultAccount,
  };
}

export function resolveFinanceAccountId(accounts: FinanceAccount[], value?: string) {
  const { accounts: selectableAccounts, defaultAccount } = getSelectableFinanceAccounts(accounts, value);
  const selectedAccount = selectableAccounts.find((account) => account.id === value);

  return selectedAccount?.id ?? defaultAccount.id ?? defaultFinanceAccount.id;
}

export function resolveSelectableFinanceAccountId(
  accounts: FinanceAccount[],
  value?: string,
  options?: FinanceAccountSelectionOptions,
) {
  const { accounts: selectableAccounts, defaultAccount } = getSelectableFinanceAccounts(accounts, value, options);
  const selectedAccount = selectableAccounts.find((account) => account.id === value);

  if (selectedAccount) return selectedAccount.id;
  if (options?.withFallback === false) return undefined;

  return defaultAccount.id ?? defaultFinanceAccount.id;
}

export function getFinanceAccountName(accounts: FinanceAccount[], value?: string) {
  const accountsWithFallback = getFinanceAccountsWithFallback(accounts);
  const selectedAccount = accountsWithFallback.find((account) => account.id === value);

  return selectedAccount?.name ?? getDefaultFinanceAccount(accountsWithFallback).name;
}

export function AccountSelect({
  allowEmpty = false,
  accounts,
  excludeAccountId,
  onChange,
  placeholder,
  size = "sm",
  triggerClassName,
  value,
  withFallback = true,
}: {
  allowEmpty?: boolean;
  accounts: FinanceAccount[];
  excludeAccountId?: string;
  onChange: (accountId: string) => void;
  placeholder?: string;
  size?: "default" | "sm";
  triggerClassName?: string;
  value?: string;
  withFallback?: boolean;
}) {
  const t = useTranslations("Dashboard.financeTransactions.accountSelect");
  const { accounts: selectableAccounts } = getSelectableFinanceAccounts(accounts, value, { withFallback });
  const visibleAccounts = excludeAccountId
    ? selectableAccounts.filter((account) => account.id !== excludeAccountId)
    : selectableAccounts;
  const selectedAccountId =
    allowEmpty && !value ? undefined : resolveSelectableFinanceAccountId(accounts, value, { withFallback });
  const selectedVisibleAccountId = visibleAccounts.some((account) => account.id === selectedAccountId)
    ? selectedAccountId
    : undefined;

  return (
    <Select onValueChange={onChange} value={selectedVisibleAccountId}>
      <SelectTrigger className={triggerClassName} size={size}>
        <SelectValue placeholder={placeholder ?? t("placeholder")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {visibleAccounts.map((account) => (
            <SelectItem disabled={account.archived} key={account.id} value={account.id}>
              {account.name}
              {account.archived ? ` · ${t("archived")}` : ""}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
