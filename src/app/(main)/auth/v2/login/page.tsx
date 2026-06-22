import Link from "next/link";

import { LoginForm } from "../../_components/login-form";

export default function LoginV2() {
  return (
    <div className="flex w-full max-w-md flex-col gap-8 rounded-3xl border border-border/70 bg-card/70 p-6 shadow-2xl shadow-foreground/5 backdrop-blur-xl sm:p-8">
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to continue managing your finances with Papero.</p>
        </div>
        <div className="space-y-5">
          <LoginForm />
        </div>
      </div>

      <div className="text-center text-muted-foreground text-sm">
        Don&apos;t have an account?{" "}
        <Link prefetch={false} className="font-medium text-foreground hover:text-primary" href="register">
          Create your workspace
        </Link>
      </div>
    </div>
  );
}
