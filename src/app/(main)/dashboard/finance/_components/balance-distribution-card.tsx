"use client";

import * as React from "react";

import { Label, Pie, PieChart } from "recharts";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PRIVATE_VALUE_MASK, useDashboardPrivacyStore } from "@/stores/dashboard-privacy-store";

import type { AccountBalanceSummary } from "./finance-calculations";

const chartConfig = {
  amount: {
    label: "Saldo",
  },
} satisfies ChartConfig;

const currencies = {
  BRL: {
    label: "Saldo em real",
  },
  EUR: {
    label: "Saldo em euro",
  },
  USD: {
    label: "Saldo em dólar",
  },
} as const;

type Currency = keyof typeof currencies;

const chartColors = ["var(--chart-2)", "var(--chart-4)", "var(--chart-1)", "var(--chart-3)", "var(--chart-5)"];

export function BalanceDistributionCard({ accounts }: { accounts: AccountBalanceSummary[] }) {
  const [currency, setCurrency] = React.useState<Currency>("BRL");
  const numbersHidden = useDashboardPrivacyStore((state) => state.numbersHidden);
  const chartData = React.useMemo(
    () =>
      accounts.map((item, index) => ({
        account: item.account.name,
        amount: Math.max(0, item.currentBalanceCents / 100),
        fill: chartColors[index % chartColors.length],
        id: item.account.id,
        percentage: item.share,
      })),
    [accounts],
  );
  const totalBalance = React.useMemo(
    () => accounts.reduce((total, item) => total + item.currentBalanceCents, 0) / 100,
    [accounts],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Distribuição do saldo</CardTitle>
        <CardAction>
          <Select onValueChange={(value) => setCurrency(value as Currency)} value={currency}>
            <SelectTrigger className="w-36" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(currencies).map(([value, item]) => (
                  <SelectItem key={value} value={value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-50">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel className="w-52" nameKey="account" />}
            />
            <Pie
              cornerRadius={6}
              data={chartData}
              dataKey="amount"
              innerRadius={65}
              nameKey="account"
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) {
                    return null;
                  }

                  return (
                    <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                      <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy ?? 0) - 8}>
                        Total
                      </tspan>
                      <tspan
                        className="fill-foreground font-medium text-lg tabular-nums"
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                      >
                        {numbersHidden
                          ? PRIVATE_VALUE_MASK
                          : formatCurrency(totalBalance, { currency, noDecimals: true })}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex min-w-0 flex-col gap-3">
          {chartData.map((item) => (
            <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={item.id}>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1">
                  <span aria-hidden="true" className="h-2 w-1 rounded-full" style={{ backgroundColor: item.fill }} />
                  <p className="truncate text-muted-foreground text-xs">{item.account}</p>
                </div>
                <p className="font-medium tabular-nums">
                  <PrivacyValue>{formatCurrency(item.amount, { currency, noDecimals: true })}</PrivacyValue>
                </p>
              </div>
              <div className="font-medium tabular-nums">
                <PrivacyValue>{item.percentage}%</PrivacyValue>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
