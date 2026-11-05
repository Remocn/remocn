"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { Clip } from "./scenario-scenes";

export const CLIP_DURATION: Record<Clip["kind"], number> = {
  "shader-title": 2.2,
  "type-title": 2.6,
  karaoke: 2.6,
  zoom: 2.4,
  whip: 2.4,
  glitch: 2.4,
  terminal: 2.8,
  rolling: 2.2,
  logo: 2.2,
  bars: 2.2,
  crt: 2.4,
  cursor: 2.8,
  checklist: 2.6,
  "line-chart": 2.4,
  "code-morph": 2.6,
  marker: 2.4,
  stars: 2.4,
  decode: 2.6,
  slot: 2.6,
  "split-flap": 2.8,
  "power-off": 2.8,
  keystroke: 2.4,
  "word-pop": 2.4,
  search: 2.8,
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const CLIP_SURFACE: Record<Clip["kind"], string> = {
  "shader-title": "bg-[#1A0820] text-white",
  "type-title": "bg-[#2A0618] text-white",
  karaoke: "bg-[#0E1012] text-white",
  zoom: "bg-[#141318] text-white",
  whip: "bg-[#0E1012] text-white",
  glitch: "bg-[#0B0D0C] text-white",
  terminal: "bg-[#17191B] text-white",
  rolling: "bg-[#A800B7] text-white",
  logo: "bg-white text-[#0E1012]",
  bars: "bg-white text-[#0E1012]",
  crt: "bg-[#07110B] text-[#9BF5B8]",
  cursor: "bg-[#F4F4F5] text-[#0E1012]",
  checklist: "bg-[#17191B] text-white",
  "line-chart": "bg-white text-[#0E1012]",
  "code-morph": "bg-[#101214] text-[#E4E5E7]",
  marker: "bg-[#0E1012] text-white",
  stars: "bg-white text-[#0E1012]",
  decode: "bg-[#0B0D0C] text-[#9BF5B8]",
  slot: "bg-[#17191B] text-white",
  "split-flap": "bg-[#0E1012] text-white",
  "power-off": "bg-black text-white",
  keystroke: "bg-[#F4F4F5] text-[#0E1012]",
  "word-pop": "bg-[#FBE8FD] text-[#0E1012]",
  search: "bg-white text-[#0E1012]",
};

function Fill({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={style}
    >
      {children}
    </div>
  );
}

function useTicker(
  count: number,
  stepMs: number,
  startMs: number,
  cycle: number,
) {
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    setIndex(-1);
    if (cycle < 0) return;
    let i = -1;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      i = 0;
      setIndex(0);
      interval = setInterval(() => {
        i += 1;
        if (i >= count) {
          clearInterval(interval);
          return;
        }
        setIndex(i);
      }, stepMs);
    }, startMs);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [count, stepMs, startMs, cycle]);
  return index;
}

type ClipProps = { clip: Clip; cycle: number; speed: number };

function ShaderTitle({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "shader-title" }> }) {
  const words = clip.title.split(" ");
  return (
    <Fill
      className="animate-[scene-drift_12s_ease-in-out_infinite_alternate] bg-cover"
      style={{
        backgroundImage: `linear-gradient(180deg, #0A040E99 0%, #0A040E00 60%), url(${clip.image})`,
        backgroundSize: "auto, 180%",
      }}
    >
      <div
        key={cycle}
        className="absolute inset-x-[22px] bottom-5 flex flex-wrap gap-x-[0.24em] text-[30px] leading-8 font-medium tracking-[-0.05em]"
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{
              duration: 0.7 / speed,
              delay: (0.15 + i * 0.12) / speed,
              ease: EASE_OUT,
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </Fill>
  );
}

function TypeTitle({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "type-title" }> }) {
  const typed = useTicker(clip.title.length, 70 / speed, 200 / speed, cycle);
  return (
    <Fill
      className="animate-[scene-drift_12s_ease-in-out_infinite_alternate] bg-cover"
      style={{
        backgroundImage: `linear-gradient(180deg, #2A061866 0%, #2A061800 60%), url(${clip.image})`,
        backgroundSize: "auto, 180%",
      }}
    >
      <div className="absolute inset-x-[22px] bottom-5 text-[28px] leading-8 font-medium tracking-[-0.05em]">
        {clip.title.slice(0, typed + 1)}
        <span className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] animate-[caret-blink_1.06s_steps(1)_infinite] bg-white" />
      </div>
    </Fill>
  );
}

