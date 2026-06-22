"use client";

import * as React from "react";

import { isDatabaseMode as resolveIsDatabaseMode } from "@/config/papero-mode";

import { type FinanceContact, type FinanceContactType, useFinanceContacts } from "./contacts-store";

type CreateFinanceContactInput = Omit<FinanceContact, "id">;
type UpdateFinanceContactInput = Partial<Omit<FinanceContact, "id">>;

type FinanceContactsApiResponse = {
  contacts?: FinanceContact[];
  error?: string;
};

type FinanceContactApiResponse = {
  contact?: FinanceContact;
  error?: string;
};

export type FinanceContactsData = {
  addContact: (contact: CreateFinanceContactInput) => Promise<FinanceContact | null>;
  contacts: FinanceContact[];
  error: string | null;
  isDatabaseMode: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateContact: (id: string, patch: UpdateFinanceContactInput) => Promise<FinanceContact | undefined>;
};

function getApiErrorMessage(response: Response, fallback: string) {
  return response
    .json()
    .then((body: { error?: unknown }) => (typeof body.error === "string" ? body.error : fallback))
    .catch(() => fallback);
}

function isFinanceContact(value: unknown): value is FinanceContact {
  if (!value || typeof value !== "object") return false;

  const contact = value as Partial<FinanceContact>;
  return (
    typeof contact.id === "string" &&
    typeof contact.name === "string" &&
    (contact.type === "customer" || contact.type === "supplier") &&
    (contact.taxId === undefined || typeof contact.taxId === "string") &&
    (contact.address === undefined || typeof contact.address === "string") &&
    (contact.website === undefined || typeof contact.website === "string")
  );
}

function normalizeApiContacts(contacts: unknown) {
  return Array.isArray(contacts) ? contacts.filter(isFinanceContact) : [];
}

export function useFinanceContactsData(type?: FinanceContactType): FinanceContactsData {
  const localContacts = useFinanceContacts();
  const isDatabaseMode = resolveIsDatabaseMode();
  const [databaseContacts, setDatabaseContacts] = React.useState<FinanceContact[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!isDatabaseMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = type ? `?type=${type}` : "";
      const response = await fetch(`/api/finance/contacts${searchParams}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Could not load finance contacts."));
      }

      const body = (await response.json()) as FinanceContactsApiResponse;
      setDatabaseContacts(normalizeApiContacts(body.contacts));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load finance contacts.");
      setDatabaseContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isDatabaseMode, type]);

  React.useEffect(() => {
    if (isDatabaseMode) {
      void refresh();
    }
  }, [isDatabaseMode, refresh]);

  const addContact = React.useCallback(
    async (contact: CreateFinanceContactInput) => {
      if (!isDatabaseMode) {
        return localContacts.addContact(contact);
      }

      setError(null);
      const response = await fetch("/api/finance/contacts", {
        body: JSON.stringify(contact),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not create finance contact.");
        setError(message);
        throw new Error(message);
      }

      const body = (await response.json()) as FinanceContactApiResponse;
      const nextContact = body.contact;
      if (!isFinanceContact(nextContact)) {
        throw new Error("The finance contact response was invalid.");
      }

      await refresh();
      return nextContact;
    },
    [isDatabaseMode, localContacts.addContact, refresh],
  );

  const updateContact = React.useCallback(
    async (id: string, patch: UpdateFinanceContactInput) => {
      if (!isDatabaseMode) return undefined;

      setError(null);
      const response = await fetch(`/api/finance/contacts/${id}`, {
        body: JSON.stringify(patch),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not update finance contact.");
        setError(message);
        throw new Error(message);
      }

      const body = (await response.json()) as FinanceContactApiResponse;
      await refresh();
      return body.contact;
    },
    [isDatabaseMode, refresh],
  );

  return {
    addContact,
    contacts: isDatabaseMode ? databaseContacts : localContacts.contacts,
    error,
    isDatabaseMode,
    isLoading,
    refresh,
    updateContact,
  };
}
