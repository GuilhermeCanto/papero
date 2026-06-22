import Link from "next/link";

import { RegisterForm } from "../../_components/register-form";

export default function RegisterV2() {
  return (
    <div className="flex w-full max-w-md flex-col gap-8 rounded-3xl border border-border/70 bg-card/70 p-6 shadow-2xl shadow-foreground/5 backdrop-blur-xl sm:p-8">
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl tracking-tight">Create your workspace</h1>
          <p className="text-muted-foreground text-sm">
            Start tracking income, expenses, accounts, and cash flow in one place.
          </p>
        </div>
        <div className="space-y-5">
          <RegisterForm />
        </div>
      </div>

      <div className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link prefetch={false} className="font-medium text-foreground hover:text-primary" href="login">
          Sign in
        </Link>
      </div>
    </div>
  );
}
