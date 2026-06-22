"use client";

import * as React from "react";

import { startOfMonth } from "date-fns";
import { enGB } from "date-fns/locale";
import { useTranslations } from "next-intl";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function EventCalendarDayButton(props: React.ComponentProps<typeof CalendarDayButton>) {
  const eventMap = React.useContext(CalendarEventsContext);
  const dayEvents = props.modifiers.outside ? [] : Array.from(eventMap[getDayKey(props.day.date)] ?? []);

  return (
    <CalendarDayButton {...props}>
      {props.children}
      {dayEvents.length > 0 ? (
        <span className="mt-0.5 flex max-w-full items-center justify-center gap-0.5">
          {dayEvents.slice(0, 4).map((event) => (
            <span className={`size-1 rounded-full ${eventTone[event]}`} key={event} />
          ))}
        </span>
      ) : null}
    </CalendarDayButton>
  );
}

export function FinancialCalendarPanel({ transactions = [] }: { transactions?: FinanceTransaction[] }) {
  const t = useTranslations("Dashboard.calendar");
  const defaultDate = new Date(2026, 5, 15); // June 2026
  const [date, setDate] = React.useState<Date | undefined>(defaultDate);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(startOfMonth(defaultDate));
  const eventMap = React.useMemo(() => getCalendarEvents(transactions), [transactions]);

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
      <CardContent className="overflow-visible">
        <CalendarEventsContext.Provider value={eventMap}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            showOutsideDays={false}
            locale={enGB}
            className="w-full overflow-visible p-0 [--cell-size:2.2rem] sm:[--cell-size:2.45rem] [&_.rdp-months]:w-full [&_.rdp-table]:w-full"
            components={{ DayButton: EventCalendarDayButton }}
          />
        </CalendarEventsContext.Provider>
      </CardContent>
    </Card>
  );
}
