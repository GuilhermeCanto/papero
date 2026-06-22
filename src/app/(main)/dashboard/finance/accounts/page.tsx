"use client";

import * as React from "react";

import {
  Archive,
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Plus,
  WalletCards,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  type FinanceAccount,
  type FinanceAccountType,
  getDefaultFinanceAccount,
  getFinanceAccountsWithFallback,
} from "../_components/finance-accounts-store";
import { getAccountBalanceSummaries } from "../_components/finance-calculations";
import { useFinanceAccountsData } from "../_components/use-finance-accounts-data";
import { useFinanceTransactionsData } from "../_components/use-finance-transactions-data";

const accountTypes: FinanceAccountType[] = [
  "checking",
  "savings",
  "cash",
  "wallet",
  "credit_card",
  "investment",
  "other",
];
const currencyOptions = ["BRL", "USD", "EUR"] as const;

type AccountFormState = {
  archived: boolean;
  currency: string;
  institution: string;
  name: string;
  openingBalance: string;
  type: FinanceAccountType;
};

function formatMoney(amountCents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    currency,
    style: "currency",
  }).format(amountCents / 100);
}

function formatMoneyInput(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

function parseMoneyToCents(value: string) {
  const normalized = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number.parseFloat(normalized || "0");

  if (Number.isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

function getInitialFormState(account?: FinanceAccount): AccountFormState {
  return {
    archived: account?.archived ?? false,
    currency: account?.currency ?? "BRL",
    institution: account?.institution ?? "",
    name: account?.name ?? "",
    openingBalance: formatMoneyInput(account?.openingBalanceCents ?? 0),
    type: account?.type ?? "checking",
  };
}

function getAccountIcon(type: FinanceAccountType) {
  switch (type) {
    case "cash":
      return Banknote;
    case "credit_card":
      return CreditCard;
    case "investment":
      return PiggyBank;
    case "savings":
      return Landmark;
    case "wallet":
      return WalletCards;
    default:
      return Building2;
  }
}

function AccountFormDialog({
  account,
  isSaving,
  onOpenChange,
  onSave,
  open,
}: {
  account?: FinanceAccount;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (state: AccountFormState) => void | Promise<void>;
  open: boolean;
}) {
  const t = useTranslations("Dashboard.financeAccounts");
  const [form, setForm] = React.useState<AccountFormState>(() => getInitialFormState(account));

  React.useEffect(() => {
    if (open) {
      setForm(getInitialFormState(account));
    }
  }, [account, open]);

  const updateForm = <Key extends keyof AccountFormState>(key: Key, value: AccountFormState[Key]) => {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(account ? "dialog.editTitle" : "dialog.createTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="account-name">{t("dialog.name")}</Label>
            <Input id="account-name" onChange={(event) => updateForm("name", event.target.value)} value={form.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="account-institution">{t("dialog.institution")}</Label>
              <Input
                id="account-institution"
                onChange={(event) => updateForm("institution", event.target.value)}
                value={form.institution}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("dialog.type")}</Label>
              <Select onValueChange={(value) => updateForm("type", value as FinanceAccountType)} value={form.type}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("dialog.currency")}</Label>
              <Select onValueChange={(value) => updateForm("currency", value)} value={form.currency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account-opening-balance">{t("dialog.openingBalance")}</Label>
              <Input
                id="account-opening-balance"
                inputMode="decimal"
                onBlur={() => updateForm("openingBalance", formatMoneyInput(parseMoneyToCents(form.openingBalance)))}
                onChange={(event) => updateForm("openingBalance", event.target.value)}
                value={form.openingBalance}
              />
            </div>
          </div>

          {account ? (
            <div className="flex items-center justify-between rounded-lg border bg-background p-3 dark:bg-input/20">
              <div className="grid gap-1">
                <span className="font-medium text-sm">{t("dialog.archived")}</span>
                <span className="text-muted-foreground text-xs">{t("dialog.archivedDescription")}</span>
              </div>
              <Switch checked={form.archived} onCheckedChange={(checked) => updateForm("archived", checked)} />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button disabled={isSaving || !form.name.trim()} onClick={() => void onSave(form)}>
            {t(account ? "dialog.saveEdit" : "dialog.saveCreate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FinanceAccountsPage() {
  const t = useTranslations("Dashboard.financeAccounts");
  const { accounts, archiveAccount, createAccount, error, isDatabaseMode, isLoading, refresh, updateAccount } =
    useFinanceAccountsData();
  const { transactions } = useFinanceTransactionsData();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<FinanceAccount | undefined>();
  const [isSaving, setIsSaving] = React.useState(false);
  const accountsWithFallback = React.useMemo(
    () => (isDatabaseMode ? accounts : getFinanceAccountsWithFallback(accounts)),
    [accounts, isDatabaseMode],
  );
  const defaultAccount = React.useMemo(() => getDefaultFinanceAccount(accountsWithFallback), [accountsWithFallback]);
  const accountSummaries = React.useMemo(
    () => getAccountBalanceSummaries(accountsWithFallback, transactions, defaultAccount),
    [accountsWithFallback, defaultAccount, transactions],
  );
  const activeAccountsCount = accounts.filter((account) => !account.archived).length;
  const archivedAccountsCount = accounts.filter((account) => account.archived).length;
  const totalCurrentBalanceCents = accountSummaries.reduce((total, summary) => total + summary.currentBalanceCents, 0);
  const totalProjectedBalanceCents = accountSummaries.reduce(
    (total, summary) => total + summary.projectedBalanceCents,
    0,
  );

  const openCreateDialog = () => {
    setEditingAccount(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (account: FinanceAccount) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const saveAccount = async (form: AccountFormState) => {
    const payload = {
      archived: form.archived,
      currency: form.currency,
      institution: form.institution.trim() || undefined,
      name: form.name.trim(),
      openingBalanceCents: parseMoneyToCents(form.openingBalance),
      type: form.type,
    };

    setIsSaving(true);

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, payload);
      } else {
        await createAccount(payload);
      }

      setDialogOpen(false);
      setEditingAccount(undefined);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : t("errors.save"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveAccount = async (id: string) => {
    try {
      await archiveAccount(id);
    } catch (archiveError) {
      toast.error(archiveError instanceof Error ? archiveError.message : t("errors.archive"));
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-12 lg:pt-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-foreground leading-none tracking-tight">{t("title")}</h1>
          <p className="text-lg text-muted-foreground leading-none">{t("subtitle")}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          {t("create")}
        </Button>
      </div>

      {isDatabaseMode && error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => void refresh()} size="sm" variant="outline">
            {t("actions.retry")}
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="grid grid-cols-1 xl:grid-cols-8">
          <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
            <CardHeader>
              <CardTitle className="font-normal">{t("kpi.total")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">{accounts.length}</div>
              <p className="text-muted-foreground text-xs">{t("kpi.totalDescription")}</p>
            </CardContent>
          </Card>

          <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
            <CardHeader>
              <CardTitle className="font-normal">{t("kpi.active")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">{activeAccountsCount}</div>
              <p className="text-muted-foreground text-xs">{t("kpi.activeDescription")}</p>
            </CardContent>
          </Card>

          <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
            <CardHeader>
              <CardTitle className="font-normal">{t("kpi.currentBalance")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">
                <PrivacyValue>{formatMoney(totalCurrentBalanceCents)}</PrivacyValue>
              </div>
              <p className="text-muted-foreground text-xs">{t("kpi.currentBalanceDescription")}</p>
            </CardContent>
          </Card>

          <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-normal">{t("kpi.projectedBalance")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">
                <PrivacyValue>{formatMoney(totalProjectedBalanceCents)}</PrivacyValue>
              </div>
              <p className="text-muted-foreground text-xs">
                {t("kpi.projectedBalanceDescription", { count: archivedAccountsCount })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">{t("list.title")}</CardTitle>
          <CardDescription>{t("list.description")}</CardDescription>
          <CardAction>
            <Badge variant="outline">{t("list.count", { count: accounts.length })}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isDatabaseMode && isLoading ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-muted-foreground text-sm">
              {t("loading")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.account")}</TableHead>
                    <TableHead>{t("table.institution")}</TableHead>
                    <TableHead>{t("table.type")}</TableHead>
                    <TableHead>{t("table.currency")}</TableHead>
                    <TableHead className="text-left">{t("table.openingBalance")}</TableHead>
                    <TableHead className="text-left">{t("table.currentBalance")}</TableHead>
                    <TableHead className="text-left">{t("table.projectedBalance")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="w-16 text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountSummaries.map((summary) => {
                    const Icon = getAccountIcon(summary.account.type);

                    return (
                      <TableRow className={cn(summary.account.archived && "opacity-60")} key={summary.account.id}>
                        <TableCell>
                          <div className="flex min-w-48 items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-muted-foreground">
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-medium">{summary.account.name}</div>
                              <div className="text-muted-foreground text-xs">
                                {t("table.movements", { count: summary.movementCount })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {summary.account.institution || t("table.noInstitution")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t(`types.${summary.account.type}`)}</Badge>
                        </TableCell>
                        <TableCell>{summary.account.currency}</TableCell>
                        <TableCell>
                          <PrivacyValue>
                            {formatMoney(summary.account.openingBalanceCents, summary.account.currency)}
                          </PrivacyValue>
                        </TableCell>
                        <TableCell>
                          <PrivacyValue>
                            {formatMoney(summary.currentBalanceCents, summary.account.currency)}
                          </PrivacyValue>
                        </TableCell>
                        <TableCell>
                          <PrivacyValue>
                            {formatMoney(summary.projectedBalanceCents, summary.account.currency)}
                          </PrivacyValue>
                        </TableCell>
                        <TableCell>
                          <Badge variant={summary.account.archived ? "secondary" : "outline"}>
                            {t(summary.account.archived ? "status.archived" : "status.active")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-label={t("table.openActions", { name: summary.account.name })}
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(summary.account)}>
                                <Pencil />
                                {t("actions.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={summary.account.archived}
                                onClick={() => void handleArchiveAccount(summary.account.id)}
                              >
                                <Archive />
                                {t("actions.archive")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {accounts.length === 0 && !(isDatabaseMode && isLoading) ? (
            <div className="mt-4 rounded-lg border border-dashed py-8 text-center">
              <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Landmark className="size-5" />
              </div>
              <p className="font-medium text-sm">{t("empty.title")}</p>
              <p className="mt-1 text-muted-foreground text-sm">{t("empty.description")}</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus />
                {t("empty.action")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AccountFormDialog
        account={editingAccount}
        isSaving={isSaving}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAccount(undefined);
        }}
        onSave={saveAccount}
        open={dialogOpen}
      />
    </div>
  );
}
