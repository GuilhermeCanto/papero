import { redirect } from "next/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set up Papero",
};

export default function OnboardingPage() {
  redirect("/dashboard/finance");
}
