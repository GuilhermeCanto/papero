"use client";

import { BadgeCheck, Bell, Check, CreditCard, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isDatabaseMode } from "@/config/papero-mode";
import type { AvatarLocation } from "@/lib/preferences/layout";
import { cn, getInitials } from "@/lib/utils";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { type DashboardUser, localDashboardUser, useDatabaseDashboardUser } from "./dashboard-auth-user";

type MenuUser = DashboardUser;

export function AccountSwitcher({
  users,
  avatarLocation: initialAvatarLocation = "navbar",
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
  readonly avatarLocation?: AvatarLocation;
}) {
  const avatarLocation = usePreferencesStore((s) => (s.isSynced ? s.avatarLocation : initialAvatarLocation));

  if (avatarLocation !== "navbar") {
    return null;
  }

  if (isDatabaseMode()) {
    return <DatabaseAccountSwitcher fallbackUser={users[0] ?? localDashboardUser} />;
  }

  return <AccountSwitcherMenu isAuthenticated={false} user={localDashboardUser} users={[localDashboardUser]} />;
}

function DatabaseAccountSwitcher({ fallbackUser }: { fallbackUser: MenuUser }) {
  const { isAuthenticated, signOut, user } = useDatabaseDashboardUser(fallbackUser);

  return <AccountSwitcherMenu isAuthenticated={isAuthenticated} onSignOut={signOut} user={user} users={[user]} />;
}

function AccountSwitcherMenu({
  isAuthenticated,
  onSignOut,
  user,
  users,
}: {
  isAuthenticated: boolean;
  onSignOut?: () => void;
  user: MenuUser;
  users: MenuUser[];
}) {
  const accountMenu = useTranslations("AccountMenu");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 rounded-lg">
          <AvatarImage src={user.avatar || undefined} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        {users.map((menuUser) => (
          <DropdownMenuItem
            key={menuUser.email}
            className={cn("p-0", menuUser.id === user.id && "bg-accent/50")}
            aria-current={menuUser.id === user.id ? "true" : undefined}
          >
            <div className="flex w-full items-center gap-2 px-1 py-1.5">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage src={menuUser.avatar || undefined} alt={menuUser.name} />
                <AvatarFallback>{getInitials(menuUser.name)}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{menuUser.name}</span>
                <span className="truncate text-xs">{menuUser.email}</span>
              </div>
              <span
                className={cn(
                  "mr-1 flex size-5 items-center justify-center rounded-full text-primary opacity-0",
                  menuUser.id === user.id && "opacity-100",
                )}
              >
                <Check aria-hidden="true" />
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            {accountMenu("account")}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            {accountMenu("billing")}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            {accountMenu("notifications")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isAuthenticated && !onSignOut} onClick={onSignOut}>
          <LogOut />
          {accountMenu("logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
