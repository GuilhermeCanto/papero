"use client";

import * as React from "react";

import { Building2, HandCoins, Plus, ReceiptText, UserRoundPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { FinanceContactType } from "@/app/(main)/dashboard/finance/_components/contacts-store";
import type { TransactionKind } from "@/app/(main)/dashboard/finance/_components/finance-transactions-store";
import { FloatingButton, FloatingButtonItem } from "@/components/floating-button/floating-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { AccountSelect, resolveFinanceAccountId } from "../../finance/_components/account-select";
import { useFinanceAccountsData } from "../../finance/_components/use-finance-accounts-data";
import { useFinanceCategoriesData } from "../../finance/_components/use-finance-categories-data";
import { useFinanceContactsData } from "../../finance/_components/use-finance-contacts-data";
import { useFinanceTransactionsData } from "../../finance/_components/use-finance-transactions-data";

type QuickCreateAction = "expense" | "income" | "supplier" | "customer";

const today = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(new Date());

function parseMoneyToCents(value: string) {
  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) return 0;

  return Math.round(amount * 100);
}

function isIncomeAction(action: Exclude<QuickCreateAction, "supplier" | "customer">) {
  return action === "income";
}

function QuickCreateOption({
  icon: Icon,
  index,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  index: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <FloatingButtonItem index={index}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={label}
            className="size-9 rounded-full bg-primary p-0 text-zinc-950 shadow-lg shadow-primary/20 hover:bg-primary/90 hover:text-zinc-950"
            onClick={onClick}
            type="button"
          >
            <Icon className="size-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent align="center" side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    </FloatingButtonItem>
  );
}

