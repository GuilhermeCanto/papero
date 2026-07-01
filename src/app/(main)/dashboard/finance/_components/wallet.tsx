import { Banknote, Building2, CreditCard, Landmark, PiggyBank, WalletCards } from "lucide-react";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

import type { FinanceAccountType } from "./finance-accounts-store";
import type { AccountBalanceSummary } from "./finance-calculations";

const accountTypeIcons: Record<FinanceAccountType, typeof Landmark> = {
  cash: Banknote,
  checking: Landmark,
  credit_card: CreditCard,
  investment: PiggyBank,
  other: Building2,
  savings: PiggyBank,
  wallet: WalletCards,
};

export function Wallet({
  accounts,
  activeAccountsLabel = "Active accounts",
  sourceLabel = "Local",
  statusLine,
  title = "Accounts",
}: {
  activeAccountsLabel?: string;
  accounts: AccountBalanceSummary[];
  sourceLabel?: string;
  statusLine?: string;
  title?: string;
}) {
  const visibleAccounts = accounts.filter((summary) => !summary.account.archived);
  const accountStatusLine =
    statusLine ??
    `${visibleAccounts.length} ${visibleAccounts.length === 1 ? "account" : "accounts"} available locally`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          {visibleAccounts.map((summary) => {
            const Icon = accountTypeIcons[summary.account.type];

            return (
              <div key={summary.account.id} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-foreground text-sm leading-none">
                      {summary.account.name}
                    </span>
                  </div>
                  <PrivacyValue className="font-normal text-muted-foreground text-xs">
                    {formatCurrency(summary.currentBalanceCents / 100, {
                      currency: summary.account.currency,
                      locale: "pt-BR",
                    })}
                  </PrivacyValue>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Icon className="size-4" />
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
              {activeAccountsLabel}
            </span>
            <span className="text-muted-foreground text-xs">{accountStatusLine}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="font-bold text-[9px] text-green-500 uppercase tracking-widest">{sourceLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
