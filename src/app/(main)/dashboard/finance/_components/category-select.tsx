"use client";

import * as React from "react";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  type FinanceCategory,
  type FinanceCategoryType,
  financeCategoryTypes,
  useFinanceCategories,
} from "./categories-store";

type CategorySelectProps = {
  currentType: FinanceCategoryType | null;
  onChange: (category: FinanceCategory) => void;
  value: string;
};

export function CategorySelect({ currentType, onChange, value }: CategorySelectProps) {
  const t = useTranslations("Dashboard.financeTransactions.categorySelect");
  const tCategories = useTranslations("Dashboard.financeCategories");
  const [open, setOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const { addCategory, categories } = useFinanceCategories();

  const createCategory = () => {
    if (!currentType) return;

    const category = addCategory(currentType, newCategoryName);
    if (!category) return;

    onChange(category);
    setNewCategoryName("");
    setOpen(false);
  };

  const hasNewCategoryName = newCategoryName.trim().length > 0;
  const currentTypeKey = currentType ? `types.${currentType}` : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-8 w-full min-w-0 justify-between rounded-md border-input bg-background px-2 text-left font-normal shadow-xs dark:bg-input/30",
            !value && "text-muted-foreground",
          )}
          size="sm"
          variant="outline"
        >
          <span className="truncate">{value || t("select")}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-3 p-2.5">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">{t("title")}</p>
          <p className="text-muted-foreground text-xs">
            {t("description", {
              type: currentTypeKey ? tCategories(`${currentTypeKey}.label`).toLowerCase() : t("select"),
            })}
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            aria-label={t("newCategory")}
            disabled={!currentType}
            onChange={(event) => setNewCategoryName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                createCategory();
              }
            }}
            placeholder={t("newCategory")}
            value={newCategoryName}
          />
          <Button
            aria-label={t("newCategory")}
            disabled={!currentType || !hasNewCategoryName}
            onClick={createCategory}
            size="icon"
            type="button"
          >
            <Plus />
          </Button>
        </div>

        <Separator />

        <div className="max-h-72 overflow-y-auto pr-1">
          {financeCategoryTypes.map((type) => {
            const typeCategories = categories.filter((category) => category.type === type.id);
            const typeKey = `types.${type.id}`;

            return (
              <div className="flex flex-col gap-1 py-1" key={type.id}>
                <div className="px-1.5 font-medium text-muted-foreground text-xs">
                  {tCategories(`${typeKey}.label`)}
                </div>
                {typeCategories.map((category) => (
                  <button
                    className="flex h-8 w-full items-center justify-between rounded-md px-1.5 text-left text-sm transition-colors hover:bg-muted"
                    key={category.id}
                    onClick={() => {
                      onChange(category);
                      setOpen(false);
                    }}
                    type="button"
                  >
                    <span className="truncate">{category.name}</span>
                    {value === category.name ? <Check className="size-3.5 text-primary" /> : null}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
