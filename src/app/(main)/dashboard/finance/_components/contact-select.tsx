"use client";

import * as React from "react";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { FinanceContact, FinanceContactType } from "./contacts-store";
import { useFinanceContactsData } from "./use-finance-contacts-data";

type ContactSelectProps = {
  contactType: FinanceContactType;
  label: string;
  onChange: (contact: FinanceContact) => void;
  value: string;
};

export function ContactSelect({ contactType, label, onChange, value }: ContactSelectProps) {
  const t = useTranslations("Dashboard.financeTransactions.contactSelect");
  const [open, setOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [taxId, setTaxId] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const { addContact, contacts, isLoading } = useFinanceContactsData(contactType);
  const visibleContacts = contacts.filter((contact) => contact.type === contactType || contact.type === undefined);

  const resetForm = () => {
    setName("");
    setCompanyName("");
    setTaxId("");
    setAddress("");
    setWebsite("");
  };

  const openContactDetails = () => {
    if (!name.trim()) return;

    setCompanyName(name);
    setOpen(false);
    setDetailsOpen(true);
  };

  const createContact = async () => {
    try {
      const contact = await addContact({
        address,
        name: companyName,
        taxId,
        type: contactType,
        website,
      });

      if (!contact) return;

      onChange(contact);
      resetForm();
      setOpen(false);
      setDetailsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.create"));
    }
  };

  const hasName = name.trim().length > 0;
  const hasCompanyName = companyName.trim().length > 0;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "h-8 w-full min-w-0 justify-between rounded-md border-input bg-background px-2 text-left font-normal shadow-xs dark:bg-input/30",
              !value && "text-muted-foreground",
            )}
            size="sm"
            variant="outline"
          >
            <span className="truncate">{value || label}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 gap-3 p-2.5">
          <div className="flex flex-col gap-1">
            <p className="font-medium text-sm">{t("title")}</p>
            <p className="text-muted-foreground text-xs">{t("description")}</p>
          </div>

          <div className="flex gap-2">
            <Input
              aria-label={t("companyName")}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  openContactDetails();
                }
              }}
              placeholder={t("newContact")}
              value={name}
            />
            <Button
              aria-label={t("newContact")}
              disabled={!hasName || isLoading}
              onClick={openContactDetails}
              size="icon"
              type="button"
            >
              <Plus />
            </Button>
          </div>

          <Separator />

          <div className="max-h-72 overflow-y-auto pr-1">
            <div className="flex flex-col gap-1">
              <div className="px-1.5 font-medium text-muted-foreground text-xs">{t("companies")}</div>
              {visibleContacts.map((contact) => (
                <button
                  className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-1.5 text-left text-sm transition-colors hover:bg-muted"
                  key={contact.id}
                  onClick={() => {
                    onChange(contact);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate">{contact.name}</span>
                    {contact.taxId ? (
                      <span className="truncate text-muted-foreground text-xs">{contact.taxId}</span>
                    ) : null}
                  </span>
                  {value === contact.name ? <Check className="size-3.5 shrink-0 text-primary" /> : null}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <label className="grid gap-1.5" htmlFor="contact-company-name">
              <span className="font-medium text-sm">{t("companyName")}</span>
              <Input
                id="contact-company-name"
                onChange={(event) => setCompanyName(event.target.value)}
                value={companyName}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5" htmlFor="contact-tax-id">
                <span className="font-medium text-sm">{t("companyId")}</span>
                <Input id="contact-tax-id" onChange={(event) => setTaxId(event.target.value)} value={taxId} />
              </label>
              <label className="grid gap-1.5" htmlFor="contact-website">
                <span className="font-medium text-sm">{t("site")}</span>
                <Input id="contact-website" onChange={(event) => setWebsite(event.target.value)} value={website} />
              </label>
            </div>
            <label className="grid gap-1.5" htmlFor="contact-address">
              <span className="font-medium text-sm">{t("address")}</span>
              <Input id="contact-address" onChange={(event) => setAddress(event.target.value)} value={address} />
            </label>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                void createContact();
              }}
              disabled={!hasCompanyName || isLoading}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
