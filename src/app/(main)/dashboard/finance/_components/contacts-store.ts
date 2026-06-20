"use client";

import * as React from "react";

export type FinanceContact = {
  address?: string;
  id: string;
  name: string;
  taxId?: string;
  type?: FinanceContactType;
  website?: string;
};

export type FinanceContactType = "customer" | "supplier";

export const defaultFinanceContacts: FinanceContact[] = [
  {
    id: "contact-bridgesell",
    name: "BridgeSell",
    taxId: "00.000.000/0001-00",
    type: "customer",
    website: "https://bridgesell.com",
  },
  {
    id: "contact-apollo7",
    name: "Apollo7",
    taxId: "00.000.000/0001-00",
    type: "customer",
    website: "https://apollo7.io",
  },
  {
    id: "contact-resend",
    name: "Resend",
    type: "supplier",
    website: "https://resend.com",
  },
];

export const FINANCE_CONTACTS_STORAGE_KEY = "papero:finance-contacts:v1";
export const FINANCE_CONTACTS_UPDATE_EVENT = "papero:finance-contacts-updated";

function normalizeContactText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function createContactId(name: string, type?: FinanceContactType) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `contact-${type ? `${type}-` : ""}${slug || Date.now()}`;
}

function isFinanceContactType(value: unknown): value is FinanceContactType {
  return value === "customer" || value === "supplier";
}

function isFinanceContact(value: unknown): value is FinanceContact {
  if (!value || typeof value !== "object") return false;

  const contact = value as Partial<FinanceContact>;
  return (
    typeof contact.id === "string" &&
    typeof contact.name === "string" &&
    (contact.taxId === undefined || typeof contact.taxId === "string") &&
    (contact.address === undefined || typeof contact.address === "string") &&
    (contact.type === undefined || isFinanceContactType(contact.type)) &&
    (contact.website === undefined || typeof contact.website === "string")
  );
}

function readStoredContacts() {
  if (typeof window === "undefined") return defaultFinanceContacts;

  try {
    const raw = window.localStorage.getItem(FINANCE_CONTACTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultFinanceContacts;

    return parsed.filter(isFinanceContact);
  } catch {
    return defaultFinanceContacts;
  }
}

function writeStoredContacts(contacts: FinanceContact[]) {
  window.localStorage.setItem(FINANCE_CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  window.dispatchEvent(new CustomEvent(FINANCE_CONTACTS_UPDATE_EVENT, { detail: contacts }));
}

export function useFinanceContacts() {
  const [contacts, setContacts] = React.useState<FinanceContact[]>(defaultFinanceContacts);

  React.useEffect(() => {
    setContacts(readStoredContacts());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FINANCE_CONTACTS_STORAGE_KEY) {
        setContacts(readStoredContacts());
      }
    };

    const handleCustomUpdate = (event: Event) => {
      const nextContacts = (event as CustomEvent<FinanceContact[]>).detail;
      if (Array.isArray(nextContacts)) {
        setContacts(nextContacts.filter(isFinanceContact));
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FINANCE_CONTACTS_UPDATE_EVENT, handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FINANCE_CONTACTS_UPDATE_EVENT, handleCustomUpdate);
    };
  }, []);

  const addContact = React.useCallback((rawContact: Omit<FinanceContact, "id">) => {
    const name = normalizeContactText(rawContact.name);
    if (!name) return null;

    const taxId = rawContact.taxId ? normalizeContactText(rawContact.taxId) : undefined;
    const address = rawContact.address ? normalizeContactText(rawContact.address) : undefined;
    const type = rawContact.type;
    const website = rawContact.website ? normalizeContactText(rawContact.website) : undefined;

    let createdContact: FinanceContact | null = null;

    setContacts((current) => {
      const existing = current.find(
        (contact) =>
          contact.name.toLowerCase() === name.toLowerCase() && (contact.type === type || contact.type === undefined),
      );

      if (existing) {
        createdContact = existing;
        return current;
      }

      const nextContact = {
        address,
        id: createContactId(name, type),
        name,
        taxId,
        type,
        website,
      };
      const nextContacts = [...current, nextContact];

      createdContact = nextContact;
      writeStoredContacts(nextContacts);
      return nextContacts;
    });

    return createdContact;
  }, []);

  return {
    addContact,
    contacts,
  };
}
