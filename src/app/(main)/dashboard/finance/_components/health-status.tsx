"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const gaugeSegmentCount = 42;
const gaugeSegments = Array.from({ length: gaugeSegmentCount }, (_, index) => {
  const progress = index / (gaugeSegmentCount - 1);
  const status = progress < 0.22 ? "critical" : progress < 0.45 ? "attention" : progress < 0.72 ? "stable" : "healthy";

  return {
    fill: `var(--color-${status})`,
    id: `segment-${index + 1}`,
    status,
    value: 1,
  };
});

const chartConfig = {
  critical: {
    label: "Critical",
    color: "var(--destructive)",
  },
  attention: {
    label: "Needs attention",
    color: "var(--primary)",
  },
  stable: {
    label: "Stable",
    color: "var(--chart-3)",
  },
  healthy: {
    label: "Healthy",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function HealthStatus({ hasData = false, score = 0 }: { hasData?: boolean; score?: number }) {
  const t = useTranslations("Dashboard.health");
  const visibleScore = Math.max(0, Math.min(100, Math.round(score)));
  const statusLabel = hasData ? t("status", { score: visibleScore }) : t("emptyStatus");
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">{t("title")}</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {statusLabel}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto mt-6 h-30 w-full">
          <PieChart>
            <Pie
              cx="50%"
              cy="100%"
              cornerRadius={8}
              data={gaugeSegments}
              dataKey="value"
              endAngle={0}
              innerRadius={70}
              outerRadius={105}
              paddingAngle={1.5}
              startAngle={180}
              stroke="var(--card)"
              strokeWidth={1}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                        <tspan
                          className="fill-foreground font-semibold text-2xl tabular-nums"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                        >
                          {hasData ? `${visibleScore}%` : "0%"}
                        </tspan>
                        <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy || 0) + 34}>
                          {hasData ? t("chartLabel") : t("emptyChartLabel")}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
