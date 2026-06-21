import type { CSSProperties, ReactNode } from "react";

import Image from "next/image";

import { Building2, ChartNoAxesColumnIncreasing, ListPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/config/app-config";

import paperoLogo from "../../../../../media/logo-light-liquid-glass.svg";
import { PaperoAuthShader } from "./_components/papero-auth-shader";

const lightFormVars = {
  "--background": "oklch(0.985 0.004 255)",
  "--foreground": "oklch(0.16 0.012 255)",
  "--card": "oklch(0.995 0.002 255 / 86%)",
  "--card-foreground": "oklch(0.16 0.012 255)",
  "--popover": "oklch(0.995 0.002 255 / 96%)",
  "--popover-foreground": "oklch(0.16 0.012 255)",
  "--primary": "oklch(0.705 0.213 47.604)",
  "--primary-foreground": "oklch(0.99 0.003 75)",
  "--secondary": "oklch(0.965 0.006 255 / 74%)",
  "--secondary-foreground": "oklch(0.24 0.018 255)",
  "--muted": "oklch(0.955 0.006 255 / 78%)",
  "--muted-foreground": "oklch(0.46 0.018 255)",
  "--accent": "oklch(0.98 0.016 73 / 86%)",
  "--accent-foreground": "oklch(0.42 0.12 45)",
  "--destructive": "oklch(0.577 0.245 27.325)",
  "--border": "oklch(0.78 0.012 255 / 42%)",
  "--input": "oklch(0.93 0.006 255 / 74%)",
  "--ring": "oklch(0.705 0.213 47.604)",
} as CSSProperties;

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="dark min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_18%,hsl(24_95%_53%/0.10),transparent_30%),radial-gradient(circle_at_72%_76%,hsl(38_92%_50%/0.07),transparent_28%),linear-gradient(135deg,hsl(0_0%_100%),hsl(24_100%_98%)_48%,hsl(220_33%_98%))]" />
      <div className="relative grid min-h-dvh p-3 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.74fr)] lg:p-4">
        <div
          className="relative flex min-h-dvh items-center justify-center bg-background/92 p-4 text-foreground lg:order-2 lg:min-h-0 lg:rounded-3xl lg:p-8"
          style={lightFormVars}
        >
          <div className="absolute top-5 left-5 flex items-center gap-2 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-primary/30 shadow-sm">
              <Image alt="" className="size-5 object-contain" priority src={paperoLogo} />
            </span>
            <span className="font-semibold text-lg">{APP_CONFIG.name}</span>
          </div>
          {children}
        </div>

        <section className="relative hidden overflow-hidden rounded-3xl border border-white/10 bg-card/35 shadow-2xl shadow-black/35 backdrop-blur-xl lg:order-1 lg:flex">
          <PaperoAuthShader />
          <div className="absolute -top-24 right-12 h-72 w-72 rounded-full bg-primary/35 blur-3xl" />
          <div className="absolute bottom-8 left-8 h-80 w-80 rounded-full bg-orange-900/45 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 h-56 w-56 rounded-full bg-amber-400/10 blur-2xl" />

          <div className="relative flex min-h-0 flex-1 flex-col justify-between p-10 xl:p-12">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/35">
                <Image alt="" className="size-6 object-contain" priority src={paperoLogo} />
              </span>
              <div>
                <h1 className="font-semibold text-2xl tracking-normal">{APP_CONFIG.name}</h1>
                <p className="text-sm text-white/62">Simple finance tracking for solo founders and small teams.</p>
              </div>
            </div>

            <div className="max-w-xl space-y-5">
              <Badge className="rounded-full border-white/15 bg-white/10 text-white backdrop-blur-md" variant="outline">
                Local-first finance workspace
              </Badge>
              <div className="space-y-4">
                <h2 className="text-balance font-medium text-5xl text-white leading-[1.02] tracking-tight">
                  Clear cash flow without the ERP weight.
                </h2>
                <p className="max-w-lg text-lg text-white/68 leading-7">
                  Organize income, expenses, accounts, customers and suppliers in a calm dashboard built for small
                  companies.
                </p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/9 p-4 shadow-black/15 shadow-lg backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <ChartNoAxesColumnIncreasing className="size-5 text-white" />
                </div>
                <p className="font-medium text-sm text-white">Cash flow clarity</p>
                <p className="mt-2 text-white/65 text-xs leading-5">Track cash in, out, and open.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/9 p-4 shadow-black/15 shadow-lg backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <ListPlus className="size-5 text-white" />
                </div>
                <p className="font-medium text-sm text-white">Fast transaction entry</p>
                <p className="mt-2 text-white/65 text-xs leading-5">Create entries with context.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/9 p-4 shadow-black/15 shadow-lg backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <Building2 className="size-5 text-white" />
                </div>
                <p className="font-medium text-sm text-white">Accounts and contacts</p>
                <p className="mt-2 text-white/65 text-xs leading-5">Manage accounts and contacts.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
