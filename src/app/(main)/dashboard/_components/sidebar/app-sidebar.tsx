"use client";

import { CircleHelp, ClipboardList, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { rootUser } from "@/data/users";
import type { AvatarLocation } from "@/lib/preferences/layout";
import { cn } from "@/lib/utils";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  avatarLocation?: AvatarLocation;
};

export function AppSidebar({ avatarLocation: initialAvatarLocation = "navbar", ...props }: AppSidebarProps) {
  const { sidebarVariant, sidebarCollapsible, avatarLocation, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      avatarLocation: s.avatarLocation,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;
  const resolvedAvatarLocation = isSynced ? avatarLocation : initialAvatarLocation;

  return (
    <Sidebar
      {...props}
      variant={variant}
      collapsible={collapsible}
      className={cn("group-data-[variant=floating]:group-data-[collapsible=icon]:items-center", props.className)}
    >
      <SidebarContent>
        <NavMain items={sidebarItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* SidebarSupportCard is intentionally kept in the codebase for a future support/onboarding surface. */}
        {resolvedAvatarLocation === "sidebar" ? <NavUser user={rootUser} /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