function Karaoke({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "karaoke" }> }) {
  const layoutKey = useId();
  const active = useTicker(clip.words.length, 380 / speed, 250 / speed, cycle);
  return (
    <Fill>
      <div className="absolute inset-x-[22px] bottom-[22px] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[24px] leading-[30px] font-semibold tracking-[-0.03em]">
        {clip.words.map((word, i) => (
          <span key={`${word}-${i}`} className="relative px-1">
            {active === i && (
              <motion.span
                layoutId={`karaoke-${layoutKey}`}
                transition={{
                  type: "spring",
                  visualDuration: 0.22 / speed,
                  bounce: 0.15,
                }}
                className="absolute inset-0 -z-0 rounded-tile bg-[#F0ABFC]"
              />
            )}
            <span
              className={cn(
                "relative transition-colors duration-150",
                active === i
                  ? "text-[#0E1012]"
                  : i < active
                    ? "text-white"
                    : "text-white/35",
              )}
            >
              {word}
            </span>
          </span>
        ))}
      </div>
    </Fill>
  );
}

function TwoFrames({
  frames,
  cycle,
  speed,
  exit,
  enter,
  classNames,
}: {
  frames: [string, string];
  cycle: number;
  speed: number;
  exit: Record<string, number[] | string[]>;
  enter: Record<string, number[] | string[]>;
  classNames: [string, string];
}) {
  const duration = 2 / speed;
  const times = [0, 0.45, 0.62, 1];
  return (
    <div key={cycle} className="absolute inset-0">
      <motion.div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          classNames[0],
        )}
        animate={exit}
        transition={{ duration, times, ease: "easeInOut" }}
      >
        <span className="text-[44px] leading-none font-semibold tracking-[-0.05em]">
          {frames[0]}
        </span>
      </motion.div>
      <motion.div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          classNames[1],
        )}
        animate={enter}
        transition={{ duration, times, ease: "easeInOut" }}
      >
        <span className="text-[44px] leading-none font-semibold tracking-[-0.05em]">
          {frames[1]}
        </span>
      </motion.div>
    </div>
  );
}

function Zoom({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "zoom" }> }) {
  return (
    <Fill>
      <TwoFrames
        frames={clip.frames}
        cycle={cycle}
        speed={speed}
        classNames={["bg-[#141318]", "bg-[#1C1A24]"]}
        exit={{
          opacity: [1, 1, 0, 0],
          scale: [1, 1.04, 1.22, 1.22],
          filter: ["blur(0px)", "blur(0px)", "blur(10px)", "blur(10px)"],
        }}
        enter={{
          opacity: [0, 0, 1, 1],
          scale: [0.88, 0.88, 1, 1],
          filter: ["blur(10px)", "blur(10px)", "blur(0px)", "blur(0px)"],
        }}
      />
    </Fill>
  );
}

function Whip({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "whip" }> }) {
  return (
    <Fill>
      <TwoFrames
        frames={clip.frames}
        cycle={cycle}
        speed={speed}
        classNames={["bg-[#0E1012]", "bg-[#A800B7]"]}
        exit={{
          x: ["0%", "0%", "-110%", "-110%"],
          filter: ["blur(0px)", "blur(0px)", "blur(6px)", "blur(6px)"],
        }}
        enter={{
          x: ["110%", "110%", "0%", "0%"],
          filter: ["blur(6px)", "blur(6px)", "blur(0px)", "blur(0px)"],
        }}
      />
    </Fill>
  );
}

