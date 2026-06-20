"use client";

import { Ellipsis } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, type BarShapeProps, XAxis, YAxis } from "recharts";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboardPrivacyStore } from "@/stores/dashboard-privacy-store";

const realtimeData = [
  { minute: 1, visitors: 0 },
  { minute: 2, visitors: 6 },
  { minute: 3, visitors: 12 },
  { minute: 4, visitors: 20 },
  { minute: 5, visitors: 12 },
  { minute: 6, visitors: 0 },
  { minute: 7, visitors: 6 },
  { minute: 8, visitors: 6 },
  { minute: 9, visitors: 0 },
  { minute: 10, visitors: 4 },
  { minute: 11, visitors: 0 },
  { minute: 12, visitors: 20 },
  { minute: 13, visitors: 15 },
  { minute: 14, visitors: 4 },
  { minute: 15, visitors: 6 },
  { minute: 16, visitors: 0 },
  { minute: 17, visitors: 4 },
  { minute: 18, visitors: 12 },
  { minute: 19, visitors: 20 },
  { minute: 20, visitors: 0 },
  { minute: 21, visitors: 4 },
  { minute: 22, visitors: 20 },
  { minute: 23, visitors: 12 },
  { minute: 24, visitors: 0 },
  { minute: 25, visitors: 6 },
  { minute: 26, visitors: 6 },
  { minute: 27, visitors: 0 },
  { minute: 28, visitors: 20 },
  { minute: 29, visitors: 0 },
  { minute: 30, visitors: 4 },
];

const chartConfig = {
  visitors: {
    color: "var(--chart-3)",
    label: "Visitors",
  },
} satisfies ChartConfig;

export type MonthlyCashFlowBar = {
  minute: number;
  visitors: number;
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
  const { height, payload, width, x, y } = props;
  const barPayload = payload as (typeof realtimeData)[number] | undefined;
  const barHeightValue = Number(height);
  const barWidthValue = Number(width);
  const xValue = Number(x);
  const yValue = Number(y);
  const visitors = barPayload?.visitors ?? 0;
  const fill = "var(--color-visitors)";
  const fillOpacity = visitors >= 18 ? 0.95 : 0.4;
  const baselineFill = visitors === 0 ? "var(--destructive)" : fill;
  const baselineOpacity = visitors === 0 ? 1 : fillOpacity;
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
      {visitors > 0 && barHeight > 0 ? (
        <rect
          x={xValue}
          y={yValue}
          width={barWidthValue}
          height={barHeight}
          rx={2}
          fill={fill}
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
          <div className="flex items-baseline gap-1">
            <span className="text-2xl tabular-nums leading-none tracking-tight">
              <PrivacyValue>{result ?? t("currentResult").split(": ")[1]}</PrivacyValue>
            </span>
            <span className="max-w-28 text-muted-foreground text-sm leading-tight">
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
              <XAxis dataKey="minute" hide />
              <YAxis hide domain={[0, 22]} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="visitors" fill="var(--color-visitors)" shape={RealtimeBarShape} />
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
