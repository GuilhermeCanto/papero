import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SidebarSupportCard() {
  return (
    <Card size="sm" className="shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">Need a cleaner workflow?</CardTitle>
        <CardDescription>
          Use Papero to keep income, expenses and cash flow organized while the product evolves.{" "}
          <Link href="/dashboard/finance" className="text-foreground">
            Explore Papero
          </Link>
          .
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
