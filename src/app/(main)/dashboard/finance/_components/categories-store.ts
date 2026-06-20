"use client";

import * as React from "react";

export type FinanceCategoryType = "income" | "fixed" | "variable" | "people" | "taxes" | "transfer";

export type FinanceCategory = {
  id: string;
  name: string;
  type: FinanceCategoryType;
};

export const financeCategoryTypes: { id: FinanceCategoryType; label: string; description: string }[] = [
  {
    id: "income",
    label: "Recebimentos",
    description: "Receitas, vendas e entradas previstas.",
  },
  {
    id: "fixed",
    label: "Despesas fixas",
    description: "Custos recorrentes e compromissos mensais.",
  },
  {
    id: "variable",
    label: "Despesas variáveis",
    description: "Custos que mudam conforme o mês.",
  },
  {
    id: "people",
    label: "Pessoas",
    description: "Equipe, sócios, prestadores e folha.",
  },
  {
    id: "taxes",
    label: "Impostos",
    description: "Tributos, guias e obrigações.",
  },
  {
    id: "transfer",
    label: "Transferências",
    description: "Movimentações entre contas.",
  },
];

export const defaultFinanceCategories: FinanceCategory[] = [
  { id: "cat-income-sales", name: "Vendas", type: "income" },
  { id: "cat-income-services", name: "Serviços", type: "income" },
  { id: "cat-income-subscriptions", name: "Assinaturas", type: "income" },
  { id: "cat-fixed-software", name: "Software", type: "fixed" },
  { id: "cat-fixed-rent", name: "Aluguel", type: "fixed" },
  { id: "cat-fixed-accounting", name: "Contabilidade", type: "fixed" },
  { id: "cat-variable-marketing", name: "Marketing", type: "variable" },
  { id: "cat-variable-travel", name: "Viagens", type: "variable" },
  { id: "cat-variable-supplies", name: "Materiais", type: "variable" },
  { id: "cat-people-payroll", name: "Folha de pagamento", type: "people" },
  { id: "cat-people-contractors", name: "Prestadores", type: "people" },
  { id: "cat-people-partners", name: "Sócios", type: "people" },
  { id: "cat-taxes-simples", name: "Simples Nacional", type: "taxes" },
  { id: "cat-taxes-inss", name: "INSS", type: "taxes" },
  { id: "cat-taxes-iss", name: "ISS", type: "taxes" },
  { id: "cat-transfer-accounts", name: "Transferência entre contas", type: "transfer" },
];

export const FINANCE_CATEGORIES_STORAGE_KEY = "papero:finance-categories:v1";
export const FINANCE_CATEGORIES_UPDATE_EVENT = "papero:finance-categories-updated";

function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function createCategoryId(type: FinanceCategoryType, name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `cat-${type}-${slug || Date.now()}`;
}

function isFinanceCategory(value: unknown): value is FinanceCategory {
  if (!value || typeof value !== "object") return false;

  const category = value as Partial<FinanceCategory>;
  return (
    typeof category.id === "string" &&
    typeof category.name === "string" &&
    financeCategoryTypes.some((type) => type.id === category.type)
  );
}

function readStoredCategories() {
  if (typeof window === "undefined") return defaultFinanceCategories;

  try {
    const raw = window.localStorage.getItem(FINANCE_CATEGORIES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultFinanceCategories;

    return parsed.filter(isFinanceCategory);
  } catch {
    return defaultFinanceCategories;
  }
}

function writeStoredCategories(categories: FinanceCategory[]) {
  window.localStorage.setItem(FINANCE_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  window.dispatchEvent(new CustomEvent(FINANCE_CATEGORIES_UPDATE_EVENT, { detail: categories }));
}

export function getFinanceCategoryTypeForTransactionKind(kind: string): FinanceCategoryType | null {
  if (
    kind === "income" ||
    kind === "fixed" ||
    kind === "variable" ||
    kind === "people" ||
    kind === "taxes" ||
    kind === "transfer"
  ) {
    return kind;
  }

  return null;
}

export function getFinanceCategoryTypeLabel(type: FinanceCategoryType) {
  return financeCategoryTypes.find((categoryType) => categoryType.id === type)?.label ?? type;
}

export function useFinanceCategories() {
  const [categories, setCategories] = React.useState<FinanceCategory[]>(defaultFinanceCategories);

  React.useEffect(() => {
    setCategories(readStoredCategories());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FINANCE_CATEGORIES_STORAGE_KEY) {
        setCategories(readStoredCategories());
      }
    };

    const handleCustomUpdate = (event: Event) => {
      const nextCategories = (event as CustomEvent<FinanceCategory[]>).detail;
      if (Array.isArray(nextCategories)) {
        setCategories(nextCategories.filter(isFinanceCategory));
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FINANCE_CATEGORIES_UPDATE_EVENT, handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FINANCE_CATEGORIES_UPDATE_EVENT, handleCustomUpdate);
    };
  }, []);

  const addCategory = React.useCallback((type: FinanceCategoryType, rawName: string) => {
    const name = normalizeCategoryName(rawName);
    if (!name) return null;

    let createdCategory: FinanceCategory | null = null;

    setCategories((current) => {
      const existing = current.find(
        (category) => category.type === type && category.name.toLowerCase() === name.toLowerCase(),
      );

      if (existing) {
        createdCategory = existing;
        return current;
      }

      const nextCategory = {
        id: createCategoryId(type, name),
        name,
        type,
      };
      const nextCategories = [...current, nextCategory];

      createdCategory = nextCategory;
      writeStoredCategories(nextCategories);
      return nextCategories;
    });

    return createdCategory;
  }, []);

  return {
    addCategory,
    categories,
  };
}
