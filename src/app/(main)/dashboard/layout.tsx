import type { ReactNode } from "react";

import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

import { Bell } from "lucide-react";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { users } from "@/data/users";
import { AVATAR_LOCATION_VALUES, SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "@/lib/preferences/layout";
import { cn } from "@/lib/utils";
import { getPreference } from "@/server/server-actions";

import paperoLogo from "../../../../media/logo-light-liquid-glass.svg";
import { PrivacyToggle } from "./_components/privacy-toggle";
import { AccountSwitcher } from "./_components/sidebar/account-switcher";
import { LayoutControls } from "./_components/sidebar/layout-controls";
import { SearchDialog } from "./_components/sidebar/search-dialog";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible, avatarLocation] = await Promise.all([
    getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getPreference("avatar_location", AVATAR_LOCATION_VALUES, "navbar"),
  ]);

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant={variant} collapsible={collapsible} avatarLocation={avatarLocation} />
      <Link
        prefetch={false}
        href="/dashboard/finance"
        className={cn(
          "absolute top-5 left-5 z-40 flex items-center gap-2.5 rounded-2xl px-2 py-1.5 text-foreground transition-[color,left] hover:text-primary",
          "md:peer-data-[variant=sidebar]:left-[calc(var(--sidebar-width)+1.25rem)]",
          "md:peer-data-[variant=sidebar]:peer-data-[state=collapsed]:left-[calc(var(--sidebar-width-icon)+1.25rem)]",
          "md:peer-data-[variant=inset]:left-[calc(var(--sidebar-width)+1.25rem)]",
          "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:left-[calc(var(--sidebar-width-icon)+(--spacing(4))+1.25rem)]",
          "md:peer-data-[variant=floating]:peer-data-[state=expanded]:left-[calc(var(--sidebar-width)+1.25rem)]",
        )}
        aria-label="Papero overview"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Image alt="" className="size-5 object-contain" priority src={paperoLogo} />
        </span>
        <span className="font-semibold text-lg tracking-normal">Papero</span>
      </Link>
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&>*]:mx-auto",
          "[html[data-content-layout=centered]_&>*]:w-full",
          "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
          "glass-shell",
          "peer-data-[variant=inset]:border",
          "[--dashboard-header-height:--spacing(12)]",
          "min-w-0 overflow-x-clip",
        )}
      >
        <header
          className={cn(
            "!w-fit !max-w-[calc(100%-1.5rem)] md:!max-w-[calc(100%-2rem)] mt-3 mr-3 ml-auto flex h-12 shrink-0 items-center gap-2 rounded-2xl border transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:mr-4",
            // Floating keeps the same header controls, but frames them as a sticky glass island.
            "[html[data-navbar-style=floating]_&]:sticky [html[data-navbar-style=floating]_&]:top-3 [html[data-navbar-style=floating]_&]:z-50 [html[data-navbar-style=floating]_&]:mt-3 [html[data-navbar-style=floating]_&]:overflow-hidden [html[data-navbar-style=floating]_&]:border-border/70 [html[data-navbar-style=floating]_&]:shadow-lg [html[data-navbar-style=floating]_&]:backdrop-blur-md",
            "[html[data-navbar-style=inset]_&]:border-transparent [html[data-navbar-style=inset]_&]:shadow-none",
            "glass-nav",
          )}
        >
          <div className="flex items-center gap-2 px-3 lg:px-4">
            <div className="mr-1 sm:mr-2">
              <SearchDialog />
            </div>
            <LayoutControls />
            <PrivacyToggle />
            <Button size="icon" aria-label="Notifications">
              <Bell />
            </Button>
            <AccountSwitcher users={users} avatarLocation={avatarLocation} />
          </div>
        </header>
        {/* Pages can set data-content-padding="false" to render full-bleed app layouts. */}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
