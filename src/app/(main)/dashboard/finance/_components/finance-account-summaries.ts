"use client";

import type { FinanceAccount } from "./finance-accounts-store";
import type { AccountBalanceSummary } from "./finance-calculations";

export function getOpeningBalanceAccountSummaries(accounts: FinanceAccount[]): AccountBalanceSummary[] {
  const activeAccounts = accounts.filter((account) => !account.archived);
  const totalPositiveBalanceCents = activeAccounts.reduce(
    (total, account) => total + Math.max(0, account.openingBalanceCents),
    0,
  );

  return activeAccounts.map((account) => ({
    account,
    currentBalanceCents: account.openingBalanceCents,
    movementCount: 0,
    projectedBalanceCents: account.openingBalanceCents,
    share:
      totalPositiveBalanceCents > 0
        ? Math.round((Math.max(0, account.openingBalanceCents) / totalPositiveBalanceCents) * 100)
        : 0,
  }));
}
