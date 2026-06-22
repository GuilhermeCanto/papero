"use client";

import { useTranslations } from "next-intl";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  defaultFinanceAccount,
  type FinanceAccount,
  getDefaultFinanceAccount,
  getFinanceAccountsWithFallback,
} from "./finance-accounts-store";

export function getSelectableFinanceAccounts(accounts: FinanceAccount[], value?: string) {
  const accountsWithFallback = getFinanceAccountsWithFallback(accounts);
  const defaultAccount = getDefaultFinanceAccount(accountsWithFallback);
  const activeAccounts = accountsWithFallback.filter((account) => !account.archived);
  const selectableActiveAccounts = activeAccounts.length > 0 ? activeAccounts : [defaultAccount];
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

export function getFinanceAccountName(accounts: FinanceAccount[], value?: string) {
  const accountsWithFallback = getFinanceAccountsWithFallback(accounts);
  const selectedAccount = accountsWithFallback.find((account) => account.id === value);

  return selectedAccount?.name ?? getDefaultFinanceAccount(accountsWithFallback).name;
}

export function AccountSelect({
  accounts,
  onChange,
  size = "sm",
  triggerClassName,
  value,
}: {
  accounts: FinanceAccount[];
  onChange: (accountId: string) => void;
  size?: "default" | "sm";
  triggerClassName?: string;
  value?: string;
}) {
  const t = useTranslations("Dashboard.financeTransactions.accountSelect");
  const { accounts: selectableAccounts } = getSelectableFinanceAccounts(accounts, value);
  const selectedAccountId = resolveFinanceAccountId(accounts, value);

  return (
    <Select onValueChange={onChange} value={selectedAccountId}>
      <SelectTrigger className={triggerClassName} size={size}>
        <SelectValue placeholder={t("placeholder")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {selectableAccounts.map((account) => (
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
