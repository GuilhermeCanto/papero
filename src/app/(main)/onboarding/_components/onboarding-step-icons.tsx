"use client";

import * as React from "react";

import { motion, useAnimation, useReducedMotion, type Variants } from "motion/react";

type StepIconName = "account" | "plans" | "transaction" | "workspace";

type OnboardingStepIconProps = {
  active: boolean;
  step: StepIconName;
};

const workspaceVariants = {
  first: {
    animate: { x: [0, 11, 11, 0], y: 0 },
    normal: { x: 0, y: 0 },
  },
  fourth: {
    animate: { x: 0, y: [0, -11, -11, 0] },
    normal: { x: 0, y: 0 },
  },
  second: {
    animate: { x: 0, y: [0, 11, 11, 0] },
    normal: { x: 0, y: 0 },
  },
  third: {
    animate: { x: [0, -11, -11, 0], y: 0 },
    normal: { x: 0, y: 0 },
  },
} satisfies Record<string, Variants>;

const springTransition = { bounce: 0.8, damping: 15, stiffness: 150, type: "spring" as const };
const loopingTransition = { duration: 0.8, ease: "easeInOut" as const, times: [0, 0.4, 0.6, 1] };

function useActiveStepAnimation(active: boolean, pause = 2400) {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    let cancelled = false;
    let timeout: number | undefined;

    if (!active || prefersReducedMotion) {
      void controls.start("normal");
      return;
    }

    const run = async () => {
      await controls.start("animate");
      if (!cancelled) timeout = window.setTimeout(run, pause);
    };

    void run();

    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
      controls.stop();
    };
  }, [active, controls, pause, prefersReducedMotion]);

  return controls;
}

function WorkspaceIcon({ active }: Pick<OnboardingStepIconProps, "active">) {
  const controls = useActiveStepAnimation(active, 2300);

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <motion.rect
        animate={controls}
        height="7"
        initial="normal"
        rx="1"
        transition={loopingTransition}
        variants={workspaceVariants.first}
        width="7"
        x="3"
        y="3"
      />
      <motion.rect
        animate={controls}
        height="7"
        initial="normal"
        rx="1"
        transition={loopingTransition}
        variants={workspaceVariants.second}
        width="7"
        x="14"
        y="3"
      />
      <motion.rect
        animate={controls}
        height="7"
        initial="normal"
        rx="1"
        transition={loopingTransition}
        variants={workspaceVariants.third}
        width="7"
        x="14"
        y="14"
      />
      <motion.rect
        animate={controls}
        height="7"
        initial="normal"
        rx="1"
        transition={loopingTransition}
        variants={workspaceVariants.fourth}
        width="7"
        x="3"
        y="14"
      />
    </svg>
  );
}

function AccountIcon({ active }: Pick<OnboardingStepIconProps, "active">) {
  const controls = useActiveStepAnimation(active, 2500);
  const firstCoinVariants: Variants = {
    animate: { opacity: [0, 1], y: [-20, 0], transition: springTransition },
    normal: { opacity: 1, transition: springTransition, y: 0 },
  };
  const secondCoinVariants: Variants = {
    animate: { opacity: [0, 1], y: [-20, 0], transition: { ...springTransition, delay: 0.15 } },
    normal: { opacity: 1, transition: { ...springTransition, delay: 0.15 }, y: 0 },
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 16 6 6" />
      <motion.circle animate={controls} cx="16" cy="9" initial="normal" r="2.9" variants={firstCoinVariants} />
      <motion.circle animate={controls} cx="6" cy="5" initial="normal" r="3" variants={secondCoinVariants} />
    </svg>
  );
}

const transactionDots = [
  { cx: 8, cy: 14 },
  { cx: 12, cy: 14 },
  { cx: 16, cy: 14 },
  { cx: 8, cy: 18 },
  { cx: 12, cy: 18 },
  { cx: 16, cy: 18 },
];

function TransactionIcon({ active }: Pick<OnboardingStepIconProps, "active">) {
  const controls = useActiveStepAnimation(active, 2700);
  const dotVariants: Variants = {
    animate: (index: number) => ({
      opacity: [1, 0.3, 1],
      transition: { delay: index * 0.1, duration: 0.4, times: [0, 0.5, 1] },
    }),
    normal: { opacity: 1 },
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <path d="M3 10h18" />
      {transactionDots.map((dot, index) => (
        <motion.circle
          animate={controls}
          custom={index}
          cx={dot.cx}
          cy={dot.cy}
          fill="currentColor"
          initial="normal"
          key={`${dot.cx}-${dot.cy}`}
          r="1"
          stroke="none"
          variants={dotVariants}
        />
      ))}
    </svg>
  );
}

function PlansIcon({ active }: Pick<OnboardingStepIconProps, "active">) {
  const controls = useActiveStepAnimation(active, 2100);
  const cardVariants: Variants = {
    animate: { transition: { duration: 0.7, ease: "easeInOut", times: [0, 0.4, 0.75, 1] }, x: [0, -4, 1.5, 0] },
    normal: { transition: { damping: 18, stiffness: 280, type: "spring" }, x: 0 },
  };

  return (
    <svg
      aria-hidden="true"
      className="overflow-visible"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <motion.g animate={controls} initial="normal" variants={cardVariants}>
        <rect height="14" rx="2" width="20" x="2" y="5" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </motion.g>
    </svg>
  );
}

export function OnboardingStepIcon({ active, step }: OnboardingStepIconProps) {
  if (step === "workspace") return <WorkspaceIcon active={active} />;
  if (step === "account") return <AccountIcon active={active} />;
  if (step === "transaction") return <TransactionIcon active={active} />;
  return <PlansIcon active={active} />;
}
