"use client";

import * as React from "react";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { type FinanceCategory, type FinanceCategoryType, financeCategoryTypes } from "../_components/categories-store";
import { getCategoryUsage, getFinanceUsageKey, type TransactionUsage } from "../_components/finance-calculations";
import { useFinanceTransactions } from "../_components/finance-transactions-store";
import { useFinanceCategoriesData } from "../_components/use-finance-categories-data";

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(amountCents / 100);
}

function CategoriesKpiStrip({
  expenseCategoriesCount,
  incomeCategoriesCount,
  totalCategories,
  usedCategoriesCount,
}: {
  expenseCategoriesCount: number;
  incomeCategoriesCount: number;
  totalCategories: number;
  usedCategoriesCount: number;
}) {
  const t = useTranslations("Dashboard.financeCategories");

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-1 xl:grid-cols-8">
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
          <CardHeader>
            <CardTitle className="font-normal">{t("kpi.totalTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-3xl leading-none tracking-tight">{totalCategories}</div>
            <p className="text-muted-foreground text-xs">{t("kpi.totalDescription")}</p>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
          <CardHeader>
            <CardTitle className="font-normal">{t("kpi.incomesTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">{incomeCategoriesCount}</div>
              <p className="text-muted-foreground text-xs">{t("kpi.incomesDescription")}</p>
            </div>
            <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
              {t("kpi.incomeBadge")}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-2 xl:border-r xl:border-b-0">
          <CardHeader>
            <CardTitle className="font-normal">{t("kpi.expensesTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">{expenseCategoriesCount}</div>
              <p className="text-muted-foreground text-xs">{t("kpi.expensesDescription")}</p>
            </div>
            <Badge className="bg-destructive/10 text-destructive" variant="destructive">
              {t("kpi.expenseBadge")}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-normal">{t("kpi.usageTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-3xl leading-none tracking-tight">{usedCategoriesCount}</div>
            <p className="text-muted-foreground text-xs">{t("kpi.usageDescription")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CategoryGroupCard({
  addCategory,
  categories,
  categoryUsage,
  type,
}: {
  addCategory: (type: FinanceCategoryType, rawName: string) => Promise<FinanceCategory | null>;
  categories: FinanceCategory[];
  categoryUsage: Record<string, TransactionUsage>;
  type: FinanceCategoryType;
}) {
  const t = useTranslations("Dashboard.financeCategories");
  const [name, setName] = React.useState("");
  const typeCategories = categories.filter((category) => category.type === type);
  const typeKey = `types.${type}`;

  const createCategory = async () => {
    try {
      const category = await addCategory(type, name);
      if (!category) return;
      setName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.create"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{t(`${typeKey}.label`)}</CardTitle>
        <CardDescription>{t(`${typeKey}.description`)}</CardDescription>
        <CardAction>
          <Badge variant="outline">
            {typeCategories.length} {t(typeCategories.length === 1 ? "count.one" : "count.other")}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            aria-label={t("newCategoryAria", { type: t(`${typeKey}.label`) })}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void createCategory();
              }
            }}
            placeholder={t("newCategoryPlaceholder")}
            value={name}
          />
          <Button
            aria-label={t("createCategory")}
            disabled={!name.trim()}
            onClick={() => void createCategory()}
            size="icon"
          >
            <Plus />
          </Button>
        </div>

        <Separator />

        <div className="grid gap-2.5">
          {typeCategories.map((category) => (
            <div
              className={cn(
                "flex min-h-10 items-center justify-between rounded-md border bg-background px-3 text-sm",
                "dark:bg-input/20",
              )}
              key={category.id}
            >
              <span className="truncate font-medium">{category.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                {categoryUsage[getFinanceUsageKey(category.name)] ? (
                  <>
                    <span className="text-muted-foreground text-xs">
                      {t("usage.count", { count: categoryUsage[getFinanceUsageKey(category.name)].count })}
                    </span>
                    <Badge className="text-muted-foreground" variant="outline">
                      <PrivacyValue>
                        {formatMoney(categoryUsage[getFinanceUsageKey(category.name)].totalAmountCents)}
                      </PrivacyValue>
                    </Badge>
                  </>
                ) : (
                  <Badge className="text-muted-foreground" variant="outline">
                    {t(`${typeKey}.label`)}
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {typeCategories.length === 0 ? (
            <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
              {t("empty")}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CategoriesPage() {
  const t = useTranslations("Dashboard.financeCategories");
  const { addCategory, categories, error, isDatabaseMode, isLoading, refresh } = useFinanceCategoriesData();
  const { transactions } = useFinanceTransactions([]);
  const totalCategories = categories.length;
  const categoryUsage = React.useMemo(
    () => (isDatabaseMode ? {} : getCategoryUsage(transactions)),
    [isDatabaseMode, transactions],
  );
  const usedCategoriesCount = React.useMemo(
    () => categories.filter((category) => categoryUsage[getFinanceUsageKey(category.name)]).length,
    [categories, categoryUsage],
  );
  const incomeCategoriesCount = categories.filter((category) => category.type === "income").length;
  const expenseCategoriesCount = totalCategories - incomeCategoriesCount;

  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-12 lg:pt-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-foreground leading-none tracking-tight">{t("title")}</h1>
        <p className="text-lg text-muted-foreground leading-none">{t("subtitle")}</p>
      </div>

      {isDatabaseMode && error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => void refresh()} size="sm" variant="outline">
            {t("actions.retry")}
          </Button>
        </div>
      ) : null}

      <CategoriesKpiStrip
        expenseCategoriesCount={expenseCategoriesCount}
        incomeCategoriesCount={incomeCategoriesCount}
        totalCategories={totalCategories}
        usedCategoriesCount={usedCategoriesCount}
      />

      {isDatabaseMode && isLoading ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground text-sm">
          {t("loading")}
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {financeCategoryTypes.map((type) => (
            <CategoryGroupCard
              addCategory={addCategory}
              categories={categories}
              categoryUsage={categoryUsage}
              key={type.id}
              type={type.id}
            />
          ))}
        </section>
      )}
    </div>
  );
}
