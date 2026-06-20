"use client";

import * as React from "react";

import {
  ArrowUpDown,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  MoreHorizontal,
  Paperclip,
  Plus,
  ReceiptText,
  Repeat,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { getFinanceCategoryTypeForTransactionKind } from "./categories-store";
import { CategorySelect } from "./category-select";
import { ContactSelect } from "./contact-select";
import type { FinanceContactType } from "./contacts-store";
import {
  type PaymentTime,
  type FinanceTransaction as Transaction,
  type TransactionKind,
  useFinanceTransactions,
} from "./finance-transactions-store";

type FinanceTransactionsTableMode = "all" | "expenses" | "incomes";

const allTransactionKindIds: TransactionKind[] = ["income", "fixed", "variable", "people", "taxes", "transfer"];
const expenseTransactionKindIds: TransactionKind[] = ["fixed", "variable", "people", "taxes", "transfer"];
const paymentFormOptions = [
  { labelKey: "paymentForm.automatic", value: "automatic" },
  { labelKey: "paymentForm.boleto", value: "boleto" },
  { labelKey: "paymentForm.bankDeposit", value: "bankDeposit" },
  { labelKey: "paymentForm.bankTransfer", value: "bankTransfer" },
  { labelKey: "paymentForm.digitalWallet", value: "digitalWallet" },
  { labelKey: "paymentForm.creditCard", value: "creditCard" },
  { labelKey: "paymentForm.debitCard", value: "debitCard" },
  { labelKey: "paymentForm.crypto", value: "crypto" },
  { labelKey: "paymentForm.pix", value: "pix" },
  { labelKey: "paymentForm.stripe", value: "stripe" },
  { labelKey: "paymentForm.paypal", value: "paypal" },
  { labelKey: "paymentForm.zelle", value: "zelle" },
  { labelKey: "paymentForm.other", value: "other" },
] as const;

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatMoney(amountCents: number) {
  return moneyFormatter.format(amountCents / 100);
}

function parseMoneyToCents(value: string) {
  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) return 0;

  return Math.round(amount * 100);
}

