"use client";

import { Ellipsis } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, type BarShapeProps, XAxis, YAxis } from "recharts";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboardPrivacyStore } from "@/stores/dashboard-privacy-store";

const realtimeData = Array.from({ length: 30 }, (_, index) => ({
  day: index + 1,
  inflows: 0,
  outflows: 0,
}));

export type MonthlyCashFlowBar = {
  day: number;
  inflows: number;
  outflows: number;
};

type MonthlyCashFlowProps = {
  chartData?: MonthlyCashFlowBar[];
  finalBalance?: string;
  forecast?: string;
  inflow?: string;
  outflow?: string;
  result?: string;
};

function RealtimeBarShape(props: BarShapeProps) {
  const { fill, height, value, width, x, y } = props;
  const barHeightValue = Number(height);
  const barWidthValue = Number(width);
  const xValue = Number(x);
  const yValue = Number(y);
  const amount = Number(value);
  const barFill = typeof fill === "string" ? fill : "var(--color-inflows)";
  const fillOpacity = amount > 0 ? 0.85 : 0.35;
  const baselineFill = amount > 0 ? barFill : "var(--primary)";
  const baselineOpacity = amount > 0 ? fillOpacity : 0.35;
  const baselineY = yValue + barHeightValue - 2;
  const barGap = 4;
  const barHeight = Math.max(0, barHeightValue - barGap);

  return (
    <g>
      <rect
        x={xValue}
        y={baselineY}
        width={barWidthValue}
        height={2}
        rx={1}
        fill={baselineFill}
        fillOpacity={baselineOpacity}
      />
      {amount > 0 && barHeight > 0 ? (
        <rect
          x={xValue}
          y={yValue}
          width={barWidthValue}
          height={barHeight}
          rx={2}
          fill={barFill}
          fillOpacity={fillOpacity}
        />
      ) : null}
    </g>
  );
}

export function MonthlyCashFlow({ chartData, finalBalance, forecast, inflow, outflow, result }: MonthlyCashFlowProps) {
  const t = useTranslations("Dashboard.cashflow");
  const numbersHidden = useDashboardPrivacyStore((state) => state.numbersHidden);
  const visibleData = chartData ?? realtimeData;
  const chartConfig = {
    inflows: {
      color: "var(--primary)",
      label: t("chartInflows"),
    },
    outflows: {
      color: "color-mix(in oklab, var(--primary) 58%, transparent)",
      label: t("chartOutflows"),
    },
  } satisfies ChartConfig;
  const formatTooltipValue = (value: unknown) => {
    const amountCents = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(amountCents)) return String(value);

    return new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      style: "currency",
    }).format(amountCents / 100);
  };
  const formatTooltipRow = (value: unknown, name: unknown) => {
    const label = name === "outflows" ? t("chartOutflows") : t("chartInflows");

    return (
      <>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium font-mono text-foreground tabular-nums">{formatTooltipValue(value)}</span>
      </>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">{t("title")}</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl tabular-nums leading-none tracking-tight">
              <PrivacyValue>{result ?? t("currentResult").split(": ")[1]}</PrivacyValue>
            </span>
            <span className="whitespace-nowrap text-muted-foreground text-sm leading-none">
              {t("currentResult").split(": ")[0]}
            </span>
          </div>
        </div>
        {numbersHidden ? (
          <div className="grid h-36 w-full place-items-center rounded-lg border border-border/70 border-dashed bg-muted/20">
            <span className="font-medium text-muted-foreground text-sm tracking-[0.35em]">*****</span>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-36 w-full">
            <BarChart data={visibleData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }} barCategoryGap={3}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value, name) => formatTooltipRow(value, name)} hideLabel />}
              />
              <Bar dataKey="inflows" fill="var(--color-inflows)" shape={RealtimeBarShape} />
              <Bar dataKey="outflows" fill="var(--color-outflows)" shape={RealtimeBarShape} />
            </BarChart>
          </ChartContainer>
        )}
        <div className="grid grid-cols-2">
          <div className="flex items-center justify-between gap-3 border-border/50 border-r border-b pt-1 pr-5 pb-4">
            <span className="min-w-0 flex-1 truncate text-sm">{t("inflow").split(": ")[0]}</span>
            <span className="font-medium text-green-600 text-sm tabular-nums dark:text-green-400">
              <PrivacyValue>{inflow ?? t("inflow").split(": ")[1]}</PrivacyValue>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-border/50 border-b pt-1 pb-4 pl-5">
            <span className="min-w-0 flex-1 truncate text-sm">{t("outflow").split(": ")[0]}</span>
            <span className="font-medium text-destructive text-sm tabular-nums">
              <PrivacyValue>{outflow ?? t("outflow").split(": ")[1]}</PrivacyValue>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-border/50 border-r pt-4 pr-5 pb-1">
            <span className="min-w-0 flex-1 truncate text-sm">{t("forecast").split(": ")[0]}</span>
            <span className="text-muted-foreground text-sm tabular-nums">
              <PrivacyValue>{forecast ?? t("forecast").split(": ")[1]}</PrivacyValue>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-4 pb-1 pl-5">
            <span className="min-w-0 flex-1 truncate font-medium text-sm">{t("finalBalance").split(": ")[0]}</span>
            <span className="font-semibold text-sm tabular-nums">
              <PrivacyValue>{finalBalance ?? t("finalBalance").split(": ")[1]}</PrivacyValue>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
