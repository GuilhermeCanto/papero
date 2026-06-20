"use client";

import {
  FINANCE_CATEGORIES_STORAGE_KEY,
  FINANCE_CATEGORIES_UPDATE_EVENT,
  type FinanceCategory,
} from "./categories-store";
import { FINANCE_CONTACTS_STORAGE_KEY, FINANCE_CONTACTS_UPDATE_EVENT, type FinanceContact } from "./contacts-store";
import {
  FINANCE_TRANSACTIONS_STORAGE_KEY,
  FINANCE_TRANSACTIONS_UPDATE_EVENT,
  type FinanceTransaction,
} from "./finance-transactions-store";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function makeDate(day: number, monthOffset = 0) {
  const today = new Date();
  return formatLocalDate(new Date(today.getFullYear(), today.getMonth() + monthOffset, day));
}

export const demoFinanceCategories: FinanceCategory[] = [
  { id: "demo-cat-income-services", name: "Serviços", type: "income" },
  { id: "demo-cat-income-subscriptions", name: "Assinaturas", type: "income" },
  { id: "demo-cat-income-consulting", name: "Consultoria", type: "income" },
  { id: "demo-cat-fixed-software", name: "Software", type: "fixed" },
  { id: "demo-cat-fixed-accounting", name: "Contabilidade", type: "fixed" },
  { id: "demo-cat-variable-marketing", name: "Marketing", type: "variable" },
  { id: "demo-cat-variable-travel", name: "Viagens", type: "variable" },
  { id: "demo-cat-people-contractors", name: "Prestadores", type: "people" },
  { id: "demo-cat-people-payroll", name: "Folha de pagamento", type: "people" },
  { id: "demo-cat-taxes-simples", name: "Simples Nacional", type: "taxes" },
  { id: "demo-cat-taxes-iss", name: "ISS", type: "taxes" },
  { id: "demo-cat-transfer-accounts", name: "Transferência entre contas", type: "transfer" },
];

export const demoFinanceContacts: FinanceContact[] = [
  {
    id: "demo-contact-customer-bridgesell",
    name: "BridgeSell",
    taxId: "12.345.678/0001-90",
    type: "customer",
    website: "https://bridgesell.com",
  },
  {
    address: "Av. Paulista, 1000 - Sao Paulo, SP",
    id: "demo-contact-customer-apollo7",
    name: "Apollo7",
    taxId: "23.456.789/0001-01",
    type: "customer",
    website: "https://apollo7.io",
  },
  {
    id: "demo-contact-customer-nova-agency",
    name: "Nova Agency",
    type: "customer",
    website: "https://nova.example",
  },
  {
    id: "demo-contact-supplier-resend",
    name: "Resend",
    type: "supplier",
    website: "https://resend.com",
  },
  {
    id: "demo-contact-supplier-vercel",
    name: "Vercel",
    type: "supplier",
    website: "https://vercel.com",
  },
  {
    address: "Rua Vergueiro, 500 - Sao Paulo, SP",
    id: "demo-contact-supplier-contabilize",
    name: "Contabilize",
    taxId: "34.567.890/0001-12",
    type: "supplier",
  },
  {
    id: "demo-contact-supplier-pedro-santos",
    name: "Pedro Santos",
    type: "supplier",
  },
  {
    id: "demo-contact-supplier-meta-ads",
    name: "Meta Ads",
    type: "supplier",
    website: "https://business.facebook.com",
  },
  {
    id: "demo-contact-supplier-azul",
    name: "Azul",
    type: "supplier",
    website: "https://voeazul.com.br",
  },
  {
    id: "demo-contact-supplier-internal-team",
    name: "Equipe interna",
    type: "supplier",
  },
  {
    id: "demo-contact-supplier-receita-federal",
    name: "Receita Federal",
    type: "supplier",
    website: "https://www.gov.br/receitafederal",
  },
  {
    id: "demo-contact-supplier-prefeitura",
    name: "Prefeitura",
    type: "supplier",
  },
  {
    id: "demo-contact-supplier-main-account",
    name: "Conta Principal",
    type: "supplier",
  },
];