function Glitch({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "glitch" }> }) {
  const slices = [0, 1, 2, 3];
  return (
    <Fill>
      <div
        key={cycle}
        className="absolute inset-0 flex items-center justify-center"
      >
        {slices.map((slice) => (
          <motion.span
            key={slice}
            aria-hidden="true"
            className="absolute text-[52px] leading-none font-black tracking-[-0.04em] text-white"
            style={{
              clipPath: `inset(${slice * 25}% 0 ${75 - slice * 25}% 0)`,
            }}
            animate={{
              x: [0, 0, slice % 2 ? 9 : -11, slice % 2 ? -4 : 6, 0, 0],
              color: [
                "#FFFFFF",
                "#FFFFFF",
                slice % 2 ? "#86EFAC" : "#F0ABFC",
                "#FFFFFF",
                "#FFFFFF",
                "#FFFFFF",
              ],
            }}
            transition={{
              duration: 1.6 / speed,
              times: [0, 0.4, 0.46, 0.52, 0.58, 1],
              ease: "linear",
            }}
          >
            {clip.text}
          </motion.span>
        ))}
      </div>
    </Fill>
  );
}

function Terminal({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "terminal" }> }) {
  const typed = useTicker(clip.command.length, 45 / speed, 200 / speed, cycle);
  const done = typed >= clip.command.length - 1;
  return (
    <Fill className="px-[18px] pt-4">
      <div className="flex flex-col gap-[5px] font-mono text-micro">
        <span className="text-[#9AA3A7]">
          $ {clip.command.slice(0, typed + 1)}
          {!done && (
            <span className="ml-px inline-block h-3 w-[6px] translate-y-0.5 bg-[#9AA3A7]" />
          )}
        </span>
        {done && (
          <motion.span
            key={cycle}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3 / speed,
              delay: 0.35 / speed,
              ease: EASE_OUT,
            }}
            className="text-[#86EFAC]"
          >
            ✓ {clip.result}
          </motion.span>
        )}
      </div>
    </Fill>
  );
}

function Rolling({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "rolling" }> }) {
  const value = useMotionValue(0);
  const text = useTransform(value, (v) =>
    Math.round(v).toLocaleString("en-US"),
  );
  useEffect(() => {
    if (cycle < 0) return;
    value.jump(0);
    const controls = animate(value, clip.to, {
      duration: 1.4 / speed,
      delay: 0.15 / speed,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [cycle, clip.to, speed, value]);
  return (
    <Fill className="px-[18px]">
      <motion.div className="absolute bottom-4 left-[18px] text-[52px] leading-[52px] font-medium tracking-[-0.06em] tabular-nums">
        {text}
      </motion.div>
    </Fill>
  );
}

function Logo({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "logo" }> }) {
  return (
    <Fill>
      <div
        key={cycle}
        className="absolute inset-0 flex items-center justify-center gap-1.5"
      >
        <motion.span
          className="size-[22px] shrink-0 rounded-[7px] bg-cover bg-[position:30%]"
          style={{ backgroundImage: `url(${clip.image})` }}
          initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            visualDuration: 0.45 / speed,
            bounce: 0.35,
            delay: 0.15 / speed,
          }}
        />
        <span className="flex overflow-hidden text-[22px] leading-6 font-semibold tracking-[-0.05em]">
          {clip.name.split("").map((letter, i) => (
            <motion.span
              key={`${letter}-${i}`}
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{
                duration: 0.5 / speed,
                delay: (0.35 + i * 0.05) / speed,
                ease: EASE_OUT,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      </div>
    </Fill>
  );
}

function Bars({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "bars" }> }) {
  const max = Math.max(...clip.values);
  return (
    <Fill className="px-[22px]">
      <span className="absolute top-9 left-[22px] text-caption text-[#6B7A80]">
        {clip.label}
      </span>
      <div
        key={cycle}
        className="absolute inset-x-[22px] bottom-5 flex h-[86px] items-end gap-2"
      >
        {clip.values.map((v, i) => (
          <motion.span
            key={`${v}-${i}`}
            className={cn(
              "flex-1 origin-bottom rounded-[4px]",
              i === clip.values.length - 1 ? "bg-[#A800B7]" : "bg-[#F0ABFC]",
            )}
            style={{ height: `${(v / max) * 100}%` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              type: "spring",
              visualDuration: 0.5 / speed,
              bounce: 0.2,
              delay: (0.15 + i * 0.08) / speed,
            }}
          />
        ))}
      </div>
    </Fill>
  );
}

function Crt({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "crt" }> }) {
  return (
    <Fill>
      <motion.div
        key={cycle}
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scaleY: 0.02, opacity: 0.4, filter: "brightness(3)" }}
        animate={{ scaleY: 1, opacity: 1, filter: "brightness(1)" }}
        transition={{
          duration: 0.45 / speed,
          delay: 0.15 / speed,
          ease: EASE_OUT,
        }}
      >
        <span className="text-[46px] leading-none font-bold tracking-[0.02em] [text-shadow:-2px_0_#F0ABFC99,2px_0_#22C55E99]">
          {clip.text}
        </span>
      </motion.div>
      <span className="pointer-events-none absolute inset-0 animate-[tile-scan_0.6s_linear_infinite] bg-[repeating-linear-gradient(0deg,#00000059_0_2px,transparent_2px_4px)]" />
    </Fill>
  );
}

