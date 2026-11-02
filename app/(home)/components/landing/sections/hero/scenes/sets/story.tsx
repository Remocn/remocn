"use client";

import { motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Frame } from "./kit";
import type { SceneDef, SceneProps, SceneSet } from "./types";

const EXPO = [0.16, 1, 0.3, 1] as const;
const STRONG = [0.23, 1, 0.32, 1] as const;
const IN_OUT = [0.65, 0, 0.35, 1] as const;
const stepped = (n: number) => (t: number) => Math.floor(t * n) / n;
const heavy = "font-semibold tracking-[-0.05em] leading-[0.95]";

function Camera({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("absolute inset-0", className)}
      animate={{ scale: [1, 1.04] }}
      transition={{
        duration: 7,
        ease: "linear",
        repeat: Infinity,
        repeatType: "mirror",
      }}
    >
      {children}
    </motion.div>
  );
}

function useTyped(
  text: string,
  cycle: number,
  msPerChar: number,
  startMs: number,
) {
  const [count, setCount] = useState(text.length);
  useEffect(() => {
    if (cycle < 0) return;
    setCount(0);
    let n = 0;
    let id: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      id = setInterval(() => {
        n += 1;
        setCount(n);
        if (n >= text.length) clearInterval(id);
      }, msPerChar);
    }, startMs);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [text, cycle, msPerChar, startMs]);
  return count;
}

const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

function useScramble(text: string, cycle: number, speed: number) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (cycle < 0) return;
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      const locked = Math.floor(frame / 3);
      setOut(
        text
          .split("")
          .map((c, i) =>
            c === " " || i < locked
              ? c
              : GLYPHS[(frame * 7 + i * 13) % GLYPHS.length],
          )
          .join(""),
      );
      if (locked > text.length) clearInterval(id);
    }, 40 / speed);
    return () => clearInterval(id);
  }, [text, cycle, speed]);
  return out;
}

