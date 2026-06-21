"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export type DashboardUser = {
  avatar: string;
  email: string;
  id: string;
  name: string;
  role: string;
};

export const localDashboardUser: DashboardUser = {
  avatar: "",
  email: "Local browser data",
  id: "local-user",
  name: "Papero local",
  role: "local mode",
};

export function useDatabaseDashboardUser(fallbackUser: DashboardUser = localDashboardUser) {
  const router = useRouter();
  const session = authClient.useSession();
  const sessionUser = session.data?.user;
  const user: DashboardUser = sessionUser
    ? {
        avatar: sessionUser.image ?? "",
        email: sessionUser.email,
        id: sessionUser.id,
        name: sessionUser.name || sessionUser.email,
        role: "owner",
      }
    : fallbackUser;

  const signOut = async () => {
    await authClient.signOut();
    router.push("/auth/v2/login");
    router.refresh();
  };

  return {
    isAuthenticated: Boolean(sessionUser),
    isPending: session.isPending,
    signOut,
    user,
  };
}