function Cursor({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "cursor" }> }) {
  const d = (s: number) => s / speed;
  return (
    <Fill>
      <div
        key={cycle}
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.span
          className="rounded-[10px] px-4 py-2 text-small font-medium"
          initial={{ backgroundColor: "#0E1012", color: "#FFFFFF", scale: 1 }}
          animate={{
            scale: [1, 1, 0.94, 1],
            backgroundColor: ["#0E1012", "#0E1012", "#0E1012", "#22C55E"],
          }}
          transition={{
            duration: d(1.6),
            times: [0, 0.62, 0.7, 0.82],
            ease: "easeOut",
          }}
        >
          {clip.label}
        </motion.span>
        <motion.svg
          viewBox="0 0 24 24"
          className="absolute size-5 text-[#0E1012]"
          initial={{ x: 60, y: 46, opacity: 0 }}
          animate={{
            x: [60, 60, 12, 12],
            y: [46, 46, 8, 8],
            opacity: [0, 1, 1, 1],
            scale: [1, 1, 1, 0.85],
          }}
          transition={{
            duration: d(1.2),
            times: [0, 0.15, 0.8, 1],
            ease: EASE_OUT,
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
      </div>
    </Fill>
  );
}

function Checklist({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "checklist" }> }) {
  return (
    <Fill className="px-[18px] pt-4">
      <ul key={cycle} className="flex flex-col gap-2">
        {clip.items.map((item, i) => (
          <motion.li
            key={item}
            className="flex items-center gap-2 text-small"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.35 / speed,
              delay: (0.1 + i * 0.3) / speed,
              ease: EASE_OUT,
            }}
          >
            <span className="flex size-4 items-center justify-center rounded-[5px] bg-[#22C55E]">
              <svg viewBox="0 0 24 24" className="size-3 text-white">
                <motion.path
                  d="M20 6 9 17l-5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 0.3 / speed,
                    delay: (0.3 + i * 0.3) / speed,
                    ease: EASE_OUT,
                  }}
                />
              </svg>
            </span>
            {item}
          </motion.li>
        ))}
      </ul>
    </Fill>
  );
}

function LineChart({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "line-chart" }> }) {
  const path = "M4 64 C 30 58, 44 40, 70 44 S 116 22, 140 26 S 186 6, 216 8";
  return (
    <Fill className="px-[22px]">
      <div className="absolute top-9 left-[22px] flex items-baseline gap-2">
        <span className="text-caption text-[#6B7A80]">{clip.label}</span>
        <motion.span
          key={cycle}
          className="text-caption font-medium text-[#16A34A]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3 / speed,
            delay: 1.1 / speed,
            ease: EASE_OUT,
          }}
        >
          {clip.delta}
        </motion.span>
      </div>
      <svg
        key={cycle}
        viewBox="0 0 220 72"
        className="absolute inset-x-[18px] bottom-4 h-[72px] w-[calc(100%-36px)] overflow-visible"
      >
        <motion.path
          d={path}
          fill="none"
          stroke="#A800B7"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.1 / speed,
            delay: 0.15 / speed,
            ease: [0.65, 0, 0.35, 1],
          }}
        />
        <motion.circle
          cx="216"
          cy="8"
          r="5"
          fill="#A800B7"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.4, 1] }}
          transition={{
            duration: 0.45 / speed,
            delay: 1.2 / speed,
            ease: EASE_OUT,
          }}
        />
      </svg>
    </Fill>
  );
}

