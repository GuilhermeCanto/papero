import { useRouter } from "next/navigation";

import { ChevronRight, HandCoins, Receipt, ScrollText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const contacts = [
  { id: 1, initials: "AR" },
  { id: 2, initials: "SC" },
  { id: 3, initials: "MJ" },
  { id: 4, initials: "ED" },
];

export function ShortcutsCard({ className, limit }: { className?: string; limit?: number }) {
  const t = useTranslations("Dashboard.shortcuts");
  const router = useRouter();

  const shortcuts = [
    {
      id: 1,
      label: t("newExpense"),
      icon: Receipt,
      href: "/dashboard/finance/expenses",
    },
    {
      id: 2,
      label: t("newIncome"),
      icon: HandCoins,
      href: "/dashboard/finance/incomes",
    },
    {
      id: 3,
      label: t("importStatement"),
      icon: ScrollText,
      href: "/dashboard/finance/transactions",
    },
  ];

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="font-normal">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {shortcuts.slice(0, limit).map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <div key={shortcut.id} className="flex flex-col items-center gap-2.5">
                <Button
                  variant="outline"
                  className="size-12 rounded-full"
                  onClick={() => router.push(shortcut.href)}
                  type="button"
                >
                  <Icon className="size-5" />
                </Button>
                <span className="text-center text-muted-foreground text-xs">{shortcut.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActions() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Transferência rápida</CardTitle>
          <CardAction>
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {contacts.map((contact) => (
                  <Avatar key={contact.id} className="size-7 border-2 border-background">
                    <AvatarFallback className="text-[10px]">{contact.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <ChevronRight className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Field orientation="horizontal">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="0.00" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>BRL</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <Button>Enviar</Button>
          </Field>
        </CardContent>
      </Card>

      <ShortcutsCard />
    </div>
  );
}