export function createDemoFinanceTransactions(today = new Date()): FinanceTransaction[] {
  return [
    {
      amountCents: 1280000,
      category: "Serviços",
      date: makeDate(5),
      description: "Projeto BridgeSell",
      from: "BridgeSell",
      id: "demo-txn-income-bridgesell-paid",
      kind: "income",
      paid: true,
      paymentMode: "Pix",
      paymentTime: "cash",
      paymentType: "À vista",
    },
    {
      amountCents: 760000,
      category: "Assinaturas",
      date: makeDate(12),
      description: "Plano Apollo7",
      from: "Apollo7",
      id: "demo-txn-income-apollo-paid",
      kind: "income",
      paid: true,
      paymentMode: "Bank Transfer",
      paymentTime: "recurring",
      paymentType: "Recorrente",
    },
    {
      amountCents: 420000,
      category: "Consultoria",
      date: formatLocalDate(addDays(today, 6)),
      description: "Consultoria Nova Agency",
      from: "Nova Agency",
      id: "demo-txn-income-nova-upcoming",
      kind: "income",
      paid: false,
      paymentMode: "Pix",
      paymentTime: "cash",
      paymentType: "À vista",
    },
    {
      amountCents: 590000,
      category: "Serviços",
      date: makeDate(8, 1),
      description: "Retainer BridgeSell",
      from: "BridgeSell",
      id: "demo-txn-income-bridgesell-next-month",
      kind: "income",
      paid: false,
      paymentMode: "Bank Transfer",
      paymentTime: "recurring",
      paymentType: "Recorrente",
    },
    {
      amountCents: 14900,
      category: "Software",
      date: makeDate(7),
      description: "Vercel Pro",
      from: "Vercel",
      id: "demo-txn-fixed-vercel-paid",
      kind: "fixed",
      paid: true,
      paymentMode: "Credit Card",
      paymentTime: "recurring",
      paymentType: "Recorrente",
    },
    {
      amountCents: 19500,
      category: "Software",
      date: formatLocalDate(addDays(today, 4)),
      description: "Resend Pro",
      from: "Resend",
      id: "demo-txn-fixed-resend-upcoming",
      kind: "fixed",
      paid: false,
      paymentMode: "Credit Card",
      paymentTime: "recurring",
      paymentType: "Recorrente",
    },
    {
      amountCents: 48000,
      category: "Contabilidade",
      date: makeDate(10),
      description: "Contabilidade mensal",
      from: "Contabilize",
      id: "demo-txn-fixed-accounting-paid",
      kind: "fixed",
      paid: true,
      paymentMode: "Boleto",
      paymentTime: "recurring",
      paymentType: "Recorrente",
    },
    {
      amountCents: 68000,
      category: "Marketing",
      date: formatLocalDate(addDays(today, -5)),
      description: "Campanha atrasada",
      from: "Meta Ads",
      id: "demo-txn-variable-marketing-overdue",
      kind: "variable",
      paid: false,
      paymentMode: "Credit Card",
      paymentTime: "cash",
      paymentType: "À vista",
    },
    {
      amountCents: 32000,
      category: "Viagens",
      date: makeDate(16),
      description: "Visita cliente",
      from: "Azul",
      id: "demo-txn-variable-travel-paid",
      kind: "variable",
      paid: true,
      paymentMode: "Credit Card",
      paymentTime: "installment",
      paymentType: "Parcelado",
    },
    {
      amountCents: 220000,
      category: "Prestadores",
      date: formatLocalDate(addDays(today, 9)),
      description: "Designer freelancer",
      from: "Pedro Santos",
      id: "demo-txn-people-contractor-upcoming",
      kind: "people",
      paid: false,
      paymentMode: "Pix",
      paymentTime: "cash",
      paymentType: "À vista",
    },
    {
      amountCents: 380000,
      category: "Folha de pagamento",
      date: makeDate(25),
      description: "Pro-labore",
      from: "Equipe interna",
      id: "demo-txn-people-payroll-current",
      kind: "people",
      paid: false,
      paymentMode: "Bank Transfer",
      paymentTime: "recurring",
      paymentType: "Recorrente",
    },
    {
      amountCents: 74000,
      category: "Simples Nacional",
      date: formatLocalDate(addDays(today, -2)),
      description: "DAS em aberto",
      from: "Receita Federal",
      id: "demo-txn-taxes-overdue",
      kind: "taxes",
      paid: false,
      paymentMode: "Boleto",
      paymentTime: "cash",
      paymentType: "À vista",
    },
    {
      amountCents: 26000,
      category: "ISS",
      date: makeDate(20, 1),
      description: "ISS previsto",
      from: "Prefeitura",
      id: "demo-txn-taxes-next-month",
      kind: "taxes",
      paid: false,
      paymentMode: "Boleto",
      paymentTime: "cash",
      paymentType: "À vista",
    },
    {
      amountCents: 150000,
      category: "Transferência entre contas",
      date: makeDate(18),
      description: "Reserva operacional",
      from: "Conta Principal",
      id: "demo-txn-transfer-reserve",
      kind: "transfer",
      paid: true,
      paymentMode: "Bank Transfer",
      paymentTime: "cash",
      paymentType: "À vista",
    },
  ];
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seenIds = new Set<string>();

  return items.filter((item) => {
    if (seenIds.has(item.id)) return false;

    seenIds.add(item.id);
    return true;
  });
}

