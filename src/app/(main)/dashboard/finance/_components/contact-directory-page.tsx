"use client";

import * as React from "react";

import { Building2, Globe, IdCard, MapPin, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { type FinanceContact, type FinanceContactType, useFinanceContacts } from "./contacts-store";
import { getCustomerUsage, getFinanceUsageKey, getSupplierUsage, type TransactionUsage } from "./finance-calculations";
import { useFinanceTransactions } from "./finance-transactions-store";

type ContactDirectoryCopyKey = "customers" | "suppliers";

type ContactDirectoryPageProps = {
  contactType: FinanceContactType;
  copyKey: ContactDirectoryCopyKey;
};

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(amountCents / 100);
}

function ContactKpiStrip({ contacts, usage }: { contacts: FinanceContact[]; usage: Record<string, TransactionUsage> }) {
  const t = useTranslations("Dashboard.financeContacts");
  const contactsWithTaxId = contacts.filter((contact) => contact.taxId).length;
  const contactsWithWebsite = contacts.filter((contact) => contact.website).length;
  const contactsWithUsage = contacts.filter((contact) => usage[getFinanceUsageKey(contact.name)]).length;

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-1 xl:grid-cols-8">
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
          <CardHeader>
            <CardTitle className="font-normal">{t("kpi.total")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-3xl leading-none tracking-tight">{contacts.length}</div>
            <p className="text-muted-foreground text-xs">{t("kpi.totalDescription")}</p>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
          <CardHeader>
            <CardTitle className="font-normal">{t("kpi.taxIds")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-3xl leading-none tracking-tight">{contactsWithTaxId}</div>
            <p className="text-muted-foreground text-xs">{t("kpi.taxIdsDescription")}</p>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
          <CardHeader>
            <CardTitle className="font-normal">{t("kpi.websites")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-3xl leading-none tracking-tight">{contactsWithWebsite}</div>
            <p className="text-muted-foreground text-xs">{t("kpi.websitesDescription")}</p>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-normal">{t("kpi.usage")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-3xl leading-none tracking-tight">{contactsWithUsage}</div>
            <p className="text-muted-foreground text-xs">{t("kpi.usageDescription")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContactDetailsDialog({
  companyName,
  contactType,
  onCompanyNameChange,
  onOpenChange,
  onSave,
  open,
}: {
  companyName: string;
  contactType: FinanceContactType;
  onCompanyNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: Omit<FinanceContact, "id">) => void;
  open: boolean;
}) {
  const t = useTranslations("Dashboard.financeContacts");
  const [taxId, setTaxId] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [website, setWebsite] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setTaxId("");
    setAddress("");
    setWebsite("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <label className="grid gap-1.5" htmlFor={`${contactType}-company-name`}>
            <span className="font-medium text-sm">{t("dialog.companyName")}</span>
            <Input
              id={`${contactType}-company-name`}
              onChange={(event) => onCompanyNameChange(event.target.value)}
              value={companyName}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5" htmlFor={`${contactType}-tax-id`}>
              <span className="font-medium text-sm">{t("dialog.taxId")}</span>
              <Input id={`${contactType}-tax-id`} onChange={(event) => setTaxId(event.target.value)} value={taxId} />
            </label>
            <label className="grid gap-1.5" htmlFor={`${contactType}-website`}>
              <span className="font-medium text-sm">{t("dialog.website")}</span>
              <Input
                id={`${contactType}-website`}
                onChange={(event) => setWebsite(event.target.value)}
                value={website}
              />
            </label>
          </div>
          <label className="grid gap-1.5" htmlFor={`${contactType}-address`}>
            <span className="font-medium text-sm">{t("dialog.address")}</span>
            <Input id={`${contactType}-address`} onChange={(event) => setAddress(event.target.value)} value={address} />
          </label>
        </div>

        <DialogFooter>
          <Button
            disabled={!companyName.trim()}
            onClick={() =>
              onSave({
                address,
                name: companyName,
                taxId,
                type: contactType,
                website,
              })
            }
          >
            {t("dialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactList({
  contacts,
  copyKey,
  usage,
}: {
  contacts: FinanceContact[];
  copyKey: ContactDirectoryCopyKey;
  usage: Record<string, TransactionUsage>;
}) {
  const t = useTranslations("Dashboard.financeContacts");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{t(`${copyKey}.listTitle`)}</CardTitle>
        <CardDescription>{t(`${copyKey}.listDescription`)}</CardDescription>
        <CardAction>
          <Badge variant="outline">{t("list.count", { count: contacts.length })}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Separator />

        <div className="grid gap-2.5">
          {contacts.map((contact) => {
            const contactUsage = usage[getFinanceUsageKey(contact.name)];

            return (
              <div
                className={cn(
                  "grid gap-3 rounded-md border bg-background p-3 text-sm",
                  "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] md:items-center",
                  "dark:bg-input/20",
                )}
                key={contact.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-muted-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{contact.name}</div>
                    <div className="text-muted-foreground text-xs">{t("list.company")}</div>
                  </div>
                </div>

                <div className="grid gap-1 text-muted-foreground text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <IdCard className="size-3.5 shrink-0" />
                    <span className="truncate">{contact.taxId || t("list.noTaxId")}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{contact.address || t("list.noAddress")}</span>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
                  <Globe className="size-3.5 shrink-0" />
                  <span className="truncate">{contact.website || t("list.noWebsite")}</span>
                </div>

                <div className="flex flex-col items-start gap-1 md:items-end">
                  {contactUsage ? (
                    <>
                      <Badge variant="outline">{t("list.transactions", { count: contactUsage.count })}</Badge>
                      <span className="text-muted-foreground text-xs">
                        <PrivacyValue>{formatMoney(contactUsage.totalAmountCents)}</PrivacyValue>
                      </span>
                    </>
                  ) : (
                    <Badge className="text-muted-foreground" variant="outline">
                      {t("list.noTransactions")}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}

          {contacts.length === 0 ? (
            <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
              {t(`${copyKey}.empty`)}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ContactDirectoryPage({ contactType, copyKey }: ContactDirectoryPageProps) {
  const t = useTranslations("Dashboard.financeContacts");
  const [name, setName] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [companyName, setCompanyName] = React.useState("");
  const { addContact, contacts } = useFinanceContacts();
  const { transactions } = useFinanceTransactions([]);
  const visibleContacts = contacts.filter((contact) => contact.type === contactType || contact.type === undefined);
  const contactUsage = React.useMemo(
    () => (contactType === "customer" ? getCustomerUsage(transactions) : getSupplierUsage(transactions)),
    [contactType, transactions],
  );

  const openContactDialog = () => {
    if (!name.trim()) return;
    setCompanyName(name);
    setDialogOpen(true);
  };

  const saveContact = (contact: Omit<FinanceContact, "id">) => {
    const createdContact = addContact(contact);
    if (!createdContact) return;

    setName("");
    setCompanyName("");
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-12 lg:pt-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-foreground leading-none tracking-tight">{t(`${copyKey}.title`)}</h1>
        <p className="text-lg text-muted-foreground leading-none">{t(`${copyKey}.subtitle`)}</p>
      </div>

      <ContactKpiStrip contacts={visibleContacts} usage={contactUsage} />

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">{t(`${copyKey}.newTitle`)}</CardTitle>
          <CardDescription>{t(`${copyKey}.newDescription`)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              aria-label={t("newCompanyLabel")}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  openContactDialog();
                }
              }}
              placeholder={t("newCompanyPlaceholder")}
              value={name}
            />
            <Button aria-label={t("addCompany")} disabled={!name.trim()} onClick={openContactDialog} size="icon">
              <Plus />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContactList contacts={visibleContacts} copyKey={copyKey} usage={contactUsage} />

      <ContactDetailsDialog
        companyName={companyName}
        contactType={contactType}
        onCompanyNameChange={setCompanyName}
        onOpenChange={setDialogOpen}
        onSave={saveContact}
        open={dialogOpen}
      />
    </div>
  );
}
