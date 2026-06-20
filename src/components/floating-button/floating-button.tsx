"use client";

import * as React from "react";

import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type FloatingButtonProps = {
  className?: string;
  children: React.ReactNode;
  triggerContent: React.ReactNode;
};

type FloatingButtonItemProps = {
  children: React.ReactNode;
  index?: number;
};

const rightSideFanPositions = [
  { x: 14, y: -54 },
  { x: 54, y: -18 },
  { x: 54, y: 18 },
  { x: 14, y: 54 },
];

const list = {
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      staggerChildren: 0.06,
      staggerDirection: -1,
      when: "afterChildren",
    },
  },
};

const item = {
  visible: ({ x, y }: { x: number; y: number }) => ({ opacity: 1, scale: 1, x, y }),
  hidden: { opacity: 0, scale: 0.75, x: 0, y: 0 },
};

const trigger = {
  visible: { rotate: "45deg" },
  hidden: { rotate: 0 },
};

function FloatingButton({ children, className, triggerContent }: FloatingButtonProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [listPosition, setListPosition] = React.useState({ left: 0, top: 0 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updateListPosition = React.useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    setListPosition({
      left: rect.right + 8,
      top: rect.top + rect.height / 2,
    });
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || listRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    updateListPosition();
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updateListPosition);
    window.addEventListener("scroll", updateListPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updateListPosition);
      window.removeEventListener("scroll", updateListPosition, true);
    };
  }, [isOpen, updateListPosition]);

  const listContent = (
    <AnimatePresence>
      <motion.ul
        animate={isOpen ? "visible" : "hidden"}
        className={cn("fixed z-50 size-0", isOpen ? "pointer-events-auto" : "pointer-events-none")}
        initial="hidden"
        key="list"
        onClick={() => setIsOpen(false)}
        ref={listRef}
        style={{
          left: listPosition.left,
          top: listPosition.top,
        }}
        variants={list}
      >
        {children}
      </motion.ul>
    </AnimatePresence>
  );

  return (
    <div className={cn("relative flex items-center", className)} ref={ref}>
      <AnimatePresence>
        <motion.div
          animate={isOpen ? "visible" : "hidden"}
          className="cursor-pointer"
          key="button"
          onClick={() => {
            updateListPosition();
            setIsOpen((current) => !current);
          }}
          variants={trigger}
        >
          {triggerContent}
        </motion.div>
      </AnimatePresence>
      {mounted ? createPortal(listContent, document.body) : null}
    </div>
  );
}

function FloatingButtonItem({ children, index = 0 }: FloatingButtonItemProps) {
  const position = rightSideFanPositions[index] ?? rightSideFanPositions.at(-1) ?? { x: 54, y: 0 };

  return (
    <motion.li className="absolute" custom={position} variants={item}>
      {children}
    </motion.li>
  );
}

export { FloatingButton, FloatingButtonItem };