function MaskedTitle({ cycle, speed }: SceneProps) {
  const lines = ["Ship it on", "Tuesday."];
  return (
    <Frame className="bg-[#0B0C0E]">
      <Camera>
        <div
          key={cycle}
          className="absolute inset-x-5 bottom-5 flex flex-col text-[32px] text-white"
        >
          {lines.map((line, i) => (
            <span key={line} className="overflow-hidden pb-0.5">
              <motion.span
                className={`block ${heavy}`}
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 0.7 / speed,
                  ease: EXPO,
                  delay: (0.15 + i * 0.12) / speed,
                }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </div>
      </Camera>
    </Frame>
  );
}

function ScrambleTitle({ cycle, speed }: SceneProps) {
  const title = useScramble("LEDGER 2.4", cycle, speed);
  const sub = useScramble("release notes", cycle, speed * 0.7);
  return (
    <Frame className="bg-[#0B0C0E]">
      <Camera>
        <div className="absolute inset-x-5 bottom-5 flex flex-col gap-1.5">
          <span className="font-mono text-[28px] leading-none font-semibold tracking-[-0.02em] text-white tabular-nums">
            {title}
          </span>
          <span className="font-mono text-mono text-white/45">{sub}</span>
        </div>
      </Camera>
    </Frame>
  );
}

function SteppedShapes({ cycle, speed }: SceneProps) {
  const shapes = [
    "rounded-full",
    "",
    "rounded-t-full",
    "rounded-full",
    "rotate-45",
    "",
  ];
  return (
    <Frame className="bg-[#EDEEF0]">
      <div key={cycle} className="absolute inset-x-5 top-5 flex gap-2">
        {shapes.map((shape, i) => (
          <motion.span
            key={i}
            className={cn(
              "size-7 bg-[#0E1012]",
              shape,
              i === 3 && "bg-[#22C55E]",
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5 / speed,
              ease: stepped(6),
              delay: (0.1 + i * 0.06) / speed,
            }}
          />
        ))}
      </div>
      <motion.span
        key={`w-${cycle}`}
        className={`absolute bottom-4 left-5 text-[46px] text-[#0E1012] ${heavy}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.5 / speed,
          ease: stepped(7),
          delay: 0.6 / speed,
        }}
      >
        Pulse
      </motion.span>
    </Frame>
  );
}

function PushIn({ cycle, speed }: SceneProps) {
  return (
    <Frame className="bg-[#FFE27A]">
      <motion.div
        key={cycle}
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={{ scale: 1.35 }}
        transition={{ duration: 2.2 / speed, ease: IN_OUT }}
        style={{ transformOrigin: "70% 55%" }}
      >
        <svg viewBox="0 0 288 162" className="absolute inset-0 size-full">
          <motion.path
            d="M196 120 C 192 96, 206 84, 204 70 C 202 54, 186 50, 188 38 C 190 26, 208 22, 216 32 C 222 40, 220 50, 230 56 C 238 61, 236 74, 226 78 C 236 90, 230 104, 222 120"
            fill="none"
            stroke="#0E1012"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1.4 / speed,
              ease: IN_OUT,
              delay: 0.1 / speed,
            }}
          />
        </svg>
      </motion.div>
      <motion.span
        key={`t-${cycle}`}
        className={`absolute bottom-4 left-5 text-[26px] text-[#0E1012] ${heavy}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 / speed, ease: EXPO, delay: 2 / speed }}
      >
        Think it. Write it.
      </motion.span>
    </Frame>
  );
}

function StatSlide({ cycle, speed }: SceneProps) {
  return (
    <Frame className="bg-black">
      <div
        key={cycle}
        className="absolute inset-x-5 bottom-6 flex flex-col gap-1.5"
      >
        <motion.span
          className={`text-[56px] text-white tabular-nums ${heavy}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5 / speed,
            ease: EXPO,
            delay: 0.15 / speed,
          }}
        >
          2,418
        </motion.span>
        <motion.span
          className="text-small text-white/55"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5 / speed,
            ease: EXPO,
            delay: 0.35 / speed,
          }}
        >
          signups in week one
        </motion.span>
      </div>
    </Frame>
  );
}

function Odometer({ cycle, speed }: SceneProps) {
  const digits = ["1", "2"];
  return (
    <Frame className="bg-[#0B0C0E]">
      <div className="absolute inset-x-4 top-4 flex flex-col gap-1.5 font-mono text-[9px] text-white/30">
        <span>await ledger.release()</span>
        <span>{"  changes: 12,"}</span>
        <span>{"  status: shipped"}</span>
      </div>
      <div key={cycle} className="absolute bottom-5 left-4 flex">
        {digits.map((digit, i) => {
          const spins = 10 + Number(digit) + i * 10;
          return (
            <span
              key={i}
              className="relative h-[64px] w-[38px] overflow-hidden"
            >
              <motion.span
                className="absolute inset-x-0 top-0 flex flex-col"
                initial={{ y: 0 }}
                animate={{ y: -spins * 64 }}
                transition={{
                  duration: (1.2 + i * 0.2) / speed,
                  ease: EXPO,
                  delay: 0.1 / speed,
                }}
              >
                {Array.from({ length: spins + 1 }, (_, n) => (
                  <span
                    key={n}
                    className={`flex h-[64px] items-center text-[60px] text-white tabular-nums ${heavy}`}
                  >
                    {n % 10}
                  </span>
                ))}
              </motion.span>
            </span>
          );
        })}
      </div>
      <motion.span
        key={`chip-${cycle}`}
        className="absolute right-4 bottom-7 rounded-[8px] bg-white px-2 py-1 text-caption font-medium text-[#0E1012]"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.04, 1], opacity: 1 }}
        transition={{ duration: 0.4 / speed, ease: STRONG, delay: 1.5 / speed }}
      >
        changes
      </motion.span>
    </Frame>
  );
}

function LinearPunch({ cycle, speed }: SceneProps) {
  return (
    <Frame className="flex items-center justify-center bg-black">
      <motion.div
        key={cycle}
        className="flex flex-col items-center gap-1"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1, 1.3] }}
        transition={{
          duration: 0.97 / speed,
          times: [0, 0.82, 1],
          ease: "linear",
          delay: 0.2 / speed,
        }}
      >
        <span className="font-mono text-[46px] leading-none font-semibold tracking-[-0.03em] text-white tabular-nums">
          10.24
        </span>
        <span className="font-mono text-mono text-white/45">launch</span>
      </motion.div>
    </Frame>
  );
}

function ClonedDigits({ speed }: SceneProps) {
  const clones = [3, 2, 1];
  return (
    <Frame className="bg-[#A800B7]">
      {clones.map((n) => (
        <motion.span
          key={n}
          className={`absolute top-1/2 left-1/2 text-[70px] text-[#F0ABFC] ${heavy}`}
          style={{ opacity: 0.25 + 0.15 * (3 - n) }}
          animate={{
            x: ["-50%", `${-50 + n * 9}%`, "-50%"],
            y: ["-50%", `${-50 - n * 10}%`, "-50%"],
          }}
          transition={{
            duration: 3 / speed,
            ease: "linear",
            repeat: Infinity,
            delay: n * 0.12,
          }}
        >
          0.2s
        </motion.span>
      ))}
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[70px] text-white ${heavy}`}
      >
        0.2s
      </span>
    </Frame>
  );
}

function ComparisonChart({ cycle, speed }: SceneProps) {
  return (
    <Frame className="bg-black">
      <svg
        key={cycle}
        viewBox="0 0 240 135"
        className="absolute inset-0 size-full"
      >
        <line x1="24" y1="112" x2="224" y2="112" stroke="#FFFFFF1F" />
        <motion.path
          d="M24 104 C 70 98, 120 90, 220 78"
          fill="none"
          stroke="#4A4E52"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.2 / speed,
            ease: IN_OUT,
            delay: 0.1 / speed,
          }}
        />
        <motion.path
          d="M24 104 C 70 92, 120 60, 220 26"
          fill="none"
          stroke="#F0ABFC"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.2 / speed,
            ease: IN_OUT,
            delay: 0.1 / speed,
          }}
        />
        <motion.circle
          cx="220"
          cy="26"
          r="4"
          fill="#F0ABFC"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 / speed, delay: 1.3 / speed }}
        />
      </svg>
      <span className="absolute top-4 left-5 text-[11px] text-white/55">
        Activation, higher is better
      </span>
      <motion.span
        key={`l-${cycle}`}
        className="absolute top-[34px] right-5 text-[11px] font-medium text-[#F0ABFC]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 / speed, delay: 1.35 / speed }}
      >
        Acme
      </motion.span>
    </Frame>
  );
}

function BaselineBars({ cycle, speed }: SceneProps) {
  const bars = [32, 46, 40, 58, 52, 74, 100];
  return (
    <Frame className="bg-white">
      <span className="absolute top-4 left-5 text-[11px] text-[#6B7A80]">
        Changes per week
      </span>
      <div
        key={cycle}
        className="absolute inset-x-5 bottom-5 flex h-[78px] items-end gap-1.5 border-b border-[#0E10121F]"
      >
        {bars.map((v, i) => (
          <motion.span
            key={i}
            className={cn(
              "flex-1 origin-bottom rounded-t-[3px]",
              i === bars.length - 1 ? "bg-[#A800B7]" : "bg-[#0E1012]/15",
            )}
            style={{ height: `${v}%` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              duration: 0.45 / speed,
              ease: STRONG,
              delay: (0.1 + i * 0.05) / speed,
            }}
          />
        ))}
      </div>
    </Frame>
  );
}

function CascadeRows({ cycle, speed }: SceneProps) {
  const children = ["design team", "early access", "press"];
  return (
    <Frame className="bg-[#0B0C0E]">
      <div
        key={cycle}
        className="absolute inset-x-4 top-4 flex flex-col gap-1.5 text-[11px]"
      >
        <motion.span
          className="flex items-center justify-between rounded-[6px] bg-white/[0.06] px-2.5 py-1.5 text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25 / speed,
            ease: EXPO,
            delay: 0.1 / speed,
          }}
        >
          Beta invites
          <span className="font-mono text-white/45 tabular-nums">1,024</span>
        </motion.span>
        {children.map((child, i) => (
          <motion.span
            key={child}
            className="ml-4 flex items-center gap-2 px-2.5 py-1 text-white/70"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25 / speed,
              ease: EXPO,
              delay: (0.45 + i * 0.06) / speed,
            }}
          >
            <span className="size-1.5 rounded-full bg-[#22C55E]" />
            {child}
          </motion.span>
        ))}
      </div>
    </Frame>
  );
}

function DotMap({ cycle, speed }: SceneProps) {
  const cols = 22;
  const rows = 9;
  const lit = new Set([
    25, 26, 47, 48, 70, 93, 100, 101, 122, 123, 145, 112, 113, 135, 158, 160,
    181,
  ]);
  return (
    <Frame className="bg-white">
      <div
        key={cycle}
        className="absolute inset-x-4 top-4 grid gap-[5px]"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols * rows }, (_, i) => (
          <motion.span
            key={i}
            className="aspect-square rounded-full"
            initial={{ backgroundColor: "#0E101214" }}
            animate={
              lit.has(i)
                ? { backgroundColor: "#A800B7", scale: [1, 1.5, 1] }
                : { backgroundColor: "#0E101214" }
            }
            transition={{
              duration: 0.35 / speed,
              delay: (0.2 + (i % cols) * 0.04) / speed,
            }}
          />
        ))}
      </div>
      <span className="absolute bottom-3 left-4 text-[11px] text-[#6B7A80]">
        Synced in 42 countries
      </span>
    </Frame>
  );
}

function BeatCut({ cycle, speed }: SceneProps) {
  const words = ["one", "prompt.", "one", "afternoon."];
  const [index, setIndex] = useState(words.length - 1);
  useEffect(() => {
    if (cycle < 0) return;
    setIndex(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= words.length) {
        clearInterval(id);
        return;
      }
      setIndex(i);
    }, 330 / speed);
    return () => clearInterval(id);
  }, [cycle, speed]);
  return (
    <Frame className="flex items-center justify-center bg-[#0B0C0E]">
      <span className={`text-[40px] text-white ${heavy}`}>{words[index]}</span>
    </Frame>
  );
}

function PhraseMask({ cycle, speed }: SceneProps) {
  return (
    <Frame className="bg-[#0B0C0E]">
      <div
        key={cycle}
        className="absolute inset-x-4 bottom-5 flex flex-col text-[26px]"
      >
        <span className="overflow-hidden">
          <motion.span
            className={`block text-white/70 ${heavy}`}
            initial={{ y: "105%" }}
            animate={{ y: "0%" }}
            transition={{
              duration: 0.6 / speed,
              ease: EXPO,
              delay: 0.15 / speed,
            }}
          >
            twelve fixes,
          </motion.span>
        </span>
        <span className="overflow-hidden">
          <motion.span
            className={`block text-white ${heavy}`}
            initial={{ y: "105%" }}
            animate={{ y: "0%" }}
            transition={{
              duration: 0.6 / speed,
              ease: EXPO,
              delay: 0.4 / speed,
            }}
          >
            <span className="font-bold">zero</span> downtime.
          </motion.span>
        </span>
      </div>
    </Frame>
  );
}

function SlamWords({ cycle, speed }: SceneProps) {
  const words = ["coming", "this", "fall."];
  const [index, setIndex] = useState(words.length - 1);
  useEffect(() => {
    if (cycle < 0) return;
    setIndex(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= words.length) {
        clearInterval(id);
        return;
      }
      setIndex(i);
    }, 300 / speed);
    return () => clearInterval(id);
  }, [cycle, speed]);
  return (
    <Frame className="flex items-center justify-center bg-[#22C55E]">
      <motion.span
        key={`${cycle}-${index}`}
        className="text-[54px] leading-none font-black tracking-[-0.06em] text-[#0E1012]"
        style={{ display: "inline-block", transformOrigin: "50% 100%" }}
        initial={{ scaleY: 1.6, scaleX: 0.78 }}
        animate={{ scaleY: 1, scaleX: 0.82 }}
        transition={{ duration: 0.12 / speed, ease: STRONG }}
      >
        {words[index]}
      </motion.span>
    </Frame>
  );
}

function TerminalCaption({ cycle, speed }: SceneProps) {
  const text = "write it down, ship it";
  const typed = useTyped(text, cycle, 33 / speed, 200 / speed);
  return (
    <Frame className="bg-[#101214] px-4 pt-5">
      <span className="font-mono text-[15px] leading-6 text-[#E4E5E7]">
        <span className="text-[#F0ABFC]">{"› "}</span>
        {text.slice(0, typed)}
        <span className="ml-0.5 inline-block h-4 w-[7px] translate-y-[3px] animate-[caret-blink_1.06s_steps(1)_infinite] bg-[#E4E5E7]" />
      </span>
    </Frame>
  );
}

function UiRows({ badge, diff }: { badge?: boolean; diff?: boolean }) {
  return (
    <div className="absolute inset-0 flex">
      <div className="w-[52px] border-r border-white/[0.06] p-2.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="mb-2 block h-1.5 rounded-full bg-white/10"
            style={{ width: `${70 - i * 10}%` }}
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {[0, 1, 2, 3, 4].map((i) =>
          diff ? (
            <span
              key={i}
              className={cn(
                "flex h-3 items-center gap-1.5 rounded-[3px] px-1 font-mono text-[8px]",
                i % 2
                  ? "bg-[#22C55E]/15 text-[#86EFAC]"
                  : "bg-[#EF4444]/15 text-[#FCA5A5]",
              )}
            >
              {i % 2 ? "+ sync()" : "- poll()"}
            </span>
          ) : (
            <span key={i} className="flex items-center gap-2">
              <span className="size-2 rounded-full border border-white/25" />
              <span
                className="h-1.5 rounded-full bg-white/15"
                style={{ width: `${80 - i * 9}%` }}
              />
              {badge && i === 1 && (
                <span
                  data-badge
                  className="ml-auto rounded-full bg-[#A800B7] px-1.5 py-px text-[8px] font-medium text-white"
                >
                  v2.0
                </span>
              )}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function DriftPunch({ cycle, speed }: SceneProps) {
  return (
    <Frame className="bg-[#0B0C0E]">
      <motion.div
        key={cycle}
        className="absolute inset-0"
        style={{ transformOrigin: "88% 36%" }}
        initial={{ x: 0, scale: 1 }}
        animate={{ x: [0, -6, -6], scale: [1, 1.03, 1.9] }}
        transition={{
          duration: 1.9 / speed,
          times: [0, 0.8, 1],
          ease: ["linear", EXPO],
        }}
      >
        <UiRows badge />
      </motion.div>
    </Frame>
  );
}

function AnchoredMatch({ cycle, speed }: SceneProps) {
  const [swapped, setSwapped] = useState(false);
  useEffect(() => {
    if (cycle < 0) return;
    setSwapped(false);
    const id = setTimeout(() => setSwapped(true), 1000 / speed);
    return () => clearTimeout(id);
  }, [cycle, speed]);
  return (
    <Frame className="bg-[#0B0C0E]">
      <motion.div
        className="absolute inset-0"
        animate={{ x: [0, -8] }}
        transition={{
          duration: 6,
          ease: "linear",
          repeat: Infinity,
          repeatType: "mirror",
        }}
      >
        <UiRows diff={swapped} />
      </motion.div>
    </Frame>
  );
}

function SplitSeam({ cycle, speed }: SceneProps) {
  const travel = {
    duration: 1.4 / speed,
    ease: "linear" as const,
    delay: 0.2 / speed,
  };
  return (
    <Frame className="flex">
      <div className="relative flex-1 overflow-hidden bg-black">
        <motion.span
          key={cycle}
          className="absolute top-1/2 size-10 -translate-y-1/2 rounded-full bg-white"
          initial={{ left: "10%" }}
          animate={{ left: "200%" }}
          transition={travel}
        />
        <span className="absolute bottom-3 left-3 text-[11px] text-white/60">
          10.23
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden bg-[#22C55E]">
        <motion.span
          key={cycle}
          className="absolute top-1/2 size-10 -translate-y-1/2 rounded-full bg-[#0E1012]"
          initial={{ left: "-90%" }}
          animate={{ left: "100%" }}
          transition={travel}
        />
        <span className="absolute bottom-3 left-3 text-[11px] text-[#0E1012]/70">
          10.24
        </span>
      </div>
    </Frame>
  );
}

function CursorWhip({ cycle, speed }: SceneProps) {
  const d = (s: number) => s / speed;
  return (
    <Frame className="bg-[#F4F4F5]">
      <motion.div
        key={cycle}
        className="absolute inset-0 flex"
        style={{ width: "200%" }}
        initial={{ x: "0%", filter: "blur(0px)" }}
        animate={{
          x: ["0%", "0%", "-50%"],
          filter: ["blur(0px)", "blur(0px)", "blur(0px)"],
        }}
        transition={{
          duration: d(1.9),
          times: [0, 0.72, 1],
          ease: ["linear", IN_OUT],
        }}
      >
        <div className="relative flex flex-1 items-center justify-center">
          <motion.span
            className="rounded-[9px] bg-[#0E1012] px-3.5 py-1.5 text-caption font-medium text-white"
            animate={{ scale: [1, 1, 0.94, 1] }}
            transition={{ duration: d(1.2), times: [0, 0.75, 0.82, 1] }}
          >
            Share
          </motion.span>
        </div>
        <div className="relative flex flex-1 items-center justify-center bg-[#A800B7]">
          <span className={`text-[34px] text-white ${heavy}`}>Shared</span>
        </div>
      </motion.div>
      <motion.svg
        key={`c-${cycle}`}
        viewBox="0 0 24 24"
        className="absolute size-7 text-[#0E1012]"
        initial={{ left: "60%", top: "115%" }}
        animate={{
          left: ["60%", "52%", "52%", "120%"],
          top: ["115%", "48%", "48%", "40%"],
          scale: [1, 1, 0.84, 1],
        }}
        transition={{
          duration: d(1.9),
          times: [0, 0.45, 0.62, 1],
          ease: [EXPO, "linear", [0.5, 0, 0.9, 0.4]],
        }}
      >
        <path
          d="M5 3l14 7.5-6.2 1.8L10 19z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </motion.svg>
    </Frame>
  );
}

function CreditCard() {
  return (
    <Frame className="flex flex-col items-center justify-center gap-1 bg-black">
      <span className="text-[13px] font-medium text-white">Made with acme</span>
      <span className="text-[10px] text-white/50">acme.dev</span>
    </Frame>
  );
}

function ParticleMark({ cycle, speed }: SceneProps) {
  const cols = 9;
  const rows = 12;
  const cx = 4;
  const cy = 5;
  return (
    <Frame className="bg-black">
      <div
        key={cycle}
        className="absolute inset-x-4 top-6 grid gap-[7px]"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols * rows }, (_, i) => {
          const x = i % cols;
          const y = Math.floor(i / cols);
          const dist = Math.hypot(x - cx, y - cy);
          const inside = dist < 2.8;
          const push = Math.max(0, 3.2 - dist) * 6;
          const angle = Math.atan2(y - cy, x - cx);
          return (
            <motion.span
              key={i}
              className={cn(
                "aspect-square rounded-full",
                inside ? "bg-white" : "bg-white/15",
              )}
              initial={{
                x: Math.cos(angle) * push,
                y: Math.sin(angle) * push,
                scale: 0.4,
              }}
              animate={{ x: 0, y: 0, scale: inside ? 1 : 0.7 }}
              transition={{
                duration: 1.5 / speed,
                ease: EXPO,
                delay: (0.1 + dist * 0.04) / speed,
              }}
            />
          );
        })}
      </div>
      <span
        className={`absolute inset-x-0 bottom-7 text-center text-[20px] text-white ${heavy}`}
      >
        ledger
      </span>
    </Frame>
  );
}

function ShapeLetters({ cycle, speed }: SceneProps) {
  const letters = "pulse".split("");
  const shapes = [
    "rounded-full",
    "",
    "rounded-t-full",
    "rotate-45",
    "rounded-full",
  ];
  return (
    <Frame className="flex items-center justify-center bg-[#EDEEF0]">
      <div key={cycle} className="flex items-end gap-0.5">
        {letters.map((letter, i) => (
          <span
            key={letter + i}
            className="relative flex h-9 w-[22px] items-end justify-center"
          >
            <motion.span
              className={`text-[34px] text-[#0E1012] ${heavy}`}
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 1, 0, 0, 1] }}
              transition={{
                duration: 2 / speed,
                times: [0, 0.2, 0.25, 0.7, 0.75],
                ease: stepped(1),
                delay: (i * 0.06) / speed,
              }}
            >
              {letter}
            </motion.span>
            <motion.span
              className={cn(
                "absolute bottom-1 size-[18px]",
                i === 2 ? "bg-[#22C55E]" : "bg-[#0E1012]",
                shapes[i],
              )}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 0, 1, 1, 0] }}
              transition={{
                duration: 2 / speed,
                times: [0, 0.2, 0.25, 0.7, 0.75],
                ease: stepped(1),
                delay: (i * 0.06) / speed,
              }}
            />
          </span>
        ))}
      </div>
    </Frame>
  );
}

