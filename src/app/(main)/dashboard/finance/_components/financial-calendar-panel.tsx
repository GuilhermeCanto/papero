"use client";

import * as React from "react";

import { startOfMonth } from "date-fns";
import { enGB } from "date-fns/locale";
import { useTranslations } from "next-intl";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FinancialCalendarPanel() {
  const t = useTranslations("Dashboard.calendar");
  const defaultDate = new Date(2026, 5, 15); // June 2026
  const [date, setDate] = React.useState<Date | undefined>(defaultDate);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(startOfMonth(defaultDate));

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader>
        <CardTitle className="font-normal">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          fixedWeeks
          locale={enGB}
          className="w-full p-0"
        />

        <div className="grid grid-cols-2 gap-2 border-t pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{t("legendIncomes")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">{t("legendExpenses")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">{t("legendTransfers")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{t("legendDueDates")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
