"use client";

import * as React from "react";

import { useTranslations } from "next-intl";

import { isDatabaseMode } from "@/config/papero-mode";

import { localDashboardUser, useDatabaseDashboardUser } from "../../_components/sidebar/dashboard-auth-user";

type GreetingPeriod = "afternoon" | "evening" | "morning" | "night";

function getGreetingPeriod(date: Date): GreetingPeriod {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function getFirstName(name?: string | null, email?: string | null) {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName.split(/\s+/)[0];

  const emailPrefix = email?.split("@")[0]?.trim();
  return emailPrefix || undefined;
}

function getGreetingKey(period: GreetingPeriod | null, hasName: boolean) {
  const greetingPeriod = period ?? "loading";
  return `greetings.${hasName ? "withName" : "withoutName"}.${greetingPeriod}`;
}

export function FinanceGreeting() {
  const t = useTranslations("Dashboard");
  const databaseMode = isDatabaseMode();
  const [period, setPeriod] = React.useState<GreetingPeriod | null>(null);

  React.useEffect(() => {
    setPeriod(getGreetingPeriod(new Date()));
  }, []);

  if (databaseMode) return <DatabaseFinanceGreeting period={period} />;

  return <>{t(getGreetingKey(period, false))}</>;
}

function DatabaseFinanceGreeting({ period }: { period: GreetingPeriod | null }) {
  const t = useTranslations("Dashboard");
  const { user } = useDatabaseDashboardUser(localDashboardUser);
  const firstName = getFirstName(user.name, user.email);

  if (!firstName) return <>{t(getGreetingKey(period, false))}</>;

  return <>{t(getGreetingKey(period, true), { name: firstName })}</>;
}
