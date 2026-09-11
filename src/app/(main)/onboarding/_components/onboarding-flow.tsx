"use client";

import * as React from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { enUS, ptBR } from "date-fns/locale";
import { ArrowLeft, ArrowRight, CalendarIcon, Check, Landmark } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type OnboardingFormValues, onboardingFormSchema, parseDateOnly, parseMoneyToCents } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

import paperoLogo from "../../../../../media/logo-light-liquid-glass.svg";
import { OnboardingStepIcon } from "./onboarding-step-icons";

type OnboardingFlowProps = {
  initialAccount: {
    institution: string;
    name: string;
    openingBalanceCents: number;
  };
  initialWorkspaceName: string;
};

type PendingAction = "complete" | "skip" | null;

const steps = [{ key: "workspace" }, { key: "account" }, { key: "transaction" }, { key: "plans" }] as const;

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatBrazilianMoneyInput(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(
    amountCents / 100,
  );
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function useDebouncedValue<T>(value: T, delay = 180) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

function AnimatedCurrencyValue({
  amountCents,
  className,
  formatter,
  prefersReducedMotion,
}: {
  amountCents: number;
  className?: string;
  formatter: Intl.NumberFormat;
  prefersReducedMotion: boolean | null;
}) {
  return (
    <AnimatePresence initial={!prefersReducedMotion} mode="wait">
      <motion.span
        animate={{ opacity: 1, y: 0 }}
        className={className}
        exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -3 }}
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 3 }}
        key={amountCents}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
      >
        {formatter.format(amountCents / 100)}
      </motion.span>
    </AnimatePresence>
  );
}