function CodeMorph({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "code-morph" }> }) {
  const [morphed, setMorphed] = useState(false);
  useEffect(() => {
    setMorphed(false);
    if (cycle < 0) return;
    const id = setTimeout(() => setMorphed(true), 900 / speed);
    return () => clearTimeout(id);
  }, [cycle, speed]);
  const value = morphed ? clip.to : clip.from;
  return (
    <Fill className="px-[18px] pt-[18px] font-mono text-[12px] leading-5">
      <div className="text-[#6B7A80]">{"{"}</div>
      <div className="flex pl-4">
        <span className="text-[#E4E5E7]">"{clip.key}":&nbsp;</span>
        <span className="text-[#99FFE4]">"</span>
        <span className="relative flex">
          {value.split("").map((char, i) => (
            <span key={i} className="relative inline-flex overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={`${char}-${i}-${morphed}`}
                  className={
                    morphed && clip.from[i] !== clip.to[i]
                      ? "text-[#FFC799]"
                      : "text-[#99FFE4]"
                  }
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{
                    duration: 0.35 / speed,
                    delay: (i * 0.03) / speed,
                    ease: EASE_OUT,
                  }}
                >
                  {char}
                </motion.span>
              </AnimatePresence>
            </span>
          ))}
        </span>
        <span className="text-[#99FFE4]">"</span>
      </div>
      <div className="text-[#6B7A80]">{"}"}</div>
    </Fill>
  );
}

function Marker({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "marker" }> }) {
  return (
    <Fill>
      <div
        key={cycle}
        className="absolute inset-x-[22px] bottom-[22px] flex flex-wrap items-center gap-x-2 text-[24px] leading-[32px] font-semibold tracking-[-0.03em]"
      >
        {clip.words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="relative"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35 / speed,
              delay: (0.1 + i * 0.1) / speed,
              ease: EASE_OUT,
            }}
          >
            {i === clip.marked && (
              <motion.span
                className="absolute inset-x-[-4px] bottom-[3px] -z-0 h-[14px] origin-left rounded-[3px] bg-[#A800B7]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 0.45 / speed,
                  delay: 0.9 / speed,
                  ease: [0.65, 0, 0.35, 1],
                }}
              />
            )}
            <span className="relative">{word}</span>
          </motion.span>
        ))}
      </div>
    </Fill>
  );
}

function Stars({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "stars" }> }) {
  return (
    <Fill>
      <div
        key={cycle}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="size-9 text-[#F5B400]"
          initial={{ scale: 0, rotate: -60 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            visualDuration: 0.5 / speed,
            bounce: 0.45,
            delay: 0.15 / speed,
          }}
        >
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
            fill="currentColor"
          />
        </motion.svg>
        <motion.span
          className="text-[26px] leading-7 font-semibold tracking-[-0.04em]"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.5 / speed,
            delay: 0.5 / speed,
            ease: EASE_OUT,
          }}
        >
          {clip.count}
        </motion.span>
        <motion.span
          className="text-caption text-[#6B7A80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 / speed, delay: 0.75 / speed }}
        >
          GitHub stars
        </motion.span>
      </div>
    </Fill>
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*";

