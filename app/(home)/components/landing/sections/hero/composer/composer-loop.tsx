"use client";

import { AnimatePresence, motion, type Transition } from "motion/react";
import { createContext, type ReactNode, useContext, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ClaudeCodeIcon,
  CursorIcon,
  GeminiIcon,
  OpenAIIcon,
} from "../../../ui/brand-icons";
import { PickedContent, PickedPill } from "./picked-chip";
import { AGENT_LABEL, type AgentId, SCENARIOS } from "./scenarios";
import { type ComposerState, useComposerLoop } from "./use-composer-loop";

const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94] as const;

/** Picks swap as a left-to-right ripple, like a logo carousel wave. */
const PICK_DURATION = 0.45;
const PICK_STAGGER = 0.09;

type LoopContext = { state: ComposerState; reducedMotion: boolean };

const ComposerLoopContext = createContext<LoopContext | null>(null);

function useLoop() {
  const value = useContext(ComposerLoopContext);
  if (!value) throw new Error("Composer parts must render inside ComposerLoop");
  return value;
}

/** The composer `<figure>`: owns the loop and pauses it off screen. */
export function ComposerLoop({
  className,
  label,
  children,
}: {
  className?: string;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { playing, ...loop } = useComposerLoop(ref);
  return (
    <ComposerLoopContext.Provider value={loop}>
      <figure
        ref={ref}
        aria-label={label}
        data-paused={playing ? undefined : ""}
        className={className}
      >
        {children}
      </figure>
    </ComposerLoopContext.Provider>
  );
}

const AGENT_ICON: Record<AgentId, (className: string) => ReactNode> = {
  "claude-code": (c) => <ClaudeCodeIcon className={c} />,
  codex: (c) => <OpenAIIcon className={cn(c, "text-foreground")} />,
  cursor: (c) => <CursorIcon className={cn(c, "text-foreground")} />,
  "gemini-cli": (c) => <GeminiIcon className={c} />,
};

function swapVariants(reducedMotion: boolean, transition: Transition) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition },
      exit: { opacity: 0, transition },
    };
  }
  return {
    initial: { opacity: 0, transform: "translateY(60%)", filter: "blur(2px)" },
    animate: {
      opacity: 1,
      transform: "translateY(0%)",
      filter: "blur(0px)",
      transition,
    },
    exit: {
      opacity: 0,
      transform: "translateY(-50%)",
      filter: "blur(3px)",
      transition,
    },
  };
}

/** "Claude Code · ~/acme-launch", swapping agents between prompts. */
export function AgentLine() {
  const { state, reducedMotion } = useLoop();
  const scenario = SCENARIOS[state.agentIndex];
  const variants = swapVariants(reducedMotion, {
    duration: 0.35,
    ease: EASE_OUT_QUAD,
  });

  return (
    <div className="relative flex h-5 items-center md:h-[22px]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={scenario.agent}
          {...variants}
          className="flex items-center gap-2 md:gap-2.5"
        >
          {AGENT_ICON[scenario.agent]("size-5 shrink-0 md:size-[22px]")}
          <span className="flex items-center gap-2 md:hidden">
            <span className="text-[14px] leading-[18px] text-foreground">
              {AGENT_LABEL[scenario.agent]}
            </span>
            <span className="font-mono text-mono text-muted-foreground">
              {scenario.folder}
            </span>
          </span>
          <span className="hidden text-caption whitespace-pre text-muted-foreground md:inline">
            {`${AGENT_LABEL[scenario.agent]} · `}
            <span className="font-mono">{scenario.folder}</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * The prompt being typed. Every prompt is laid out invisibly in the same grid
 * cell, so the paragraph keeps the height of the tallest one and the controls
 * below never move.
 */
export function TypedPrompt({ className }: { className?: string }) {
  const { state, reducedMotion } = useLoop();
  const prompt = SCENARIOS[state.index].prompt;
  const typed = prompt.slice(0, state.typed);
  const selectionStart = state.selectionStart ?? state.typed;
  const blinking = state.phase === "hold" || state.phase === "empty";

  return (
    <p className={cn("grid", className)}>
      <span className="sr-only">{SCENARIOS[0].prompt}</span>
      {SCENARIOS.map((scenario) => (
        <span
          key={scenario.agent}
          aria-hidden="true"
          className="invisible col-start-1 row-start-1"
        >
          {scenario.prompt}
        </span>
      ))}
      <motion.span
        key={reducedMotion ? state.index : "typed"}
        aria-hidden="true"
        className="col-start-1 row-start-1"
        initial={reducedMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {typed.slice(0, selectionStart)}
        {selectionStart < typed.length && (
          <span className="rounded-[3px] bg-primary-tint box-decoration-clone text-foreground">
            {typed.slice(selectionStart)}
          </span>
        )}
        {!reducedMotion && (
          <span
            data-loop
            className={cn(
              "ml-px inline-block h-[1.05em] w-[2px] translate-y-[0.16em] rounded-full bg-primary",
              blinking && "animate-[caret-blink_1.06s_steps(1)_infinite]",
              state.selectionStart !== null && "opacity-0",
            )}
          />
        )}
      </motion.span>
    </p>
  );
}

/** The four blocks the agent picked, swapping as a wave per prompt. */
export function PickedRow() {
  const { state, reducedMotion } = useLoop();

  return (
    <ul className="flex items-center gap-2">
      {[0, 1, 2, 3].map((slot) => (
        <PickedSlot
          key={slot}
          slot={slot}
          activeIndex={state.pickedIndex}
          reducedMotion={reducedMotion}
        />
      ))}
    </ul>
  );
}

/**
 * One pill. The pill itself never moves or resizes: every block that can land
 * in this slot is laid out invisibly in the same grid cell, so the pill is as
 * wide as the longest of them, and only the content rolls vertically inside
 * it (clipped), like a slot-machine reel.
 */
function PickedSlot({
  slot,
  activeIndex,
  reducedMotion,
}: {
  slot: number;
  activeIndex: number;
  reducedMotion: boolean;
}) {
  const block = SCENARIOS[activeIndex].picked[slot];
  const variants = rollVariants(reducedMotion, {
    duration: PICK_DURATION,
    ease: EASE_OUT_QUAD,
    delay: slot * PICK_STAGGER,
  });

  return (
    <li className="shrink-0">
      <PickedPill href={block.href} label={block.title}>
        {SCENARIOS.map((scenario) => (
          <PickedContent
            key={scenario.picked[slot].name}
            block={scenario.picked[slot]}
            sizer
            className="invisible"
          />
        ))}
        <AnimatePresence initial={false}>
          <motion.span
            key={block.name}
            {...variants}
            className="col-start-1 row-start-1 flex"
          >
            <PickedContent block={block} />
          </motion.span>
        </AnimatePresence>
      </PickedPill>
    </li>
  );
}

/** Vertical-only roll: in from below, out through the top, inside the pill. */
function rollVariants(reducedMotion: boolean, transition: Transition) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition },
      exit: { opacity: 0, transition },
    };
  }
  return {
    initial: { opacity: 0, transform: "translateY(100%)", filter: "blur(2px)" },
    animate: {
      opacity: 1,
      transform: "translateY(0%)",
      filter: "blur(0px)",
      transition,
    },
    exit: {
      opacity: 0,
      transform: "translateY(-100%)",
      filter: "blur(2px)",
      transition,
    },
  };
}