function formatMoneyInput(amountCents: number) {
  return (amountCents / 100).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function parseBrazilianDate(date: string) {
  const [day, month, year] = date.split("/").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatBrazilianDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function splitAmountIntoInstallments(amountCents: number, installmentCount: number) {
  const baseAmount = Math.floor(amountCents / installmentCount);
  const remainder = amountCents - baseAmount * installmentCount;

  return Array.from(
    { length: installmentCount },
    (_, index) => baseAmount + (index === installmentCount - 1 ? remainder : 0),
  );
}

function getContactTypeForTransactionKind(kind: TransactionKind): FinanceContactType {
  return kind === "income" ? "customer" : "supplier";
}

function getTransactionKindsForMode(mode: FinanceTransactionsTableMode) {
  if (mode === "incomes") return ["income"] satisfies TransactionKind[];
  if (mode === "expenses") return expenseTransactionKindIds;
  return allTransactionKindIds;
}

function DatePickerCell({
  ariaLabel,
  onChange,
  value,
}: {
  ariaLabel: string;
  onChange: (date: string) => void;
  value: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseBrazilianDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="h-8 justify-start px-2 font-medium" size="sm" variant="ghost">
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          {value}
          <span className="sr-only">{ariaLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatBrazilianDate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function AmountInputCell({
  ariaLabel,
  amountCents,
  onChange,
}: {
  ariaLabel: string;
  amountCents: number;
  onChange: (amountCents: number) => void;
}) {
  const [value, setValue] = React.useState(formatMoneyInput(amountCents));

  React.useEffect(() => {
    setValue(formatMoneyInput(amountCents));
  }, [amountCents]);

  const commitValue = () => {
    const nextAmount = parseMoneyToCents(value);
    onChange(nextAmount);
    setValue(formatMoneyInput(nextAmount));
  };

  return (
    <Input
      aria-label={ariaLabel}
      className="h-8 w-24 tabular-nums"
      inputMode="decimal"
      onBlur={commitValue}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      value={value}
    />
  );
}

function TransactionActionsMenu({
  onDelete,
  onDuplicate,
  onOpenAmountDetails,
  onOpenAttachments,
  onOpenDetails,
  onOpenInstallments,
  onOpenRecurrence,
  transaction,
}: {
  onDelete: () => void;
  onDuplicate: () => void;
  onOpenAmountDetails: () => void;
  onOpenAttachments: () => void;
  onOpenDetails: () => void;
  onOpenInstallments: () => void;
  onOpenRecurrence: () => void;
  transaction: Transaction;
}) {
  const t = useTranslations("Dashboard.financeTransactions");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("actions.menu", { description: transaction.description })}
          className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
          type="button"
        >
          <MoreHorizontal />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onOpenDetails();
            }}
          >
            <ReceiptText />
            {transaction.kind === "income" ? t("actions.incomeDetails") : t("actions.expenseDetails")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onOpenAmountDetails();
            }}
          >
            <WalletCards />
            {t("actions.amountDetails")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onOpenAttachments();
            }}
          >
            <Paperclip />
            {t("actions.attachments")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy />
            {t("actions.duplicate")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onOpenRecurrence();
            }}
          >
            <Repeat />
            {t("actions.configureRecurrence")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onOpenInstallments();
            }}
          >
            <FileText />
            {t("actions.configureInstallments")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} variant="destructive">
          <Trash2 />
          {t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TransactionDetailsDrawer({
  onOpenChange,
  onUpdate,
  open,
  transaction,
}: {
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
  open: boolean;
  transaction: Transaction | null;
}) {
  const t = useTranslations("Dashboard.financeTransactions");

  if (!transaction) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <div className="mx-auto flex w-full max-w-4xl flex-col">
          <DrawerHeader>
            <DrawerTitle>
              {transaction.kind === "income" ? t("actions.incomeDetails") : t("actions.expenseDetails")}
            </DrawerTitle>
            <DrawerDescription>{transaction.description}</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-4 px-4 pb-6 md:grid-cols-3">
            <div className="grid gap-1.5">
              <span className="font-medium text-sm">{t("drawer.fields.dueDate")}</span>
              <DatePickerCell
                ariaLabel={t("drawer.aria.editDueDate", { description: transaction.description })}
                onChange={(date) => onUpdate(transaction.id, { date })}
                value={transaction.date}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="font-medium text-sm">{t("drawer.fields.amount")}</span>
              <AmountInputCell
                amountCents={transaction.amountCents}
                ariaLabel={t("drawer.aria.editAmount", { description: transaction.description })}
                onChange={(amountCents) => onUpdate(transaction.id, { amountCents })}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="font-medium text-sm">{t("drawer.fields.competence")}</span>
              <DatePickerCell
                ariaLabel={t("drawer.aria.editCompetence", { description: transaction.description })}
                onChange={(competenceDate) => onUpdate(transaction.id, { competenceDate })}
                value={transaction.competenceDate ?? transaction.date}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="font-medium text-sm">{t("drawer.fields.description")}</span>
              <Input
                value={transaction.description}
                onChange={(event) => onUpdate(transaction.id, { description: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="font-medium text-sm">{t("drawer.fields.document")}</span>
              <Input
                placeholder={t("drawer.placeholders.document")}
                value={transaction.documentNumber ?? ""}
                onChange={(event) => onUpdate(transaction.id, { documentNumber: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="font-medium text-sm">{t("drawer.fields.tags")}</span>
              <Input
                placeholder={t("drawer.placeholders.tags")}
                value={transaction.tags ?? ""}
                onChange={(event) => onUpdate(transaction.id, { tags: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5 md:col-span-3">
              <span className="font-medium text-sm">{t("drawer.fields.additionalInfo")}</span>
              <Textarea
                placeholder={t("drawer.placeholders.additionalInfo")}
                value={transaction.notes ?? ""}
                onChange={(event) => onUpdate(transaction.id, { notes: event.target.value })}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function PlaceholderDrawer({
  children,
  description,
  onOpenChange,
  open,
  title,
}: {
  children?: React.ReactNode;
  description: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <div className="mx-auto flex w-full max-w-3xl flex-col">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">{children}</div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function PaymentTimeSelect({
  transaction,
  onChange,
}: {
  transaction: Transaction;
  onChange: (transaction: Transaction, paymentTime: PaymentTime) => void;
}) {
  const t = useTranslations("Dashboard.financeTransactions");

  return (
    <Select value={transaction.paymentTime} onValueChange={(value) => onChange(transaction, value as PaymentTime)}>
      <SelectTrigger className="w-30" size="sm">
        <SelectValue placeholder={t("paymentTime.placeholder")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="cash">{t("paymentTime.cash")}</SelectItem>
          <SelectItem value="installment">{t("paymentTime.installment")}</SelectItem>
          <SelectItem value="recurring">{t("paymentTime.recurring")}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function PaymentFormSelect({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const t = useTranslations("Dashboard.financeTransactions");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {paymentFormOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function InstallmentDialog({
  onOpenChange,
  onSave,
  open,
  transaction,
}: {
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Transaction, amountCents: number, installments: number) => void;
  open: boolean;
  transaction: Transaction | null;
}) {
  const t = useTranslations("Dashboard.financeTransactions");
  const [amount, setAmount] = React.useState("0,00");
  const [installments, setInstallments] = React.useState("3");

  React.useEffect(() => {
    if (!transaction || !open) return;
    setAmount(formatMoneyInput(transaction.amountCents));
    setInstallments("3");
  }, [open, transaction]);

  if (!transaction) return null;

  const amountCents = parseMoneyToCents(amount);
  const installmentCount = Math.max(2, Number.parseInt(installments, 10) || 2);
  const installmentAmounts = splitAmountIntoInstallments(amountCents, installmentCount);
  const firstDate = parseBrazilianDate(transaction.date);
  const previewRows = installmentAmounts.map((installmentAmount, index) => {
    const date = formatBrazilianDate(addMonths(firstDate, index));

    return {
      amountCents: installmentAmount,
      date,
      id: `${transaction.id}-${date}`,
      installmentNumber: index + 1,
      paid: index === 0 && transaction.paid,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("installmentDialog.title")}</DialogTitle>
          <DialogDescription>{t("installmentDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1.5" htmlFor="installment-total">
            <span className="font-medium text-sm">{t("installmentDialog.totalAmount")}</span>
            <Input
              id="installment-total"
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              value={amount}
            />
          </label>
          <label className="grid gap-1.5" htmlFor="installment-count">
            <span className="font-medium text-sm">{t("installmentDialog.installments")}</span>
            <Input
              id="installment-count"
              min={2}
              onChange={(event) => setInstallments(event.target.value)}
              type="number"
              value={installments}
            />
          </label>
          <div className="grid gap-1.5">
            <span className="font-medium text-sm">{t("installmentDialog.frequency")}</span>
            <Button className="justify-between" type="button" variant="outline">
              {t("installmentDialog.monthly")}
              <ChevronRight className="size-3.5 rotate-90 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">{t("installmentDialog.installment")}</TableHead>
                <TableHead>{t("installmentDialog.dueDate")}</TableHead>
                <TableHead>{t("installmentDialog.installmentAmount")}</TableHead>
                <TableHead className="w-24">{t("installmentDialog.paid")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary text-xs">
                      {row.installmentNumber}/{installmentCount}
                    </span>
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(row.amountCents)}</TableCell>
                  <TableCell>
                    <Checkbox checked={row.paid} disabled />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSave(transaction, amountCents, installmentCount);
              onOpenChange(false);
            }}
          >
            {t("installmentDialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecurrenceDialog({
  onOpenChange,
  onSave,
  open,
  transaction,
}: {
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Transaction, months: number) => void;
  open: boolean;
  transaction: Transaction | null;
}) {
  const t = useTranslations("Dashboard.financeTransactions");
  const [months, setMonths] = React.useState("12");

  React.useEffect(() => {
    if (!open) return;
    setMonths("12");
  }, [open]);

  if (!transaction) return null;

  const monthCount = Math.max(1, Number.parseInt(months, 10) || 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("recurrenceDialog.title")}</DialogTitle>
          <DialogDescription>{t("recurrenceDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5" htmlFor="recurrence-months">
            <span className="font-medium text-sm">{t("recurrenceDialog.months")}</span>
            <Input
              id="recurrence-months"
              min={1}
              onChange={(event) => setMonths(event.target.value)}
              type="number"
              value={months}
            />
          </label>
          <div className="grid gap-1.5">
            <span className="font-medium text-sm">{t("recurrenceDialog.frequency")}</span>
            <Button className="justify-between" type="button" variant="outline">
              {t("recurrenceDialog.monthly")}
              <ChevronRight className="size-3.5 rotate-90 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-muted-foreground text-sm">
          {t("recurrenceDialog.summary", { amount: formatMoney(transaction.amountCents), count: monthCount })}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSave(transaction, monthCount);
              onOpenChange(false);
            }}
          >
            {t("recurrenceDialog.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceTransactionsTable({ mode = "all" }: { mode?: FinanceTransactionsTableMode }) {
  const t = useTranslations("Dashboard.financeTransactions");
  const availableKindIds = React.useMemo(() => getTransactionKindsForMode(mode), [mode]);
  const [activeKind, setActiveKind] = React.useState<TransactionKind>(availableKindIds[0]);
  const { addTransaction: createTransaction, setTransactions, transactions } = useFinanceTransactions([]);
  const [installmentTransaction, setInstallmentTransaction] = React.useState<Transaction | null>(null);
  const [recurringTransaction, setRecurringTransaction] = React.useState<Transaction | null>(null);
  const [detailsTransaction, setDetailsTransaction] = React.useState<Transaction | null>(null);
  const [amountDetailsTransaction, setAmountDetailsTransaction] = React.useState<Transaction | null>(null);
  const [attachmentsTransaction, setAttachmentsTransaction] = React.useState<Transaction | null>(null);

  const transactionKinds = availableKindIds.map((id) => ({ id, label: t(`kinds.${id}`) }));
  const filteredTransactions = transactions.filter((transaction) => transaction.kind === activeKind);
  const transactionCount = filteredTransactions.length;
  const contactColumnLabel = activeKind === "income" ? t("table.counterpartIncome") : t("table.counterpart");
  const showTabs = availableKindIds.length > 1;
  const currentDetailsTransaction = detailsTransaction
    ? (transactions.find((transaction) => transaction.id === detailsTransaction.id) ?? detailsTransaction)
    : null;

  const addTransaction = () => {
    createTransaction({
      amountCents: 0,
      category: t("sample.category"),
      date: "18/06/2026",
      description: t("table.add"),
      from: "",
      kind: activeKind,
      paid: false,
      paymentMode: paymentFormOptions[0].value,
      paymentTime: "cash",
      paymentType: t("paymentTime.cash"),
    });
  };

  const togglePaid = (id: string, paid: boolean) => {
    setTransactions((current) =>
      current.map((transaction) => (transaction.id === id ? { ...transaction, paid } : transaction)),
    );
  };

  const updateTransaction = (id: string, patch: Partial<Transaction>) => {
    setTransactions((current) =>
      current.map((transaction) => (transaction.id === id ? { ...transaction, ...patch } : transaction)),
    );
  };

  const updateTransactionCategory = (id: string, category: string, kind: TransactionKind) => {
    setTransactions((current) =>
      current.map((transaction) => (transaction.id === id ? { ...transaction, category, kind } : transaction)),
    );
  };

  const updateTransactionContact = (id: string, contactName: string) => {
    setTransactions((current) =>
      current.map((transaction) => (transaction.id === id ? { ...transaction, from: contactName } : transaction)),
    );
  };

  const duplicateTransaction = (transaction: Transaction) => {
    setTransactions((current) => [
      {
        ...transaction,
        id: `${transaction.id}-COPY-${current.length + 1}`,
        paid: false,
      },
      ...current,
    ]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id));
  };

  const updatePaymentTime = (transaction: Transaction, paymentTime: PaymentTime) => {
    if (paymentTime === "installment") {
      setInstallmentTransaction(transaction);
      return;
    }

    if (paymentTime === "recurring") {
      setRecurringTransaction(transaction);
      return;
    }

    setTransactions((current) =>
      current.map((currentTransaction) =>
        currentTransaction.id === transaction.id
          ? {
              ...currentTransaction,
              paymentMode: transaction.paymentMode,
              paymentTime: "cash",
              paymentType: t("paymentTime.cash"),
            }
          : currentTransaction,
      ),
    );
  };

  const saveInstallmentPlan = (transaction: Transaction, amountCents: number, installments: number) => {
    const firstDate = parseBrazilianDate(transaction.date);
    const installmentAmounts = splitAmountIntoInstallments(amountCents, installments);
    const installmentTransactions = installmentAmounts.map((installmentAmount, index) => ({
      ...transaction,
      amountCents: installmentAmount,
      date: formatBrazilianDate(addMonths(firstDate, index)),
      id: `${transaction.id}-P${index + 1}`,
      paid: index === 0 ? transaction.paid : false,
      paymentMode: paymentFormOptions[0].value,
      paymentTime: "installment" as const,
      paymentType: `${index + 1}/${installments}`,
    }));

    setTransactions((current) =>
      current.flatMap((currentTransaction) =>
        currentTransaction.id === transaction.id ? installmentTransactions : [currentTransaction],
      ),
    );
  };

  const saveRecurringPlan = (transaction: Transaction, months: number) => {
    const firstDate = parseBrazilianDate(transaction.date);
    const recurringTransactions = Array.from({ length: months }, (_, index) => ({
      ...transaction,
      date: formatBrazilianDate(addMonths(firstDate, index)),
      id: `${transaction.id}-R${index + 1}`,
      paid: index === 0 ? transaction.paid : false,
      paymentMode: paymentFormOptions[0].value,
      paymentTime: "recurring" as const,
      paymentType: `${index + 1}/${months}`,
    }));

    setTransactions((current) =>
      current.flatMap((currentTransaction) =>
        currentTransaction.id === transaction.id ? recurringTransactions : [currentTransaction],
      ),
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-normal text-muted-foreground text-sm">{t("table.title")}</CardTitle>
          <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
            {t("table.count", { count: transactionCount })}
          </CardDescription>
          <CardAction className="flex items-center gap-1">
            <Button aria-label={t("table.export")} size="icon-sm" variant="outline">
              <Download />
            </Button>
            <Button aria-label={t("table.more")} size="icon-sm" variant="outline">
              <MoreHorizontal />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-col gap-3 px-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={addTransaction} size="sm">
                <Plus />
                {t("table.add")}
              </Button>
              <Button aria-label={t("table.previous")} size="icon-sm" variant="outline">
                <ChevronLeft />
              </Button>
              <Button className="min-w-28" size="sm" variant="outline">
                {t("table.month")}
              </Button>
              <Button aria-label={t("table.next")} size="icon-sm" variant="outline">
                <ChevronRight />
              </Button>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {showTabs ? (
                <ToggleGroup
                  className="max-w-full overflow-x-auto bg-muted p-0.75 text-muted-foreground **:data-[slot=toggle-group-item]:rounded-md **:data-[slot=toggle-group-item]:border **:data-[slot=toggle-group-item]:border-transparent **:data-[slot=toggle-group-item]:text-foreground/60 **:data-[slot=toggle-group-item]:hover:text-foreground [&_[data-slot=toggle-group-item][data-state=on]]:bg-background [&_[data-slot=toggle-group-item][data-state=on]]:text-foreground [&_[data-slot=toggle-group-item][data-state=on]]:shadow-sm dark:[&_[data-slot=toggle-group-item][data-state=on]]:border-input dark:[&_[data-slot=toggle-group-item][data-state=on]]:bg-input/30"
                  onValueChange={(value) => {
                    if (!value) return;
                    setActiveKind(value as TransactionKind);
                  }}
                  size="sm"
                  spacing={1}
                  type="single"
                  value={activeKind}
                >
                  {transactionKinds.map((kind) => (
                    <ToggleGroupItem key={kind.id} value={kind.id}>
                      {kind.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : null}

              <Button aria-label={t("table.sort")} size="icon-sm" variant="outline">
                <ArrowUpDown />
              </Button>
            </div>
          </div>

          <div className="overflow-hidden">
            <Table className="table-fixed **:data-[slot='table-cell']:px-3 **:data-[slot='table-head']:px-3">
              <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-normal **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
                <TableRow>
                  <TableHead className="w-9">
                    <Checkbox aria-label={t("table.selectAll")} />
                  </TableHead>
                  <TableHead className="w-30">{t("table.dueDate")}</TableHead>
                  <TableHead className="w-64">{t("table.description")}</TableHead>
                  <TableHead className="w-36">{contactColumnLabel}</TableHead>
                  <TableHead className="w-34">{t("table.category")}</TableHead>
                  <TableHead className="w-28">{t("table.amount")}</TableHead>
                  <TableHead className="w-34">{t("table.paymentMode")}</TableHead>
                  <TableHead className="w-34">{t("table.paymentForm")}</TableHead>
                  <TableHead className="w-14">{t("table.paid")}</TableHead>
                  <TableHead className="w-14 text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-cell']:px-3 **:data-[slot='table-cell']:py-3 **:data-[slot='table-row']:hover:bg-transparent">
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Checkbox aria-label={t("table.selectTransaction", { description: transaction.description })} />
                    </TableCell>
                    <TableCell>
                      <DatePickerCell
                        ariaLabel={t("drawer.aria.editDueDate", { description: transaction.description })}
                        onChange={(date) => updateTransaction(transaction.id, { date })}
                        value={transaction.date}
                      />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <Input
                          aria-label={t("drawer.aria.editDescription", { id: transaction.id })}
                          className="h-7 border-transparent bg-transparent px-0 font-medium shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-2"
                          onChange={(event) => updateTransaction(transaction.id, { description: event.target.value })}
                          value={transaction.description}
                        />
                        <div className="truncate text-muted-foreground text-xs">
                          {transaction.id} · {transaction.paymentType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ContactSelect
                        contactType={getContactTypeForTransactionKind(transaction.kind)}
                        label={transaction.kind === "income" ? t("table.counterpartIncome") : t("table.counterpart")}
                        onChange={(contact) => updateTransactionContact(transaction.id, contact.name)}
                        value={transaction.from}
                      />
                    </TableCell>
                    <TableCell>
                      <CategorySelect
                        currentType={getFinanceCategoryTypeForTransactionKind(transaction.kind)}
                        onChange={(category) =>
                          updateTransactionCategory(transaction.id, category.name, category.type as TransactionKind)
                        }
                        value={transaction.category}
                      />
                    </TableCell>
                    <TableCell>
                      <AmountInputCell
                        amountCents={transaction.amountCents}
                        ariaLabel={t("drawer.aria.editAmount", { description: transaction.description })}
                        onChange={(amountCents) => updateTransaction(transaction.id, { amountCents })}
                      />
                    </TableCell>
                    <TableCell>
                      <PaymentTimeSelect transaction={transaction} onChange={updatePaymentTime} />
                    </TableCell>
                    <TableCell>
                      <PaymentFormSelect
                        onChange={(paymentMode) => updateTransaction(transaction.id, { paymentMode })}
                        value={transaction.paymentMode}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        aria-label={t("table.markAsPaid", { description: transaction.description })}
                        checked={transaction.paid}
                        onCheckedChange={(paid) => togglePaid(transaction.id, paid)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex w-full justify-end">
                        <TransactionActionsMenu
                          onDelete={() => deleteTransaction(transaction.id)}
                          onDuplicate={() => duplicateTransaction(transaction)}
                          onOpenAmountDetails={() => setAmountDetailsTransaction(transaction)}
                          onOpenAttachments={() => setAttachmentsTransaction(transaction)}
                          onOpenDetails={() => setDetailsTransaction(transaction)}
                          onOpenInstallments={() => setInstallmentTransaction(transaction)}
                          onOpenRecurrence={() => setRecurringTransaction(transaction)}
                          transaction={transaction}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell className="h-24 text-center text-muted-foreground" colSpan={10}>
                      {t("table.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InstallmentDialog
        onOpenChange={(open) => {
          if (!open) setInstallmentTransaction(null);
        }}
        onSave={saveInstallmentPlan}
        open={Boolean(installmentTransaction)}
        transaction={installmentTransaction}
      />
      <RecurrenceDialog
        onOpenChange={(open) => {
          if (!open) setRecurringTransaction(null);
        }}
        onSave={saveRecurringPlan}
        open={Boolean(recurringTransaction)}
        transaction={recurringTransaction}
      />
      <TransactionDetailsDrawer
        onOpenChange={(open) => {
          if (!open) setDetailsTransaction(null);
        }}
        onUpdate={updateTransaction}
        open={Boolean(detailsTransaction)}
        transaction={currentDetailsTransaction}
      />
      <PlaceholderDrawer
        description={t("amountDetails.description")}
        onOpenChange={(open) => {
          if (!open) setAmountDetailsTransaction(null);
        }}
        open={Boolean(amountDetailsTransaction)}
        title={t("amountDetails.title")}
      >
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
          {t("amountDetails.body")}
        </div>
      </PlaceholderDrawer>
      <PlaceholderDrawer
        description={t("attachments.description")}
        onOpenChange={(open) => {
          if (!open) setAttachmentsTransaction(null);
        }}
        open={Boolean(attachmentsTransaction)}
        title={t("attachments.title")}
      >
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center transition-colors hover:bg-muted/50"
          htmlFor="transaction-attachments"
        >
          <Paperclip className="size-6 text-muted-foreground" />
          <span className="font-medium text-sm">{t("attachments.body")}</span>
          <span className="text-muted-foreground text-xs">{t("attachments.hint")}</span>
          <Input className="sr-only" id="transaction-attachments" multiple type="file" />
        </label>
      </PlaceholderDrawer>
    </>
  );
}
