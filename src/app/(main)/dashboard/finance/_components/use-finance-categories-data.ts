"use client";

import * as React from "react";

import { isDatabaseMode as resolveIsDatabaseMode } from "@/config/papero-mode";

import { type FinanceCategory, type FinanceCategoryType, useFinanceCategories } from "./categories-store";

type FinanceCategoriesApiResponse = {
  categories?: FinanceCategory[];
  error?: string;
};

type FinanceCategoryApiResponse = {
  category?: FinanceCategory;
  error?: string;
};

type UpdateFinanceCategoryInput = Partial<Pick<FinanceCategory, "name" | "type">>;

export type FinanceCategoriesData = {
  addCategory: (type: FinanceCategoryType, rawName: string) => Promise<FinanceCategory | null>;
  categories: FinanceCategory[];
  error: string | null;
  isDatabaseMode: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateCategory: (id: string, patch: UpdateFinanceCategoryInput) => Promise<FinanceCategory | undefined>;
};

function getApiErrorMessage(response: Response, fallback: string) {
  return response
    .json()
    .then((body: { error?: unknown }) => (typeof body.error === "string" ? body.error : fallback))
    .catch(() => fallback);
}

function isFinanceCategory(value: unknown): value is FinanceCategory {
  if (!value || typeof value !== "object") return false;

  const category = value as Partial<FinanceCategory>;
  return typeof category.id === "string" && typeof category.name === "string" && typeof category.type === "string";
}

function normalizeApiCategories(categories: unknown) {
  return Array.isArray(categories) ? categories.filter(isFinanceCategory) : [];
}

function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function useFinanceCategoriesData(): FinanceCategoriesData {
  const localCategories = useFinanceCategories();
  const isDatabaseMode = resolveIsDatabaseMode();
  const [databaseCategories, setDatabaseCategories] = React.useState<FinanceCategory[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!isDatabaseMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/finance/categories", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Could not load finance categories."));
      }

      const body = (await response.json()) as FinanceCategoriesApiResponse;
      setDatabaseCategories(normalizeApiCategories(body.categories));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load finance categories.");
      setDatabaseCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [isDatabaseMode]);

  React.useEffect(() => {
    if (isDatabaseMode) {
      void refresh();
    }
  }, [isDatabaseMode, refresh]);

  const addCategory = React.useCallback(
    async (type: FinanceCategoryType, rawName: string) => {
      if (!isDatabaseMode) {
        return localCategories.addCategory(type, rawName);
      }

      const name = normalizeCategoryName(rawName);
      if (!name) return null;

      setError(null);
      const response = await fetch("/api/finance/categories", {
        body: JSON.stringify({ name, type }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not create finance category.");
        setError(message);
        throw new Error(message);
      }

      const body = (await response.json()) as FinanceCategoryApiResponse;
      const nextCategory = body.category;
      if (!isFinanceCategory(nextCategory)) {
        throw new Error("The finance category response was invalid.");
      }

      await refresh();
      return nextCategory;
    },
    [isDatabaseMode, localCategories.addCategory, refresh],
  );

  const updateCategory = React.useCallback(
    async (id: string, patch: UpdateFinanceCategoryInput) => {
      if (!isDatabaseMode) return undefined;

      setError(null);
      const response = await fetch(`/api/finance/categories/${id}`, {
        body: JSON.stringify(patch),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Could not update finance category.");
        setError(message);
        throw new Error(message);
      }

      const body = (await response.json()) as FinanceCategoryApiResponse;
      await refresh();
      return body.category;
    },
    [isDatabaseMode, refresh],
  );

  return {
    addCategory,
    categories: isDatabaseMode ? databaseCategories : localCategories.categories,
    error,
    isDatabaseMode,
    isLoading,
    refresh,
    updateCategory,
  };
}