export function OnboardingFlow({ initialAccount, initialWorkspaceName }: OnboardingFlowProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = React.useState(1);
  const [stepDirection, setStepDirection] = React.useState<1 | -1>(1);
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isExiting, setIsExiting] = React.useState(false);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const focusHeading = React.useCallback((node: HTMLHeadingElement | null) => {
    node?.focus();
  }, []);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      accountName: initialAccount.name,
      addTransaction: true,
      institution: initialAccount.institution,
      openingBalance: formatBrazilianMoneyInput(initialAccount.openingBalanceCents),
      transactionAmount: "",
      transactionDate: "",
      transactionDescription: "",
      transactionKind: "income",
      workspaceName: initialWorkspaceName,
    },
  });

  const values = useWatch({ control: form.control });
  const isPending = pendingAction !== null;
  const debouncedOpeningBalanceCents = useDebouncedValue(parseMoneyToCents(values.openingBalance ?? "") ?? 0);
  const debouncedTransactionAmountCents = useDebouncedValue(
    values.addTransaction ? Math.max(parseMoneyToCents(values.transactionAmount ?? "") ?? 0, 0) : 0,
  );

  React.useEffect(() => {
    if (!form.getValues("transactionDate")) {
      form.setValue("transactionDate", getLocalDateString());
    }
  }, [form]);

  function validationMessage(message?: string) {
    return message ? t(`validation.${message}`) : undefined;
  }

  async function advanceStep() {
    const fields: Array<keyof OnboardingFormValues> =
      step === 1
        ? ["workspaceName"]
        : step === 2
          ? ["accountName", "institution", "openingBalance"]
          : ["transactionDescription", "transactionAmount", "transactionDate"];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (valid) {
      setStepDirection(1);
      setStep((current) => Math.min(current + 1, steps.length));
    }
  }

  async function submitRequest(payload: { action: "skip" } | ({ action: "complete" } & OnboardingFormValues)) {
    setSubmitError(null);

    const response = await fetch("/api/onboarding", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      fieldErrors?: Record<string, string[] | undefined>;
    } | null;

    if (!response.ok) {
      if (body?.fieldErrors) {
        for (const [field, messages] of Object.entries(body.fieldErrors)) {
          const firstMessage = messages?.[0];
          if (field in form.getValues() && firstMessage) {
            form.setError(field as keyof OnboardingFormValues, { message: firstMessage });
          }
        }
      }
      throw new Error(body?.error || t("errors.generic"));
    }

    setIsExiting(true);
  }

  async function finish(valuesToSave: OnboardingFormValues, action: Exclude<PendingAction, "skip" | null>) {
    setPendingAction(action);
    try {
      await submitRequest({ action: "complete", ...valuesToSave });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("errors.generic"));
      setPendingAction(null);
    }
  }

  async function skipOnboarding() {
    setPendingAction("skip");
    try {
      await submitRequest({ action: "skip" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("errors.generic"));
      setPendingAction(null);
    }
  }

  function skipTransaction() {
    form.setValue("addTransaction", false);
    setStepDirection(1);
    setStep(4);
  }

  React.useEffect(() => {
    if (!isExiting) return;

    const timeout = window.setTimeout(
      () => {
        router.refresh();
      },
      prefersReducedMotion ? 0 : 180,
    );

    return () => window.clearTimeout(timeout);
  }, [isExiting, prefersReducedMotion, router]);

  function normalizeMoneyField(fieldName: "openingBalance" | "transactionAmount", value: string) {
    const amountCents = parseMoneyToCents(value);
    if (amountCents !== null) {
      form.setValue(fieldName, formatBrazilianMoneyInput(amountCents), { shouldDirty: true, shouldValidate: true });
    }
  }

  const openingBalanceCents = debouncedOpeningBalanceCents;
  const transactionAmountCents = debouncedTransactionAmountCents;
  const projectedBalanceCents =
    openingBalanceCents + (values.transactionKind === "expense" ? -transactionAmountCents : transactionAmountCents);
  const currency = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
  const transactionDate = values.transactionDate ? parseDateOnly(values.transactionDate) : null;
  const formattedDate = transactionDate
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC", year: "numeric" }).format(
        transactionDate,
      )
    : t("preview.noDate");
  const calendarLocale = locale === "pt" ? ptBR : enUS;

  const stepMotion = prefersReducedMotion
    ? {
        center: { opacity: 1 },
        enter: { opacity: 0 },
        exit: { opacity: 0 },
      }
    : {
        center: { opacity: 1, x: 0 },
        enter: (direction: 1 | -1) => ({ opacity: 0, x: direction * 18 }),
        exit: (direction: 1 | -1) => ({ opacity: 0, x: direction * -18 }),
      };
  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" as const };
  const isPlansStep = step === steps.length;
  const layoutTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <Dialog open>
      <DialogContent
        className={cn(
          "!z-[70] !gap-0 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-border/80 bg-background/95 p-0 text-foreground shadow-[0_32px_100px_rgba(15,23,42,0.42)] ring-1 ring-black/10 backdrop-blur-xl transition-[max-width] duration-400 ease-out data-closed:animate-none data-open:animate-none",
          isPlansStep ? "!max-w-[680px] sm:!max-w-[680px]" : "!max-w-[1140px] sm:!max-w-[1140px]",
        )}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        overlayClassName="!z-[60] bg-black/55 backdrop-blur-[3px]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t("dialogTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("dialogDescription")}</DialogDescription>
        <motion.div
          animate={isExiting ? "exit" : "enter"}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-background text-foreground"
          initial={prefersReducedMotion ? false : "initial"}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
          variants={{
            enter: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.985, y: 10 },
            initial: { opacity: 0, scale: 0.98, y: 12 },
          }}
        >
          <header className="flex items-center justify-between gap-4 border-border/70 border-b px-5 py-4 sm:px-8 lg:px-10">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Image alt="" className="size-5 object-contain" priority src={paperoLogo} />
              </span>
              <span className="font-semibold text-lg">Papero</span>
            </div>
            <Button disabled={isPending} onClick={skipOnboarding} type="button" variant="outline">
              {pendingAction === "skip" ? t("actions.saving") : t("actions.later")}
            </Button>
          </header>

          <div
            className={cn(
              "relative grid overflow-hidden transition-[grid-template-columns] duration-400 ease-out",
              !isPlansStep && "lg:min-h-[620px]",
              isPlansStep ? "lg:grid-cols-[1fr_0fr]" : "lg:grid-cols-[1.05fr_0.8fr]",
            )}
          >
            <section className="flex min-w-0 flex-col bg-background/65 px-5 pt-4 pb-5 backdrop-blur-xl sm:px-8 sm:pt-6 sm:pb-8 lg:px-10 lg:pt-7 lg:pb-10">
              <nav aria-label={t("progressLabel")} className="mb-8">
                <div className="relative">
                  <span aria-hidden="true" className="absolute top-4 right-4 left-4 z-0 h-px bg-border">
                    <motion.span
                      animate={{ scaleX: (step - 1) / (steps.length - 1) }}
                      className="block h-full origin-left bg-primary"
                      initial={false}
                      transition={transition}
                    />
                  </span>
                  <ol className="relative grid w-full grid-cols-[2rem_1fr_2rem_1fr_2rem_1fr_2rem] pb-7">
                    {steps.map((item, index) => {
                      const itemStep = index + 1;
                      const complete = itemStep < step;
                      const current = itemStep === step;

                      return (
                        <li
                          className={cn("relative z-10 flex min-w-0 flex-col items-center gap-2")}
                          key={item.key}
                          style={{ gridColumnStart: index * 2 + 1 }}
                        >
                          <motion.span
                            aria-current={current ? "step" : undefined}
                            className={cn(
                              "relative z-10 flex size-8 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors motion-reduce:transition-none",
                              current && "border-primary bg-primary text-primary-foreground shadow-sm",
                              complete && "border-primary/40 bg-background text-primary shadow-sm",
                            )}
                            animate={{ scale: 1 }}
                            initial={false}
                            transition={transition}
                          >
                            <motion.span
                              animate={{ opacity: complete ? 0 : 1, scale: complete ? 0.75 : 1 }}
                              className="absolute"
                              initial={false}
                              transition={transition}
                            >
                              <OnboardingStepIcon active={current} step={item.key} />
                            </motion.span>
                            <motion.span
                              animate={{ opacity: complete ? 1 : 0, scale: complete ? 1 : 0.75 }}
                              className="absolute"
                              initial={false}
                              transition={transition}
                            >
                              <Check className="size-4" />
                            </motion.span>
                          </motion.span>
                          <motion.span
                            className={cn(
                              "absolute top-10 left-1/2 w-max -translate-x-1/2 text-center text-muted-foreground text-xs",
                              index === 0 && "left-0 translate-x-0 text-left",
                              index === steps.length - 1 && "right-0 left-auto translate-x-0 text-right",
                              current && "font-medium text-foreground",
                            )}
                            animate={{ opacity: current ? 1 : 0.72 }}
                            initial={false}
                            transition={transition}
                          >
                            {t(`steps.${item.key}.shortTitle`)}
                          </motion.span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </nav>

              <form
                aria-busy={isPending}
                className={cn("flex flex-col", !isPlansStep && "flex-1")}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (step < steps.length) void advanceStep();
                  else void form.handleSubmit((data) => finish(data, "complete"))();
                }}
              >
                <div className={cn(!isPlansStep && "flex-1 sm:min-h-[360px]")}>
                  <AnimatePresence initial={!prefersReducedMotion} mode="wait">
                    <motion.div
                      animate="center"
                      className={cn(!isPlansStep && "min-h-[300px]")}
                      custom={stepDirection}
                      exit="exit"
                      initial="enter"
                      key={step}
                      transition={transition}
                      variants={stepMotion}
                    >
                      <div className="mb-7 space-y-2">
                        <Badge className="-ml-2 rounded-full" variant="secondary">
                          {t("stepCount", { current: step, total: steps.length })}
                        </Badge>
                        <h1
                          className="font-medium text-2xl tracking-normal outline-none sm:text-3xl"
                          ref={focusHeading}
                          tabIndex={-1}
                        >
                          {step === 3 ? (
                            <>
                              {t("steps.transaction.title")}
                              <span className="ml-2 align-middle text-base text-muted-foreground sm:text-lg">
                                {t("steps.transaction.optional")}
                              </span>
                            </>
                          ) : (
                            t(`steps.${steps[step - 1].key}.title`)
                          )}
                        </h1>
                        <p className="max-w-xl text-muted-foreground leading-6">
                          {t(`steps.${steps[step - 1].key}.description`)}
                        </p>
                      </div>

                      {step === 1 ? (
                        <Controller
                          control={form.control}
                          name="workspaceName"
                          render={({ field, fieldState }) => (
                            <Field className="max-w-lg" data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="onboarding-workspace-name">{t("fields.workspaceName")}</FieldLabel>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                autoComplete="organization"
                                id="onboarding-workspace-name"
                              />
                              <FieldDescription>{t("fields.workspaceNameDescription")}</FieldDescription>
                              {fieldState.invalid ? (
                                <FieldError>{validationMessage(fieldState.error?.message)}</FieldError>
                              ) : null}
                            </Field>
                          )}
                        />
                      ) : null}

                      {step === 2 ? (
                        <div className="grid max-w-xl gap-5 sm:grid-cols-2">
                          <Controller
                            control={form.control}
                            name="accountName"
                            render={({ field, fieldState }) => (
                              <Field className="sm:col-span-2" data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="onboarding-account-name">{t("fields.accountName")}</FieldLabel>
                                <Input {...field} aria-invalid={fieldState.invalid} id="onboarding-account-name" />
                                {fieldState.invalid ? (
                                  <FieldError>{validationMessage(fieldState.error?.message)}</FieldError>
                                ) : null}
                              </Field>
                            )}
                          />
                          <Controller
                            control={form.control}
                            name="institution"
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="onboarding-institution">{t("fields.institution")}</FieldLabel>
                                <Input
                                  {...field}
                                  aria-invalid={fieldState.invalid}
                                  id="onboarding-institution"
                                  placeholder={t("fields.institutionPlaceholder")}
                                />
                                {fieldState.invalid ? (
                                  <FieldError>{validationMessage(fieldState.error?.message)}</FieldError>
                                ) : null}
                              </Field>
                            )}
                          />
                          <Controller
                            control={form.control}
                            name="openingBalance"
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="onboarding-opening-balance">
                                  {t("fields.openingBalance")}
                                </FieldLabel>
                                <div className="relative">
                                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                                    R$
                                  </span>
                                  <Input
                                    {...field}
                                    aria-invalid={fieldState.invalid}
                                    className="pl-10"
                                    id="onboarding-opening-balance"
                                    inputMode="decimal"
                                    onBlur={(event) => {
                                      field.onBlur();
                                      normalizeMoneyField("openingBalance", event.target.value);
                                    }}
                                  />
                                </div>
                                {fieldState.invalid ? (
                                  <FieldError>{validationMessage(fieldState.error?.message)}</FieldError>
                                ) : null}
                              </Field>
                            )}
                          />
                          <div className="flex flex-wrap gap-2 text-xs sm:col-span-2">
                            <Badge variant="outline">BRL</Badge>
                            <Badge variant="outline">{t("fields.operatingAccount")}</Badge>
                          </div>
                        </div>
                      ) : null}

                      {step === 3 ? (
                        <div className="grid max-w-xl gap-5">
                          <Controller
                            control={form.control}
                            name="transactionKind"
                            render={({ field }) => (
                              <Field>
                                <FieldLabel>{t("fields.transactionKind")}</FieldLabel>
                                <RadioGroup
                                  aria-label={t("fields.transactionKind")}
                                  className="grid-cols-2"
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  {(["income", "expense"] as const).map((kind) => (
                                    <FieldLabel
                                      className="cursor-pointer"
                                      htmlFor={`onboarding-kind-${kind}`}
                                      key={kind}
                                    >
                                      <Field orientation="horizontal">
                                        <RadioGroupItem id={`onboarding-kind-${kind}`} value={kind} />
                                        <span>{t(`fields.transactionKinds.${kind}`)}</span>
                                      </Field>
                                    </FieldLabel>
                                  ))}
                                </RadioGroup>
                              </Field>
                            )}
                          />
                          <Controller
                            control={form.control}
                            name="transactionDescription"
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="onboarding-transaction-description">
                                  {t("fields.transactionDescription")}
                                </FieldLabel>
                                <Input
                                  {...field}
                                  aria-invalid={fieldState.invalid}
                                  id="onboarding-transaction-description"
                                  placeholder={t("fields.transactionDescriptionPlaceholder")}
                                />
                                {fieldState.invalid ? (
                                  <FieldError>{validationMessage(fieldState.error?.message)}</FieldError>
                                ) : null}
                              </Field>
                            )}
                          />
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Controller
                              control={form.control}
                              name="transactionAmount"
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="onboarding-transaction-amount">
                                    {t("fields.transactionAmount")}
                                  </FieldLabel>
                                  <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                                      R$
                                    </span>
                                    <Input
                                      {...field}
                                      aria-invalid={fieldState.invalid}
                                      className="pl-10"
                                      id="onboarding-transaction-amount"
                                      inputMode="decimal"
                                      onBlur={(event) => {
                                        field.onBlur();
                                        normalizeMoneyField("transactionAmount", event.target.value);
                                      }}
                                      placeholder="0,00"
                                    />
                                  </div>
                                  {fieldState.invalid ? (
                                    <FieldError>{validationMessage(fieldState.error?.message)}</FieldError>
                                  ) : null}
                                </Field>
                              )}
                            />
                            <Controller
                              control={form.control}
                              name="transactionDate"
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="onboarding-transaction-date">
                                    {t("fields.transactionDate")}
                                  </FieldLabel>
                                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        aria-invalid={fieldState.invalid}
                                        className="h-9 w-full justify-start border border-input bg-transparent px-3 font-normal hover:bg-accent hover:text-accent-foreground"
                                        id="onboarding-transaction-date"
                                        type="button"
                                        variant="ghost"
                                      >
                                        <CalendarIcon className="size-4 text-muted-foreground" />
                                        {transactionDate
                                          ? new Intl.DateTimeFormat(locale, {
                                              day: "2-digit",
                                              month: "2-digit",
                                              timeZone: "UTC",
                                              year: "numeric",
                                            }).format(transactionDate)
                                          : t("preview.noDate")}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="!z-[80] w-auto p-0">
                                      <Calendar
                                        locale={calendarLocale}
                                        mode="single"
                                        onSelect={(date) => {
                                          if (!date) return;
                                          field.onChange(formatDateOnly(date));
                                          field.onBlur();
                                          setDatePickerOpen(false);
                                        }}
                                        selected={transactionDate ?? undefined}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  {fieldState.invalid ? (
                                    <FieldError>{validationMessage(fieldState.error?.message)}</FieldError>
                                  ) : null}
                                </Field>
                              )}
                            />
                          </div>
                          <FieldDescription>{t("fields.transactionDescriptionHelp")}</FieldDescription>
                        </div>
                      ) : null}

                      {step === steps.length ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Card className="border-border/80 shadow-sm" size="sm">
                            <CardHeader>
                              <CardTitle className="text-lg">{t("plans.hosted.name")}</CardTitle>
                              <div className="mt-2 flex items-baseline gap-1">
                                <span className="font-medium text-3xl tabular-nums tracking-normal">
                                  {t("plans.hosted.price")}
                                </span>
                                <span className="text-muted-foreground text-sm">{t("plans.perMonth")}</span>
                              </div>
                              <CardDescription className="mt-2 text-xs leading-5">
                                {t("plans.hosted.description")}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t pt-3">
                              <p className="font-medium text-xs">{t("plans.included")}</p>
                              <ul className="mt-3 space-y-2 text-muted-foreground text-xs">
                                {([0, 1, 2, 3, 4] as const).map((item) => (
                                  <li className="flex gap-2 leading-4" key={item}>
                                    <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                                    {t(`plans.hosted.features.${item}`)}
                                  </li>
                                ))}
                              </ul>
                              <Button className="mt-4 w-full" disabled={isPending} type="submit">
                                {t("plans.hosted.startTrial")}
                                <ArrowRight data-icon="inline-end" />
                              </Button>
                            </CardContent>
                          </Card>

                          <Card className="border-primary/50 bg-primary/[0.03] shadow-sm" size="sm">
                            <CardHeader>
                              <CardTitle className="text-lg">{t("plans.custom.name")}</CardTitle>
                              <div className="mt-2 flex items-baseline gap-1">
                                <span className="font-medium text-3xl tabular-nums tracking-normal">
                                  {t("plans.custom.price")}
                                </span>
                                <span className="text-muted-foreground text-sm">{t("plans.perMonth")}</span>
                              </div>
                              <CardDescription className="mt-2 text-xs leading-5">
                                {t("plans.custom.description")}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t pt-3">
                              <p className="font-medium text-xs">{t("plans.included")}</p>
                              <ul className="mt-3 space-y-2 text-muted-foreground text-xs">
                                {([0, 1, 2, 3] as const).map((item) => (
                                  <li className="flex gap-2 leading-4" key={item}>
                                    <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                                    {t(`plans.custom.features.${item}`)}
                                  </li>
                                ))}
                              </ul>
                              <Button className="mt-4 w-full" disabled={isPending} type="submit">
                                {t("plans.custom.startTrial")}
                                <ArrowRight data-icon="inline-end" />
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>

                  {submitError ? (
                    <Alert className="mt-6 max-w-xl" variant="destructive">
                      <AlertTitle>{t("errors.title")}</AlertTitle>
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>

                <div className={cn("flex flex-wrap items-center gap-2 border-t pt-5", isPlansStep ? "mt-5" : "mt-10")}>
                  {step > 1 ? (
                    <Button
                      disabled={isPending}
                      onClick={() => {
                        setStepDirection(-1);
                        setStep((current) => current - 1);
                      }}
                      type="button"
                      variant="outline"
                    >
                      <ArrowLeft data-icon="inline-start" />
                      {t("actions.back")}
                    </Button>
                  ) : null}
                  <div className="ml-auto flex flex-wrap justify-end gap-2">
                    {step === 3 ? (
                      <Button disabled={isPending} onClick={skipTransaction} type="button" variant="ghost">
                        {t("actions.skipTransaction")}
                      </Button>
                    ) : null}
                    {step < steps.length ? (
                      <Button disabled={isPending} type="submit">
                        {t("actions.continue")}
                        {step < 3 ? <ArrowRight data-icon="inline-end" /> : null}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </form>
            </section>

            <motion.aside
              animate={isPlansStep ? { opacity: 0, x: 40 } : { opacity: 1, x: 0 }}
              className={cn(
                "min-w-0 overflow-hidden border-border/70 border-t bg-muted/25 p-5 transition-[padding,border-color] duration-400 ease-out sm:p-8 lg:border-t-0 lg:border-l lg:p-10",
                isPlansStep &&
                  "pointer-events-none max-lg:hidden lg:absolute lg:inset-y-0 lg:right-0 lg:w-0 lg:border-transparent lg:p-0",
              )}
              aria-hidden={isPlansStep || undefined}
              aria-label={t("preview.label")}
              transition={layoutTransition}
            >
              <div className="sticky top-10 space-y-7">
                <div className="space-y-2">
                  <Badge className="rounded-full border-primary/20 bg-primary/10 text-primary" variant="outline">
                    {t("preview.badge")}
                  </Badge>
                  <h2 className="font-medium text-2xl tracking-normal">
                    {values.workspaceName?.trim() || t("preview.workspaceFallback")}
                  </h2>
                  <p className="text-muted-foreground text-sm">{t("preview.description")}</p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase">{t("preview.operatingAccount")}</p>
                      <p className="font-medium text-lg">
                        {values.accountName?.trim() || t("preview.accountFallback")}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {values.institution?.trim() || t("preview.noInstitution")}
                      </p>
                    </div>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Landmark className="size-5" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <p className="text-muted-foreground text-xs">{t("preview.openingBalance")}</p>
                    <p className="mt-1 font-medium text-3xl tabular-nums tracking-normal">
                      <AnimatedCurrencyValue
                        amountCents={openingBalanceCents}
                        formatter={currency}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 border-y py-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">{t("preview.plannedMovement")}</p>
                    <p
                      className={cn(
                        "mt-1 font-medium text-lg tabular-nums",
                        values.transactionKind === "expense" ? "text-destructive" : "text-primary",
                      )}
                    >
                      <AnimatePresence initial={!prefersReducedMotion} mode="wait">
                        <motion.span
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -3 }}
                          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 3 }}
                          key={`${values.transactionKind}-${transactionAmountCents}-${values.addTransaction}`}
                          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
                        >
                          {values.addTransaction && transactionAmountCents > 0
                            ? `${values.transactionKind === "expense" ? "−" : "+"}${currency.format(transactionAmountCents / 100)}`
                            : currency.format(0)}
                        </motion.span>
                      </AnimatePresence>
                    </p>
                    <p className="mt-1 truncate text-muted-foreground text-xs">
                      {values.transactionDescription?.trim() || t("preview.noTransaction")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t("preview.projectedBalance")}</p>
                    <p className="mt-1 font-medium text-lg tabular-nums">
                      <AnimatedCurrencyValue
                        amountCents={projectedBalanceCents}
                        formatter={currency}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">{formattedDate}</p>
                  </div>
                </div>

                <p className="text-muted-foreground text-xs leading-5">{t("preview.note")}</p>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
