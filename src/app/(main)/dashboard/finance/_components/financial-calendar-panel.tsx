"use client";

import * as React from "react";

import { addMonths, getDaysInMonth, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  isExpenseTransaction,
  isIncomeTransaction,
  isTransferTransaction,
  parseFinanceDate,
} from "./finance-calculations";
import type { FinanceTransaction } from "./finance-transactions-store";

type CalendarEventKind = "due" | "expense" | "income" | "transfer";
type CalendarEventMap = Record<string, Set<CalendarEventKind>>;

const CalendarEventsContext = React.createContext<CalendarEventMap>({});
const eventTone: Record<CalendarEventKind, string> = {
  due: "bg-amber-500",
  expense: "bg-red-500",
  income: "bg-green-500",
  transfer: "bg-blue-500",
};

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getCalendarEvents(transactions: FinanceTransaction[]) {
  return transactions.reduce<CalendarEventMap>((events, transaction) => {
    const date = parseFinanceDate(transaction.date);
    if (!date) return events;

    const key = getDayKey(date);
    const dayEvents = events[key] ?? new Set<CalendarEventKind>();

    if (isIncomeTransaction(transaction)) dayEvents.add("income");
    if (isTransferTransaction(transaction)) dayEvents.add("transfer");
    if (isExpenseTransaction(transaction)) dayEvents.add("expense");
    if (!transaction.paid) dayEvents.add("due");

    events[key] = dayEvents;
    return events;
  }, {});
}

function getMondayFirstWeekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function getMonthDays(month: Date) {
  const monthStart = startOfMonth(month);
  const leadingPlaceholders = getMondayFirstWeekdayIndex(monthStart);
  const daysInMonth = getDaysInMonth(monthStart);
  const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;

  return {
    leadingPlaceholders: Array.from({ length: leadingPlaceholders }, (_, index) => `${monthKey}-empty-${index}`),
    days: Array.from(
      { length: daysInMonth },
      (_, index) => new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1),
    ),
  };
}

export function FinancialCalendarPanel({ transactions = [] }: { transactions?: FinanceTransaction[] }) {
  const t = useTranslations("Dashboard.calendar");
  const locale = useLocale();
  const defaultDate = new Date(2026, 5, 15); // June 2026
  const [date, setDate] = React.useState<Date | undefined>(defaultDate);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(startOfMonth(defaultDate));
  const eventMap = React.useMemo(() => getCalendarEvents(transactions), [transactions]);
  const monthDays = React.useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const monthLabel = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(currentMonth),
    [currentMonth, locale],
  );
  const weekdayLabels = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const monday = new Date(2026, 0, 5 + index);
        return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(monday);
      }),
    [locale],
  );
  const today = new Date();

  return (
    <Card className="relative flex h-auto min-h-fit w-full flex-col overflow-visible">
      <CardHeader className="gap-3">
        <CardTitle className="font-normal">{t("title")}</CardTitle>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{t("legendIncomes")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">{t("legendTransfers")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">{t("legendExpenses")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{t("legendDueDates")}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-visible pb-5">
        <div className="flex w-full flex-col gap-4 overflow-visible">
          <div className="flex items-center justify-between gap-3">
            <Button
              aria-label="Previous month"
              onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronLeft />
            </Button>
            <div className="font-medium text-sm capitalize">{monthLabel}</div>
            <Button
              aria-label="Next month"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="grid w-full grid-cols-7 gap-1">
            {weekdayLabels.map((weekday) => (
              <div className="py-1 text-center text-muted-foreground text-xs" key={weekday}>
                {weekday}
              </div>
            ))}
            {monthDays.leadingPlaceholders.map((placeholder) => (
              <div aria-hidden="true" className="min-h-11 rounded-md" key={placeholder} />
            ))}
            <CalendarEventsContext.Provider value={eventMap}>
              {monthDays.days.map((day) => {
                const dayEvents = Array.from(eventMap[getDayKey(day)] ?? []);
                const selected = date ? day.toDateString() === date.toDateString() : false;
                const currentDay = day.toDateString() === today.toDateString();

                return (
                  <button
                    className={cn(
                      "flex min-h-11 w-full flex-col items-center justify-center rounded-md border border-transparent text-sm transition-colors hover:bg-muted/70",
                      selected && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                      currentDay && !selected && "bg-muted text-foreground",
                    )}
                    key={day.toISOString()}
                    onClick={() => setDate(day)}
                    type="button"
                  >
                    <span>{day.getDate()}</span>
                    {dayEvents.length > 0 ? (
                      <span className="mt-1 flex max-w-full items-center justify-center gap-0.5">
                        {dayEvents.slice(0, 4).map((event) => (
                          <span className={`size-1 rounded-full ${eventTone[event]}`} key={event} />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </CalendarEventsContext.Provider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
