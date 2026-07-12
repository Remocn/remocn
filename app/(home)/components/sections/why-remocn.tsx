"use client";

import {
  ArrowRight,
  Bot,
  Check,
  Clapperboard,
  Clock,
  Wallet,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { type ComponentType, useRef } from "react";
import { INSTALL_COMMAND, SPRING_BOUNCE, SPRING_SOFT } from "@/config/site";
import { cn } from "@/lib/utils";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";

const MINT = "#3aad78";

const EYEBROW = "Why remocn";
const TITLE = "You want the video, not the ordeal.";
const LEAD =
  "Motion usually costs tokens, an afternoon, a designer's invoice, and a weekend lost in After Effects. remocn hands you the animation — copy, paste, render.";

interface Problem {
  icon: ComponentType<{ className?: string }>;
  task: string;
  cost: string;
  gain: string;
}

const PROBLEMS: Problem[] = [
  {
    icon: Bot,
    task: "Teaching an AI to keyframe",
    cost: "~40k tokens",
    gain: "Included",
  },
  {
    icon: Clock,
    task: "Inventing the animation",
    cost: "An afternoon",
    gain: "Already built",
  },
  {
    icon: Wallet,
    task: "Hiring a motion designer",
    cost: "$600+",
    gain: "$0",
  },
  {
    icon: Clapperboard,
    task: "Learning After Effects",
    cost: "A weekend",
    gain: "Skip it",
  },
];

function InstallLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 overflow-x-auto rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 font-mono text-sm",
        className,
      )}
    >
      <span className="shrink-0 text-muted-foreground/70 select-none">$</span>
      <span className="whitespace-nowrap text-foreground">
        {INSTALL_COMMAND}
      </span>
    </div>
  );
}

function LedgerRow({ problem, index }: { problem: Problem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const active = inView || reduced;
  const Icon = problem.icon;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2.5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3.5",
        index > 0 && "border-t border-border/60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon aria-hidden className="size-5 shrink-0 text-foreground/55" />
        <p className="min-w-0 text-base font-medium text-foreground">
          {problem.task}
        </p>
      </div>
      <div className="flex items-center gap-2.5 pl-[1.875rem] sm:shrink-0 sm:gap-4 sm:pl-0">
        <span className="relative inline-block text-sm text-foreground/45 sm:text-base">
          {problem.cost}
          <motion.span
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-px origin-left bg-foreground/50"
            initial={reduced ? false : { scaleX: 0 }}
            animate={active ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{
              ...SPRING_SOFT,
              delay: reduced ? 0 : 0.15 + index * 0.12,
            }}
          />
        </span>
        <ArrowRight
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground/40"
        />
        <motion.span
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-base"
          initial={reduced ? false : { opacity: 0, x: 8 }}
          animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
          transition={{
            ...SPRING_BOUNCE,
            delay: reduced ? 0 : 0.3 + index * 0.12,
          }}
        >
          <Check
            aria-hidden
            className="size-4 shrink-0"
            style={{ color: MINT }}
          />
          {problem.gain}
        </motion.span>
      </div>
    </div>
  );
}

export function WhyRemocn() {
  return (
    <section id="why-remocn" className="relative pt-6 pb-14 sm:pt-0 sm:pb-20">
      <div className="section">
        <SectionHeading eyebrow={EYEBROW} title={TITLE} lead={LEAD} />

        <FadeUp className="mt-10 sm:mt-14">
          <div className="surface-card w-full rounded-3xl p-4 sm:p-5 lg:p-6">
            <div className="mb-1 flex items-end justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-base font-semibold text-foreground sm:text-lg">
                  The usual bill
                </p>
                <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
                  What a video normally costs you
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold text-foreground sm:text-lg">
                  With remocn
                </p>
                <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
                  Just one command
                </p>
              </div>
            </div>

            {PROBLEMS.map((problem, i) => (
              <LedgerRow key={problem.task} problem={problem} index={i} />
            ))}

            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground sm:text-base">
                Total, the remocn way —{" "}
                <span className="text-foreground">one line.</span>
              </p>
              <InstallLine className="sm:w-auto" />
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