function TransactionDialog({
  kind,
  onOpenChange,
  open,
}: {
  kind: Exclude<QuickCreateAction, "supplier" | "customer">;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const t = useTranslations("QuickCreate");
  const { accounts } = useFinanceAccountsData();
  const { categories } = useFinanceCategoriesData();
  const { contacts } = useFinanceContactsData(isIncomeAction(kind) ? "customer" : "supplier");
  const { addTransaction } = useFinanceTransactionsData();
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dueDate, setDueDate] = React.useState(today);
  const [contact, setContact] = React.useState("");
  const [accountId, setAccountId] = React.useState(() => resolveFinanceAccountId([]));
  const [notes, setNotes] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const isIncome = kind === "income";
  const transactionKind: TransactionKind = isIncome ? "income" : "variable";
  const title = isIncome ? t("incomeDialog.title") : t("expenseDialog.title");
  const descriptionText = isIncome ? t("incomeDialog.description") : t("expenseDialog.description");

  const reset = () => {
    setDescription("");
    setAmount("");
    setDueDate(today);
    setContact("");
    setAccountId(resolveFinanceAccountId(accounts));
    setNotes("");
    setIsSaving(false);
  };

  React.useEffect(() => {
    if (!open) return;
    setAccountId((currentAccountId) => resolveFinanceAccountId(accounts, currentAccountId));
  }, [accounts, open]);

  const saveTransaction = async () => {
    if (isSaving) return;
    if (!description.trim()) return;

    setIsSaving(true);

    try {
      const defaultCategoryName = isIncome ? t("defaults.incomeCategory") : t("defaults.expenseCategory");
      const category =
        categories.find(
          (currentCategory) =>
            currentCategory.type === transactionKind &&
            currentCategory.name.localeCompare(defaultCategoryName, undefined, { sensitivity: "accent" }) === 0,
        ) ?? categories.find((currentCategory) => currentCategory.type === transactionKind);
      const selectedContact = contacts.find(
        (currentContact) => currentContact.name.localeCompare(contact, undefined, { sensitivity: "accent" }) === 0,
      );

      await addTransaction({
        amountCents: parseMoneyToCents(amount),
        accountId: resolveFinanceAccountId(accounts, accountId),
        category: category?.name ?? defaultCategoryName,
        categoryId: category?.id,
        contactId: selectedContact?.id,
        date: dueDate,
        description,
        from: selectedContact?.name ?? contact,
        kind: transactionKind,
        notes,
        paid: false,
        paymentMode: "automatic",
        paymentTime: "cash",
        paymentType: t("defaults.singlePayment"),
      });

      toast.success(isIncome ? t("incomeDialog.success") : t("expenseDialog.success"));
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.transaction"));
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Label className="grid gap-1.5" htmlFor={`${kind}-description`}>
            {t("fields.description")}
            <Input
              id={`${kind}-description`}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("placeholders.description")}
              value={description}
            />
          </Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label className="grid gap-1.5" htmlFor={`${kind}-amount`}>
              {t("fields.amount")}
              <Input
                id={`${kind}-amount`}
                inputMode="decimal"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                value={amount}
              />
            </Label>
            <Label className="grid gap-1.5" htmlFor={`${kind}-due-date`}>
              {t("fields.dueDate")}
              <Input id={`${kind}-due-date`} onChange={(event) => setDueDate(event.target.value)} value={dueDate} />
            </Label>
          </div>
          <Label className="grid gap-1.5" htmlFor={`${kind}-contact`}>
            {isIncome ? t("fields.customer") : t("fields.supplier")}
            <Input
              id={`${kind}-contact`}
              onChange={(event) => setContact(event.target.value)}
              placeholder={isIncome ? t("placeholders.customer") : t("placeholders.supplier")}
              value={contact}
            />
          </Label>
          <div className="grid gap-1.5">
            <Label>{t("fields.account")}</Label>
            <AccountSelect accounts={accounts} onChange={setAccountId} triggerClassName="w-full" value={accountId} />
          </div>
          <Label className="grid gap-1.5" htmlFor={`${kind}-notes`}>
            {t("fields.notes")}
            <Textarea id={`${kind}-notes`} onChange={(event) => setNotes(event.target.value)} value={notes} />
          </Label>
        </div>

        <DialogFooter>
          <Button disabled={!description.trim() || isSaving} onClick={() => void saveTransaction()} type="button">
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactDialog({
  contactType,
  onOpenChange,
  open,
}: {
  contactType: FinanceContactType;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const t = useTranslations("QuickCreate");
  const { addContact } = useFinanceContactsData(contactType);
  const [name, setName] = React.useState("");
  const [taxId, setTaxId] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [address, setAddress] = React.useState("");

  const isCustomer = contactType === "customer";

  const reset = () => {
    setName("");
    setTaxId("");
    setWebsite("");
    setAddress("");
  };

  const saveContact = async () => {
    try {
      const contact = await addContact({
        address,
        name,
        taxId,
        type: contactType,
        website,
      });

      if (!contact) return;

      toast.success(isCustomer ? t("customerDialog.success") : t("supplierDialog.success"));
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.contact"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCustomer ? t("customerDialog.title") : t("supplierDialog.title")}</DialogTitle>
          <DialogDescription>
            {isCustomer ? t("customerDialog.description") : t("supplierDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Label className="grid gap-1.5" htmlFor={`${contactType}-name`}>
            {t("fields.companyName")}
            <Input
              id={`${contactType}-name`}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("placeholders.companyName")}
              value={name}
            />
          </Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label className="grid gap-1.5" htmlFor={`${contactType}-tax-id`}>
              {t("fields.taxId")}
              <Input id={`${contactType}-tax-id`} onChange={(event) => setTaxId(event.target.value)} value={taxId} />
            </Label>
            <Label className="grid gap-1.5" htmlFor={`${contactType}-website`}>
              {t("fields.website")}
              <Input
                id={`${contactType}-website`}
                onChange={(event) => setWebsite(event.target.value)}
                value={website}
              />
            </Label>
          </div>
          <Label className="grid gap-1.5" htmlFor={`${contactType}-address`}>
            {t("fields.address")}
            <Input id={`${contactType}-address`} onChange={(event) => setAddress(event.target.value)} value={address} />
          </Label>
        </div>

        <DialogFooter>
          <Button disabled={!name.trim()} onClick={() => void saveContact()} type="button">
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QuickCreateMenu() {
  const t = useTranslations("QuickCreate");
  const [activeAction, setActiveAction] = React.useState<QuickCreateAction | null>(null);

  const openAction = (action: QuickCreateAction) => {
    setActiveAction(action);
  };

  return (
    <>
      <div className="min-w-0 flex-1">
        <FloatingButton
          triggerContent={
            <SidebarMenuButton
              className="size-9! w-9! justify-center rounded-full bg-primary p-0! text-zinc-950 shadow-primary/20 shadow-sm duration-200 ease-linear hover:bg-primary/90 hover:text-zinc-950 active:bg-primary/90 active:text-zinc-950"
              tooltip={t("trigger")}
            >
              <Plus />
              <span className="sr-only">{t("trigger")}</span>
            </SidebarMenuButton>
          }
        >
          <QuickCreateOption
            icon={ReceiptText}
            index={0}
            label={t("actions.newExpense")}
            onClick={() => openAction("expense")}
          />
          <QuickCreateOption
            icon={HandCoins}
            index={1}
            label={t("actions.newIncome")}
            onClick={() => openAction("income")}
          />
          <QuickCreateOption
            icon={Building2}
            index={2}
            label={t("actions.newSupplier")}
            onClick={() => openAction("supplier")}
          />
          <QuickCreateOption
            icon={UserRoundPlus}
            index={3}
            label={t("actions.newCustomer")}
            onClick={() => openAction("customer")}
          />
        </FloatingButton>
      </div>

      <TransactionDialog
        kind="expense"
        onOpenChange={(nextOpen) => setActiveAction(nextOpen ? "expense" : null)}
        open={activeAction === "expense"}
      />
      <TransactionDialog
        kind="income"
        onOpenChange={(nextOpen) => setActiveAction(nextOpen ? "income" : null)}
        open={activeAction === "income"}
      />
      <ContactDialog
        contactType="supplier"
        onOpenChange={(nextOpen) => setActiveAction(nextOpen ? "supplier" : null)}
        open={activeAction === "supplier"}
      />
      <ContactDialog
        contactType="customer"
        onOpenChange={(nextOpen) => setActiveAction(nextOpen ? "customer" : null)}
        open={activeAction === "customer"}
      />
    </>
  );
}
