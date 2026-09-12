import { z } from "zod";

const MAX_AMOUNT_CENTS = 2_000_000_000;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseMoneyToCents(value: string) {
  const compact = value
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s/g, "");
  if (!/^-?\d[\d.,]*$/.test(compact)) return null;

  const commaIndex = compact.lastIndexOf(",");
  const dotIndex = compact.lastIndexOf(".");
  const decimalIndex = Math.max(commaIndex, dotIndex);
  const decimalDigits = decimalIndex >= 0 ? compact.length - decimalIndex - 1 : 0;
  const hasBothSeparators = commaIndex >= 0 && dotIndex >= 0;
  const separator = decimalIndex >= 0 ? compact[decimalIndex] : "";
  const separatorCount = separator ? compact.split(separator).length - 1 : 0;
  const usesDecimal =
    decimalIndex >= 0 && decimalDigits >= 1 && decimalDigits <= 2 && (hasBothSeparators || separatorCount === 1);

  const integerPart = usesDecimal ? compact.slice(0, decimalIndex) : compact;
  const fractionPart = usesDecimal ? compact.slice(decimalIndex + 1) : "";
  const normalizedInteger = integerPart.replace(/[.,]/g, "");
  const normalized = `${normalizedInteger}${fractionPart.padEnd(2, "0")}`;
  const cents = Number(normalized);

  return Number.isSafeInteger(cents) ? cents : null;
}

export function parseDateOnly(value: string) {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

const moneyString = z
  .string()
  .trim()
  .min(1, "amountRequired")
  .refine((value) => parseMoneyToCents(value) !== null, {
    message: "amountInvalid",
  });

export const onboardingFormSchema = z
  .object({
    accountName: z.string().trim().min(2, "accountNameRequired").max(120, "accountNameTooLong"),
    addTransaction: z.boolean(),
    institution: z.string().trim().max(160, "institutionTooLong"),
    openingBalance: moneyString.refine((value) => Math.abs(parseMoneyToCents(value) ?? 0) <= MAX_AMOUNT_CENTS, {
      message: "amountTooLarge",
    }),
    transactionAmount: z.string(),
    transactionDate: z.string(),
    transactionDescription: z.string(),
    transactionKind: z.enum(["income", "expense"]),
    workspaceName: z.string().trim().min(2, "workspaceNameRequired").max(120, "workspaceNameTooLong"),
  })
  .superRefine((data, context) => {
    if (!data.addTransaction) return;

    if (!data.transactionDescription.trim()) {
      context.addIssue({ code: "custom", message: "transactionDescriptionRequired", path: ["transactionDescription"] });
    } else if (data.transactionDescription.trim().length > 240) {
      context.addIssue({ code: "custom", message: "transactionDescriptionTooLong", path: ["transactionDescription"] });
    }

    const amountCents = parseMoneyToCents(data.transactionAmount);
    if (amountCents === null) {
      context.addIssue({ code: "custom", message: "amountInvalid", path: ["transactionAmount"] });
    } else if (amountCents <= 0) {
      context.addIssue({ code: "custom", message: "transactionAmountPositive", path: ["transactionAmount"] });
    } else if (amountCents > MAX_AMOUNT_CENTS) {
      context.addIssue({ code: "custom", message: "amountTooLarge", path: ["transactionAmount"] });
    }

    if (!parseDateOnly(data.transactionDate)) {
      context.addIssue({ code: "custom", message: "transactionDateRequired", path: ["transactionDate"] });
    }
  });

export const onboardingRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("skip") }).strict(),
  onboardingFormSchema.safeExtend({ action: z.literal("complete") }).strict(),
]);

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;
export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;