function Decode({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "decode" }> }) {
  const [text, setText] = useState(clip.text);
  useEffect(() => {
    if (cycle < 0) return;
    let frame = 0;
    const total = clip.text.length;
    const id = setInterval(() => {
      frame += 1;
      const settled = Math.floor(frame / 2);
      setText(
        clip.text
          .split("")
          .map((char, i) =>
            char === " " || i < settled
              ? char
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(""),
      );
      if (settled > total) clearInterval(id);
    }, 45 / speed);
    return () => clearInterval(id);
  }, [cycle, clip.text, speed]);
  return (
    <Fill className="flex items-center px-[18px]">
      <span className="font-mono text-[20px] leading-6 tracking-[0.04em]">
        {text}
      </span>
    </Fill>
  );
}

function Slot({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "slot" }> }) {
  return (
    <Fill>
      <div
        key={cycle}
        className="absolute inset-x-[18px] top-1/2 flex -translate-y-1/2 gap-1.5"
      >
        {clip.digits.split("").map((digit, i) => {
          const spins = 10 + i * 4 + Number(digit);
          return (
            <span
              key={i}
              className="relative h-[52px] flex-1 overflow-hidden rounded-[8px] bg-[#0E1012] shadow-[inset_0_0_0_1px_#FFFFFF14]"
            >
              <motion.span
                className="absolute inset-x-0 top-0 flex flex-col items-center"
                initial={{ y: 0 }}
                animate={{ y: -spins * 52 }}
                transition={{
                  duration: (1 + i * 0.25) / speed,
                  delay: 0.1 / speed,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {Array.from({ length: spins + 1 }, (_, n) => (
                  <span
                    key={n}
                    className="flex h-[52px] items-center text-[34px] font-semibold tabular-nums"
                  >
                    {n % 10}
                  </span>
                ))}
              </motion.span>
            </span>
          );
        })}
      </div>
    </Fill>
  );
}

function SplitFlap({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "split-flap" }> }) {
  const [letters, setLetters] = useState(clip.text.split("").map(() => " "));
  useEffect(() => {
    if (cycle < 0) return;
    let tick = 0;
    const id = setInterval(() => {
      tick += 1;
      setLetters(
        clip.text
          .split("")
          .map((char, i) =>
            tick > 6 + i * 3 ? char : GLYPHS[(tick * 7 + i * 3) % 26],
          ),
      );
      if (tick > 6 + clip.text.length * 3) clearInterval(id);
    }, 70 / speed);
    return () => clearInterval(id);
  }, [cycle, clip.text, speed]);
  return (
    <Fill>
      <div className="absolute inset-x-[22px] bottom-[22px] flex gap-1.5">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="relative flex h-[58px] w-[44px] items-center justify-center overflow-hidden rounded-[6px] bg-[#1F2226] text-[34px] font-bold"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={letter}
                initial={{ rotateX: -90, opacity: 0.4 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0.4 }}
                transition={{ duration: 0.06 / speed }}
              >
                {letter}
              </motion.span>
            </AnimatePresence>
            <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
          </span>
        ))}
      </div>
    </Fill>
  );
}

function PowerOff({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "power-off" }> }) {
  const d = 1.8 / speed;
  return (
    <Fill>
      <motion.div
        key={cycle}
        className="absolute inset-0 flex items-center justify-center bg-cover"
        style={{
          backgroundImage: "url(/landing/shader-why.png)",
          backgroundPosition: "50%",
        }}
        animate={{
          scaleY: [1, 1, 0.012, 0.012, 1],
          scaleX: [1, 1, 1, 0.02, 1],
          filter: [
            "brightness(1)",
            "brightness(1)",
            "brightness(3)",
            "brightness(4)",
            "brightness(1)",
          ],
        }}
        transition={{
          duration: d,
          times: [0, 0.35, 0.5, 0.62, 1],
          ease: "easeInOut",
        }}
      >
        <span className="text-[26px] font-semibold tracking-[-0.04em] text-white">
          {clip.name}
        </span>
      </motion.div>
    </Fill>
  );
}

