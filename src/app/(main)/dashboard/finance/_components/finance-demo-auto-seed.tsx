"use client";

import * as React from "react";

import { isDemoMode } from "@/config/papero-mode";

import { FINANCE_CATEGORIES_STORAGE_KEY } from "./categories-store";
import { FINANCE_CONTACTS_STORAGE_KEY } from "./contacts-store";
import { loadDemoFinanceData } from "./finance-demo-data";
import { FINANCE_TRANSACTIONS_STORAGE_KEY } from "./finance-transactions-store";

let demoAutoSeedStarted = false;

function isStoredCollectionEmpty(storageKey: string) {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return true;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === 0;
  } catch {
    return false;
  }
}

function areFinanceStoresEmpty() {
  return (
    isStoredCollectionEmpty(FINANCE_CATEGORIES_STORAGE_KEY) &&
    isStoredCollectionEmpty(FINANCE_CONTACTS_STORAGE_KEY) &&
    isStoredCollectionEmpty(FINANCE_TRANSACTIONS_STORAGE_KEY)
  );
}

export function FinanceDemoAutoSeed() {
  React.useEffect(() => {
    if (!isDemoMode()) return;
    if (demoAutoSeedStarted) return;
    if (!areFinanceStoresEmpty()) return;

    demoAutoSeedStarted = true;
    loadDemoFinanceData();
  }, []);

  return null;
}
