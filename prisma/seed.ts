import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const demoUserEmail = "owner@papero.local";
const demoCompanyName = "Papero Demo Company";

const categories = [
  { name: "Serviços", type: "INCOME" },
  { name: "Assinaturas", type: "INCOME" },
  { name: "Consultoria", type: "INCOME" },
  { name: "Software", type: "FIXED_EXPENSE" },
  { name: "Contabilidade", type: "FIXED_EXPENSE" },
  { name: "Marketing", type: "VARIABLE_EXPENSE" },
  { name: "Viagens", type: "VARIABLE_EXPENSE" },
  { name: "Prestadores", type: "PEOPLE" },
  { name: "Folha de pagamento", type: "PEOPLE" },
  { name: "Simples Nacional", type: "TAXES" },
  { name: "ISS", type: "TAXES" },
  { name: "Transferência entre contas", type: "TRANSFER" },
] as const;

const contacts = [
  {
    name: "BridgeSell",
    document: "12.345.678/0001-90",
    type: "CUSTOMER",
    website: "https://bridgesell.com",
  },
  {
    address: "Av. Paulista, 1000 - Sao Paulo, SP",
    document: "23.456.789/0001-01",
    name: "Apollo7",
    type: "CUSTOMER",
    website: "https://apollo7.io",
  },
  {
    name: "Nova Agency",
    type: "CUSTOMER",
    website: "https://nova.example",
  },
  { name: "Resend", type: "SUPPLIER", website: "https://resend.com" },
  { name: "Vercel", type: "SUPPLIER", website: "https://vercel.com" },
  {
    address: "Rua Vergueiro, 500 - Sao Paulo, SP",
    document: "34.567.890/0001-12",
    name: "Contabilize",
    type: "SUPPLIER",
  },
  { name: "Pedro Santos", type: "SUPPLIER" },
  { name: "Meta Ads", type: "SUPPLIER", website: "https://business.facebook.com" },
  { name: "Azul", type: "SUPPLIER", website: "https://voeazul.com.br" },
  { name: "Equipe interna", type: "SUPPLIER" },
  { name: "Receita Federal", type: "SUPPLIER", website: "https://www.gov.br/receitafederal" },
  { name: "Prefeitura", type: "SUPPLIER" },
  { name: "Conta Principal", type: "SUPPLIER" },
] as const;

const paymentForms = {
  "Bank Transfer": "BANK_TRANSFER",
  Boleto: "BOLETO",
  "Credit Card": "CREDIT_CARD",
  Pix: "PIX",
} as const;

const paymentTimes = {
  cash: "CASH",
  installment: "INSTALLMENT",
  recurring: "RECURRING",
} as const;

const transactionKinds = {
  fixed: "FIXED",
  income: "INCOME",
  people: "PEOPLE",
  taxes: "TAXES",
  transfer: "TRANSFER",
  variable: "VARIABLE",
} as const;

function dateForDay(day: number, monthOffset = 0) {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + monthOffset, day);
}

function addDays(days: number) {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
}

