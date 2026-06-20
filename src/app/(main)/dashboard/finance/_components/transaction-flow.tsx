import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

type TransactionStatus = "Agendado" | "Overdue" | "Pago" | "Paid" | "Recebido" | "Received" | "Scheduled" | "Vencido";

export type TransactionRecord = {
  id: string;
  contact: string;
  category: string;
  dueDate: string;
  amountCents: number;
  status: TransactionStatus;
};

export type ExpenseBreakdownItem = {
  amountLabel: string;
  label: string;
  share: number;
  tone?: string;
};

const expenses = [
  { labelKey: "software", amountCents: 84000, share: 39, tone: "bg-destructive" },
  { labelKey: "payroll", amountCents: 72000, share: 34, tone: "bg-destructive/75" },
  { labelKey: "operations", amountCents: 58000, share: 27, tone: "bg-destructive/50" },
] as const;

export function ExpenseBreakdown({ items }: { items?: ExpenseBreakdownItem[] }) {
  const t = useTranslations("Dashboard.financeBreakdown.expense");
  const visibleExpenses =
    items ??
    expenses.map((expense) => ({
      amountLabel: formatCurrency(expense.amountCents / 100),
      label: t(`items.${expense.labelKey}`),
      share: expense.share,
      tone: expense.tone,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{t("title")}</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {visibleExpenses.map((expense) => (
          <section key={expense.label} className="isolate flex gap-[0.5px]">
            <div className="mb-1 border-muted-foreground/50 border-l border-dashed" />
            <div className="flex min-h-24 flex-1 flex-col justify-between">
              <div className="flex min-w-0 flex-col gap-1 px-1">
                <p className="wrap-break-word text-muted-foreground text-xs leading-none">
                  {expense.label} · {expense.share}%
                </p>
                <div className="text-lg leading-none tracking-tight">
                  <PrivacyValue>{expense.amountLabel}</PrivacyValue>
                </div>
              </div>
              <div className={cn("-ml-0.5 h-5 rounded-sm", expense.tone ?? "bg-destructive/50")} />
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

export function RecentTransactionFlow({
  description,
  emptyLabel,
  records,
  title,
}: {
  description: string;
  emptyLabel?: string;
  records: TransactionRecord[];
  title: string;
}) {
  const t = useTranslations("Dashboard.financeBreakdown");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            {t("viewAll")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="table-fixed **:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4">
          <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-medium **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
            <TableRow>
              <TableHead className="w-24">{t("overviewTable.dueDate")}</TableHead>
              <TableHead className="w-52">{t("overviewTable.description")}</TableHead>
              <TableHead className="w-28">{t("overviewTable.amount")}</TableHead>
              <TableHead className="w-16">{t("overviewTable.paid")}</TableHead>
              <TableHead className="w-12 text-right">{t("overviewTable.edit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-row']:hover:bg-transparent">
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium text-sm">{record.dueDate}</TableCell>
                <TableCell className="min-w-0">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="truncate font-medium text-sm">{record.contact}</div>
                    <div className="truncate text-muted-foreground text-xs">
                      {record.id} · {record.category}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm tabular-nums">
                  <PrivacyValue>{formatCurrency(record.amountCents / 100)}</PrivacyValue>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      aria-label={t("overviewTable.markAsPaid", { id: record.id })}
                      checked={record.status === "Recebido" || record.status === "Pago"}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-muted-foreground hover:bg-transparent focus-visible:bg-transparent"
                  >
                    <Pencil />
                    <span className="sr-only">{t("overviewTable.editRecord", { id: record.id })}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                  {emptyLabel ?? t("overviewTable.empty")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
