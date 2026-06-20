"use client";

import { ChevronRight, Receipt, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { siClaude, siLinear, siResend } from "simple-icons";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { SimpleIcon } from "@/components/simple-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";

export type UpcomingTransactionItem = {
  amount: string;
  category: string;
  date: string;
  id: string;
  title: string;
};

type UpcomingTransactionsProps = {
  autopayAmount?: string;
  emptyLabel?: string;
  highlightLabel?: string;
  descriptionCount?: number;
  items?: UpcomingTransactionItem[];
  summaryLabel?: string;
  title?: string;
  total?: string;
};

export function UpcomingTransactions({
  autopayAmount,
  descriptionCount,
  emptyLabel,
  highlightLabel,
  items,
  summaryLabel,
  title,
  total,
}: UpcomingTransactionsProps) {
  const t = useTranslations("Dashboard.upcoming");

  const fallbackTransactions = [
    {
      id: 1,
      title: t("items.claude").split(" · ")[0],
      date: t("items.claude").split(" · ").slice(1).join(" · "),
      icon: siClaude,
    },
    {
      id: 2,
      title: t("items.resend").split(" · ")[0],
      date: t("items.resend").split(" · ").slice(1).join(" · "),
      icon: siResend,
    },
    {
      id: 3,
      title: t("items.linear").split(" · ")[0],
      date: t("items.linear").split(" · ").slice(1).join(" · "),
      icon: siLinear,
    },
  ];
  const hasRealItems = Boolean(items);
  const transactions = items ?? fallbackTransactions;
  const [totalValue, totalCents = ""] = (total ?? `${t("total")}${t("totalCents")}`).split(",");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{title ?? t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="flex items-baseline text-3xl leading-none tracking-tight">
              <PrivacyValue className="font-normal">{totalValue}</PrivacyValue>
              {totalCents ? (
                <PrivacyValue className="text-muted-foreground text-xl">{`,${totalCents}`}</PrivacyValue>
              ) : null}
            </h2>
            <p className="text-muted-foreground text-sm leading-none">
              {summaryLabel ?? (
                <>
                  {t("description1")}
                  <PrivacyValue className="font-medium text-foreground">
                    {descriptionCount ?? t("description2")}
                  </PrivacyValue>
                  {t("description3")}
                </>
              )}
            </p>
          </div>
          {transactions.length > 0 ? (
            <div className="flex w-max items-center gap-2 rounded-md border border-border bg-muted/70 px-2 py-1.5 text-sm">
              <Zap className="size-4 fill-primary text-primary" />
              <span className="text-muted-foreground">
                {highlightLabel ?? t("autopay1")}
                <PrivacyValue className="font-medium text-foreground">{autopayAmount ?? t("autopay2")}</PrivacyValue>
                {highlightLabel ? null : t("autopay3")}
              </span>
            </div>
          ) : null}
        </div>

        <ItemGroup>
          {transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
              {emptyLabel ?? t("empty")}
            </div>
          ) : null}
          {transactions.map((transaction) => (
            <Item key={transaction.id} variant="outline" size="xs">
              <ItemMedia>
                <div className="grid size-9 place-items-center rounded-md border bg-background">
                  {"icon" in transaction ? <SimpleIcon icon={transaction.icon} /> : <Receipt className="size-4" />}
                </div>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{transaction.title}</ItemTitle>
                <ItemDescription>
                  {"amount" in transaction
                    ? `${transaction.amount} · ${transaction.date} · ${transaction.category}`
                    : transaction.date}
                </ItemDescription>
              </ItemContent>
              <ItemActions className={hasRealItems ? "text-muted-foreground text-xs" : undefined}>
                {"amount" in transaction ? <PrivacyValue>{transaction.amount}</PrivacyValue> : null}
                <ChevronRight className="size-5 text-muted-foreground" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
