import { useTranslations } from "next-intl";

import { PrivacyValue } from "@/app/(main)/dashboard/_components/privacy-value";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type BreakdownItem = {
  amountLabel: string;
  label: string;
  share: number;
};

export function IncomeBreakdown({ items }: { items?: BreakdownItem[] }) {
  const t = useTranslations("Dashboard.financeBreakdown.income");
  const visibleItems = items ?? [
    { amountLabel: "$4,560.00", label: t("primary"), share: 68 },
    { amountLabel: "$1,412.00", label: t("secondary"), share: 21 },
    { amountLabel: "$765.00", label: t("tertiary"), share: 11 },
  ];
  const tones = ["bg-chart-3", "bg-chart-3/75", "bg-chart-3/50"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{t("title")}</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {visibleItems.map((item, index) => (
          <section className="isolate flex gap-[0.5px]" key={item.label}>
            <Separator
              orientation="vertical"
              className="mb-1 h-auto self-auto border-muted-foreground/50 border-l border-dashed bg-transparent"
            />
            <div className="flex min-h-24 flex-1 flex-col justify-between">
              <div className="flex min-w-0 flex-col gap-1 px-1">
                <p className="wrap-break-word text-muted-foreground text-xs leading-none">
                  {item.label} · {item.share}%
                </p>
                <div className="text-lg leading-none tracking-tight">
                  <PrivacyValue>{item.amountLabel}</PrivacyValue>
                </div>
              </div>
              <div className={`-ml-0.5 h-5 rounded-sm ${tones[index] ?? "bg-chart-3/50"}`} />
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