function Keystroke({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "keystroke" }> }) {
  return (
    <Fill>
      <div
        key={cycle}
        className="absolute inset-x-[18px] top-[34px] flex items-center gap-2"
      >
        {clip.keys.map((key, i) => (
          <motion.span
            key={key}
            className="flex h-11 min-w-11 items-center justify-center rounded-[9px] bg-white px-3 text-[20px] font-medium shadow-[0_0_0_1px_#0E10121A,0_3px_0_#0E10121F]"
            animate={{
              y: [0, 0, 3, 3, 0],
              boxShadow: [
                "0 0 0 1px #0E10121A, 0 3px 0 #0E10121F",
                "0 0 0 1px #0E10121A, 0 3px 0 #0E10121F",
                "0 0 0 1px #0E10121A, 0 0px 0 #0E10121F",
                "0 0 0 1px #0E10121A, 0 0px 0 #0E10121F",
                "0 0 0 1px #0E10121A, 0 3px 0 #0E10121F",
              ],
            }}
            transition={{
              duration: 1.2 / speed,
              times: [0, 0.2 + i * 0.12, 0.28 + i * 0.12, 0.7, 0.85],
              ease: "easeOut",
            }}
          >
            {key}
          </motion.span>
        ))}
        <motion.span
          className="ml-1 text-small text-[#6B7A80]"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.3 / speed,
            delay: 0.55 / speed,
            ease: EASE_OUT,
          }}
        >
          {clip.label}
        </motion.span>
      </div>
    </Fill>
  );
}

function WordPop({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "word-pop" }> }) {
  return (
    <Fill>
      <div
        key={cycle}
        className="absolute inset-x-[22px] bottom-[22px] flex flex-wrap items-center gap-x-1.5 text-[24px] leading-[30px] font-semibold tracking-[-0.03em]"
      >
        {clip.words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              visualDuration: 0.35 / speed,
              bounce: 0.45,
              delay: (0.15 + i * 0.22) / speed,
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </Fill>
  );
}

function Search({
  clip,
  cycle,
  speed,
}: ClipProps & { clip: Extract<Clip, { kind: "search" }> }) {
  const typed = useTicker(clip.query.length, 80 / speed, 200 / speed, cycle);
  const done = typed >= clip.query.length - 1;
  return (
    <Fill className="px-3 pt-4">
      <div className="flex h-8 items-center gap-1.5 rounded-[9px] bg-[#F4F4F5] px-2.5 text-caption">
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 text-[#6B7A80]">
          <circle
            cx="11"
            cy="11"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <path
            d="M20 20l-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
        <span className="truncate">{clip.query.slice(0, typed + 1)}</span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {done &&
          clip.results.map((result, i) => (
            <motion.span
              key={`${result}-${cycle}`}
              className="rounded-[8px] bg-[#FBE8FD] px-2.5 py-2 text-caption"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35 / speed,
                delay: (0.15 + i * 0.12) / speed,
                ease: EASE_OUT,
              }}
            >
              {result}
            </motion.span>
          ))}
      </div>
    </Fill>
  );
}

export function ClipView(props: ClipProps) {
  const { clip } = props;
  switch (clip.kind) {
    case "shader-title":
      return <ShaderTitle {...props} clip={clip} />;
    case "type-title":
      return <TypeTitle {...props} clip={clip} />;
    case "karaoke":
      return <Karaoke {...props} clip={clip} />;
    case "zoom":
      return <Zoom {...props} clip={clip} />;
    case "whip":
      return <Whip {...props} clip={clip} />;
    case "glitch":
      return <Glitch {...props} clip={clip} />;
    case "terminal":
      return <Terminal {...props} clip={clip} />;
    case "rolling":
      return <Rolling {...props} clip={clip} />;
    case "logo":
      return <Logo {...props} clip={clip} />;
    case "bars":
      return <Bars {...props} clip={clip} />;
    case "crt":
      return <Crt {...props} clip={clip} />;
    case "cursor":
      return <Cursor {...props} clip={clip} />;
    case "checklist":
      return <Checklist {...props} clip={clip} />;
    case "line-chart":
      return <LineChart {...props} clip={clip} />;
    case "code-morph":
      return <CodeMorph {...props} clip={clip} />;
    case "marker":
      return <Marker {...props} clip={clip} />;
    case "stars":
      return <Stars {...props} clip={clip} />;
    case "decode":
      return <Decode {...props} clip={clip} />;
    case "slot":
      return <Slot {...props} clip={clip} />;
    case "split-flap":
      return <SplitFlap {...props} clip={clip} />;
    case "power-off":
      return <PowerOff {...props} clip={clip} />;
    case "keystroke":
      return <Keystroke {...props} clip={clip} />;
    case "word-pop":
      return <WordPop {...props} clip={clip} />;
    case "search":
      return <Search {...props} clip={clip} />;
  }
}