function writeFinanceData({
  categories,
  contacts,
  transactions,
}: {
  categories: FinanceCategory[];
  contacts: FinanceContact[];
  transactions: FinanceTransaction[];
}) {
  const uniqueCategories = uniqueById(categories);
  const uniqueContacts = uniqueById(contacts);
  const uniqueTransactions = uniqueById(transactions);

  window.localStorage.setItem(FINANCE_CATEGORIES_STORAGE_KEY, JSON.stringify(uniqueCategories));
  window.localStorage.setItem(FINANCE_CONTACTS_STORAGE_KEY, JSON.stringify(uniqueContacts));
  window.localStorage.setItem(FINANCE_TRANSACTIONS_STORAGE_KEY, JSON.stringify(uniqueTransactions));

  window.dispatchEvent(new CustomEvent(FINANCE_CATEGORIES_UPDATE_EVENT, { detail: uniqueCategories }));
  window.dispatchEvent(new CustomEvent(FINANCE_CONTACTS_UPDATE_EVENT, { detail: uniqueContacts }));
  window.dispatchEvent(new CustomEvent(FINANCE_TRANSACTIONS_UPDATE_EVENT, { detail: uniqueTransactions }));
}

export function loadDemoFinanceData() {
  if (typeof window === "undefined") return;

  writeFinanceData({
    categories: demoFinanceCategories,
    contacts: demoFinanceContacts,
    transactions: createDemoFinanceTransactions(),
  });
}

export function clearFinanceData() {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(FINANCE_CATEGORIES_STORAGE_KEY, JSON.stringify([]));
  window.localStorage.setItem(FINANCE_CONTACTS_STORAGE_KEY, JSON.stringify([]));
  window.localStorage.setItem(FINANCE_TRANSACTIONS_STORAGE_KEY, JSON.stringify([]));

  window.dispatchEvent(new CustomEvent(FINANCE_CATEGORIES_UPDATE_EVENT, { detail: [] }));
  window.dispatchEvent(new CustomEvent(FINANCE_CONTACTS_UPDATE_EVENT, { detail: [] }));
  window.dispatchEvent(new CustomEvent(FINANCE_TRANSACTIONS_UPDATE_EVENT, { detail: [] }));
}

export function resetFinanceDemoData() {
  clearFinanceData();
  loadDemoFinanceData();
}