const transactions = [
  {
    amountCents: 1280000,
    category: "Serviços",
    contact: "BridgeSell",
    date: dateForDay(5),
    description: "Projeto BridgeSell",
    kind: "income",
    paid: true,
    paymentForm: "Pix",
    paymentTime: "cash",
  },
  {
    amountCents: 760000,
    category: "Assinaturas",
    contact: "Apollo7",
    date: dateForDay(12),
    description: "Plano Apollo7",
    kind: "income",
    paid: true,
    paymentForm: "Bank Transfer",
    paymentTime: "recurring",
  },
  {
    amountCents: 420000,
    category: "Consultoria",
    contact: "Nova Agency",
    date: addDays(6),
    description: "Consultoria Nova Agency",
    kind: "income",
    paid: false,
    paymentForm: "Pix",
    paymentTime: "cash",
  },
  {
    amountCents: 590000,
    category: "Serviços",
    contact: "BridgeSell",
    date: dateForDay(8, 1),
    description: "Retainer BridgeSell",
    kind: "income",
    paid: false,
    paymentForm: "Bank Transfer",
    paymentTime: "recurring",
  },
  {
    amountCents: 14900,
    category: "Software",
    contact: "Vercel",
    date: dateForDay(7),
    description: "Vercel Pro",
    kind: "fixed",
    paid: true,
    paymentForm: "Credit Card",
    paymentTime: "recurring",
  },
  {
    amountCents: 19500,
    category: "Software",
    contact: "Resend",
    date: addDays(4),
    description: "Resend Pro",
    kind: "fixed",
    paid: false,
    paymentForm: "Credit Card",
    paymentTime: "recurring",
  },
  {
    amountCents: 48000,
    category: "Contabilidade",
    contact: "Contabilize",
    date: dateForDay(10),
    description: "Contabilidade mensal",
    kind: "fixed",
    paid: true,
    paymentForm: "Boleto",
    paymentTime: "recurring",
  },
  {
    amountCents: 68000,
    category: "Marketing",
    contact: "Meta Ads",
    date: addDays(-5),
    description: "Campanha atrasada",
    kind: "variable",
    paid: false,
    paymentForm: "Credit Card",
    paymentTime: "cash",
  },
  {
    amountCents: 32000,
    category: "Viagens",
    contact: "Azul",
    date: dateForDay(16),
    description: "Visita cliente",
    kind: "variable",
    paid: true,
    paymentForm: "Credit Card",
    paymentTime: "installment",
  },
  {
    amountCents: 220000,
    category: "Prestadores",
    contact: "Pedro Santos",
    date: addDays(9),
    description: "Designer freelancer",
    kind: "people",
    paid: false,
    paymentForm: "Pix",
    paymentTime: "cash",
  },
  {
    amountCents: 380000,
    category: "Folha de pagamento",
    contact: "Equipe interna",
    date: dateForDay(25),
    description: "Pro-labore",
    kind: "people",
    paid: false,
    paymentForm: "Bank Transfer",
    paymentTime: "recurring",
  },
  {
    amountCents: 74000,
    category: "Simples Nacional",
    contact: "Receita Federal",
    date: addDays(-2),
    description: "DAS em aberto",
    kind: "taxes",
    paid: false,
    paymentForm: "Boleto",
    paymentTime: "cash",
  },
  {
    amountCents: 26000,
    category: "ISS",
    contact: "Prefeitura",
    date: dateForDay(20, 1),
    description: "ISS previsto",
    kind: "taxes",
    paid: false,
    paymentForm: "Boleto",
    paymentTime: "cash",
  },
  {
    amountCents: 150000,
    category: "Transferência entre contas",
    contact: "Conta Principal",
    date: dateForDay(18),
    description: "Reserva operacional",
    kind: "transfer",
    paid: true,
    paymentForm: "Bank Transfer",
    paymentTime: "cash",
  },
] as const;

async function main() {
  const user = await prisma.user.upsert({
    create: {
      email: demoUserEmail,
      name: "Papero Demo Owner",
    },
    update: {
      name: "Papero Demo Owner",
    },
    where: {
      email: demoUserEmail,
    },
  });

  const existingCompany = await prisma.company.findFirst({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
      name: demoCompanyName,
    },
  });

  const company =
    existingCompany ??
    (await prisma.company.create({
      data: {
        currency: "BRL",
        document: "00.000.000/0001-00",
        name: demoCompanyName,
      },
    }));

  await prisma.companyMember.upsert({
    create: {
      companyId: company.id,
      role: "OWNER",
      userId: user.id,
    },
    update: {
      role: "OWNER",
    },
    where: {
      userId_companyId: {
        companyId: company.id,
        userId: user.id,
      },
    },
  });

  await prisma.transaction.deleteMany({ where: { companyId: company.id } });
  await prisma.bankAccount.deleteMany({ where: { companyId: company.id } });
  await prisma.category.deleteMany({ where: { companyId: company.id } });
  await prisma.contact.deleteMany({ where: { companyId: company.id } });

  const bankAccount = await prisma.bankAccount.create({
    data: {
      bankName: "Papero",
      cashFlowRole: "OPERATING",
      companyId: company.id,
      initialBalanceCents: 2500000,
      name: "Conta Principal",
    },
  });

  const categoryByName = new Map<string, string>();
  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: {
        companyId: company.id,
        name: category.name,
        type: category.type,
      },
    });

    categoryByName.set(category.name, createdCategory.id);
  }

  const contactByName = new Map<string, string>();
  for (const contact of contacts) {
    const createdContact = await prisma.contact.create({
      data: {
        address: "address" in contact ? contact.address : undefined,
        companyId: company.id,
        document: "document" in contact ? contact.document : undefined,
        name: contact.name,
        type: contact.type,
        website: "website" in contact ? contact.website : undefined,
      },
    });

    contactByName.set(contact.name, createdContact.id);
  }

  await prisma.transaction.createMany({
    data: transactions.map((transaction) => ({
      amountCents: transaction.amountCents,
      bankAccountId: bankAccount.id,
      categoryId: categoryByName.get(transaction.category),
      companyId: company.id,
      contactId: contactByName.get(transaction.contact),
      date: transaction.date,
      description: transaction.description,
      kind: transactionKinds[transaction.kind],
      paid: transaction.paid,
      paymentForm: paymentForms[transaction.paymentForm],
      paymentTime: paymentTimes[transaction.paymentTime],
    })),
  });

  console.log(
    `Seeded Papero demo database: 1 user, 1 company, ${categories.length} categories, ${contacts.length} contacts, ${transactions.length} transactions.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
