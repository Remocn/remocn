"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type VizProps = { play: boolean };

const LOOP = 6;

function WindowFrame({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-2">
        <span className="flex gap-1" aria-hidden>
          <span className="size-1.5 rounded-full bg-foreground/15" />
          <span className="size-1.5 rounded-full bg-foreground/15" />
          <span className="size-1.5 rounded-full bg-foreground/15" />
        </span>
        <span className="truncate font-mono text-[10px] text-muted-foreground/70">
          {label}
        </span>
      </div>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </div>
  );
}

function Caret({ active }: { active: boolean }) {
  if (!active) {
    return <span className="inline-block h-3 w-[2px] bg-foreground/60" />;
  }
  return (
    <motion.span
      aria-hidden
      className="inline-block h-3 w-[2px] bg-foreground/60"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{
        duration: 1.1,
        times: [0, 0.5, 0.5, 1],
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    />
  );
}

export function AgentWindowViz({ play }: VizProps) {
  const reduced = useReducedMotion();
  const active = play && !reduced;

  return (
    <WindowFrame label="~/demo-video">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-muted-foreground/50">›</span>
          <Caret active={active} />
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/45">
          empty folder
        </p>
      </div>
    </WindowFrame>
  );
}

const LOG_LINES = ["installing skill", "starting preview"];
const PROMPT = "Set up a remocn project";

export function PromptTypingViz({ play }: VizProps) {
  const reduced = useReducedMotion();
  const active = play && !reduced;

  if (!active) {
    return (
      <WindowFrame label="~/demo-video">
        <div className="flex h-full flex-col gap-2">
          <p className="font-mono text-xs text-foreground">› {PROMPT}</p>
          {LOG_LINES.map((line) => (
            <p
              key={line}
              className="font-mono text-[10px] text-muted-foreground/60"
            >
              {line}
            </p>
          ))}
        </div>
      </WindowFrame>
    );
  }

  return (
    <WindowFrame label="~/demo-video">
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="shrink-0 text-muted-foreground/50">›</span>
          <motion.span
            className="overflow-hidden whitespace-nowrap text-foreground will-change-[width]"
            animate={{
              width: [
                "0ch",
                `${PROMPT.length}ch`,
                `${PROMPT.length}ch`,
                `${PROMPT.length}ch`,
              ],
            }}
            transition={{
              duration: LOOP,
              times: [0, 0.32, 0.92, 1],
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            {PROMPT}
          </motion.span>
          <Caret active />
        </div>

        <div className="flex flex-col gap-1.5">
          {LOG_LINES.map((line, i) => (
            <motion.p
              key={line}
              className="font-mono text-[10px] text-muted-foreground/60 will-change-[transform,opacity]"
              animate={{ opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, 0] }}
              transition={{
                duration: LOOP,
                times: [0, 0.42 + i * 0.12, 0.54 + i * 0.12, 0.92, 1],
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>
    </WindowFrame>
  );
}

function ChatBubble({ w }: { w: string }) {
  return (
    <span
      aria-hidden
      className="block h-1.5 rounded-full bg-foreground/10"
      style={{ width: w }}
    />
  );
}

function PlayerBody({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-lg bg-muted/40 p-2.5">
      <div className="flex flex-1 items-center justify-center">
        {active ? (
          <motion.span
            className="text-sm font-semibold tracking-tight text-foreground will-change-[transform,opacity]"
            animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] }}
            transition={{
              duration: LOOP,
              times: [0.5, 0.62, 0.88, 1],
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            Your product
          </motion.span>
        ) : (
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Your product
          </span>
        )}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
        {active ? (
          <motion.div
            className="h-full origin-left rounded-full bg-foreground/40 will-change-transform"
            animate={{ scaleX: [0, 0, 1, 0] }}
            transition={{
              duration: LOOP,
              times: [0, 0.5, 0.95, 1],
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ) : (
          <div className="h-full w-1/2 rounded-full bg-foreground/40" />
        )}
      </div>
    </div>
  );
}

export function PlayerRevealViz({ play }: VizProps) {
  const reduced = useReducedMotion();
  const active = play && !reduced;

  return (
    <WindowFrame label="localhost:3000">
      <div className="flex h-full gap-2">
        <motion.div
          className="flex shrink-0 flex-col gap-1.5 overflow-hidden will-change-[width]"
          style={active ? undefined : { width: "26%" }}
          initial={active ? { width: "58%" } : false}
          animate={active ? { width: ["58%", "58%", "26%", "26%"] } : undefined}
          transition={{
            duration: LOOP,
            times: [0, 0.34, 0.5, 1],
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <ChatBubble w="80%" />
          <ChatBubble w="55%" />
          <ChatBubble w="70%" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <PlayerBody active={active} />
        </div>
      </div>
    </WindowFrame>
  );
}
