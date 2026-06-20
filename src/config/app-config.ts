import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Papero",
  version: packageJson.version,
  copyright: `© ${currentYear}, Papero.`,
  meta: {
    title: "Papero - Simple Financial Management",
    description:
      "Papero is a simple financial management SaaS for small companies to manage cash flow, transactions, payables, receivables, contacts, and categories.",
  },
};