function LayeredMonogram({ speed }: SceneProps) {
  return (
    <Frame className="flex flex-col items-center justify-center gap-5 bg-[#A800B7]">
      <span className="relative flex size-[78px] items-center justify-center">
        <motion.span
          className="absolute size-[70px] bg-[#F0ABFC]"
          animate={{ rotate: [0, 90] }}
          transition={{ duration: 2.4 / speed, repeat: Infinity, ease: IN_OUT }}
        />
        <motion.span
          className="absolute size-[52px] rounded-full bg-[#0E1012]"
          animate={{ scale: [1, 0.82, 1] }}
          transition={{
            duration: 3 / speed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.span
          className="absolute size-[24px] rotate-45 bg-white"
          animate={{ rotate: [45, 35, 55, 45] }}
          transition={{
            duration: 3.6 / speed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </span>
      <span className={`text-[24px] text-white ${heavy}`}>notes</span>
    </Frame>
  );
}

function def(
  block: string,
  surface: string,
  dark: boolean,
  duration: number,
  render: SceneDef["render"],
): SceneDef {
  return { block, surface, dark, duration, render };
}

export const STORY_SET: SceneSet = [
  {
    1: def("mask-reveal-up", "bg-[#0B0C0E]", true, 2.6, (p) => (
      <MaskedTitle {...p} />
    )),
    2: def("rolling-number", "bg-black", true, 2.4, (p) => (
      <StatSlide {...p} />
    )),
    3: def("animated-line-chart", "bg-black", true, 2.6, (p) => (
      <ComparisonChart {...p} />
    )),
    4: def("caption-word-pop", "bg-[#0B0C0E]", true, 2.2, (p) => (
      <BeatCut {...p} />
    )),
    5: def("lens-zoom", "bg-[#0B0C0E]", true, 2.8, (p) => (
      <DriftPunch {...p} />
    )),
    6: def("logo-enter", "bg-black", true, 3, () => <CreditCard />),
  },
  {
    1: def("matrix-decode", "bg-[#0B0C0E]", true, 2.4, (p) => (
      <ScrambleTitle {...p} />
    )),
    2: def("slot-machine-roll", "bg-[#0B0C0E]", true, 2.6, (p) => (
      <Odometer {...p} />
    )),
    3: def("animated-bar-chart", "bg-white", false, 2.2, (p) => (
      <BaselineBars {...p} />
    )),
    4: def("mask-reveal-up", "bg-[#0B0C0E]", true, 2.4, (p) => (
      <PhraseMask {...p} />
    )),
    5: def("slide-swap", "bg-[#0B0C0E]", true, 2.6, (p) => (
      <AnchoredMatch {...p} />
    )),
    6: def("logo-enter", "bg-black", true, 2.6, (p) => <ParticleMark {...p} />),
  },
  {
    1: def("spring-scale-in", "bg-[#EDEEF0]", false, 2.2, (p) => (
      <SteppedShapes {...p} />
    )),
    2: def("rolling-number", "bg-black", true, 2, (p) => (
      <LinearPunch {...p} />
    )),
    3: def("check-list", "bg-[#0B0C0E]", true, 2, (p) => (
      <CascadeRows {...p} />
    )),
    4: def("stretch-in", "bg-[#22C55E]", false, 1.8, (p) => (
      <SlamWords {...p} />
    )),
    5: def("push-through", "bg-black", true, 2.2, (p) => <SplitSeam {...p} />),
    6: def("bauhaus-build", "bg-[#EDEEF0]", false, 2.4, (p) => (
      <ShapeLetters {...p} />
    )),
  },
  {
    1: def("handwrite", "bg-[#FFE27A]", false, 3, (p) => <PushIn {...p} />),
    2: def("rolling-number", "bg-[#A800B7]", true, 3, (p) => (
      <ClonedDigits {...p} />
    )),
    3: def("animated-line-chart", "bg-white", false, 2.4, (p) => (
      <DotMap {...p} />
    )),
    4: def("typewriter", "bg-[#101214]", true, 2.2, (p) => (
      <TerminalCaption {...p} />
    )),
    5: def("whip-pan", "bg-[#F4F4F5]", false, 2.6, (p) => (
      <CursorWhip {...p} />
    )),
    6: def("logo-enter", "bg-[#A800B7]", true, 3.6, (p) => (
      <LayeredMonogram {...p} />
    )),
  },
];
