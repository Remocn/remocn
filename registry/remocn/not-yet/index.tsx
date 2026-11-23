"use client";

import { loadFont } from "@remotion/google-fonts/GolosText";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const golos = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface NotYetProps {
  lines?: string[];
  word?: string;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines. Load it yourself; Golos Text by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames between words as a line builds. */
  stagger?: number;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#1D2B53", ink: "#FFFFFF", accent: "#FFB38A", rule: 0.22 },
  light: { bg: "#FFF4EC", ink: "#1D2B53", accent: "#D9623B", rule: 0.2 },
} as const;

const DEFAULT_LINES = [
  "It can’t write your script.",
  "It can’t pick your music.",
  "It can’t voice your launch.",
];

const WORD_GAP = 3;
const WORD_RISE = 12;
const YET_PAUSE = 9;
const YET_HOLD = 20;
const STEP_DUR = 16;
const OLD_SCALE = 0.58;
const OLD_INK = 0.4;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_STEP = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function splitWords(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

function schedule(lines: string[][], stagger: number) {
  const starts: number[] = [];
  const yets: number[] = [];
  let at = 0;
  for (const words of lines) {
    starts.push(at);
    const set =
      (at === 0 ? 0 : STEP_DUR - 6) +
      2 +
      (words.length - 1) * stagger +
      WORD_RISE;
    const yet = at + set + YET_PAUSE;
    yets.push(yet);
    at = yet + YET_HOLD;
  }
  const end = (yets[yets.length - 1] ?? 0) + 10;
  return { starts, yets, end };
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function NotYet({
  lines = DEFAULT_LINES,
  word = "Yet.",
  accent,
  ink,
  background,
  fontFamily = golos.fontFamily,
  fontWeight = 500,
  stagger = WORD_GAP,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: NotYetProps) {
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const wordLines = lines.map(splitWords);
  const plan = schedule(wordLines, stagger);
  const pace = Math.max(1, (plan.end + 30) / Math.max(1, durationInFrames));
  const t = frame * speed * pace;

  const portrait = H > W * 1.1;
  const margin = W * (portrait ? 0.08 : 0.07);
  const size = Math.min(H * 0.105, W * (portrait ? 0.125 : 0.063));
  const baseline = H * (portrait ? 0.7 : 0.765);
  const blockW = W - margin * 2;
  const gap = size * 0.34;

  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [handle] = useState(() => delayRender("not-yet: measuring"));
  const released = useRef(false);
  const [fontsOk, setFontsOk] = useState(false);
  const [heights, setHeights] = useState<number[] | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      golos.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setFontsOk(true);
      });
    return () => {
      live = false;
    };
  }, [fontFamily, fontWeight]);

  useLayoutEffect(() => {
    if (!fontsOk) return;
    const next = wordLines.map((_, i) => refs.current[i]?.offsetHeight ?? 0);
    setHeights((prev) =>
      prev && prev.length === next.length && prev.every((v, i) => v === next[i])
        ? prev
        : next,
    );
  });

  useEffect(() => {
    if (heights && !released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [heights, handle]);

  const stepsAt = (tt: number) =>
    wordLines.map((_, i) =>
      i === 0
        ? 1
        : interpolate(tt, [plan.starts[i], plan.starts[i] + STEP_DUR], [0, 1], {
            ...CLAMP,
            easing: EASE_STEP,
          }),
    );
  const agesOf = (steps: number[]) =>
    wordLines.map((_, i) => {
      let a = 0;
      for (let j = i + 1; j < wordLines.length; j++) a += steps[j];
      return a;
    });
  const stepIn = stepsAt(t);
  const ages = agesOf(stepIn);
  const scaleOf = (a: number) => interpolate(a, [0, 1], [1, OLD_SCALE], CLAMP);
  const liftOf = (i: number, steps: number[]) => {
    if (!heights) return 0;
    const ag = agesOf(steps);
    let lift = 0;
    for (let j = i + 1; j < wordLines.length; j++) {
      lift += (heights[j] * scaleOf(ag[j]) + gap) * steps[j];
    }
    return lift;
  };
  // Where a line is headed: every step under way counted as done. At rest it
  // is the live lift exactly.
  const landing = stepIn.map((v) => (v > 0 ? 1 : 0));
  // A line moves while its lift or its scale changes against either
  // neighbouring frame by more than a thousandth of a pixel.
  const lineMoving = (i: number) => {
    const at = (tt: number) => {
      const steps = stepsAt(tt);
      return [liftOf(i, steps), scaleOf(agesOf(steps)[i]) * blockW];
    };
    const [now, prev, next] = [
      at(t),
      at(t - speed * pace),
      at(t + speed * pace),
    ];
    return now.some(
      (v, k) => Math.abs(next[k] - v) > 1e-3 || Math.abs(v - prev[k]) > 1e-3,
    );
  };

  const ruleIn = interpolate(t, [0, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const rise = (start: number, dur = WORD_RISE) =>
    interpolate(t, [start, start + dur], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const text: React.CSSProperties = {
    fontFamily,
    fontWeight,
    fontSize: size,
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: margin,
            top: baseline + size * 0.2,
            width: blockW,
            height: Math.max(1, Math.round(H * 0.0018)),
            background: fg,
            opacity: c.rule,
            transformOrigin: "0 50%",
            transform: `scaleX(${ruleIn.toFixed(4)})`,
          }}
        />
        {wordLines.map((words, i) => {
          const a = ages[i];
          const sc = scaleOf(a);
          const lift = liftOf(i, stepIn);
          // Laid out where the line lands; the climb there is a transform,
          // since layout rounds a baseline to whole pixels and a line eased by
          // `bottom` clicks up pixel by pixel.
          const liftRest = liftOf(i, landing);
          const climb = liftRest - lift;
          const moving = lineMoving(i);
          const inkAlpha = interpolate(a, [0, 1], [1, OLD_INK], CLAMP);
          const gone = interpolate(a, [2.2, 3], [1, 0], CLAMP);
          const s0 = plan.starts[i] + (i === 0 ? 0 : STEP_DUR - 6);
          const yetT = interpolate(
            t,
            [plan.yets[i], plan.yets[i] + 8],
            [0, 1],
            {
              ...CLAMP,
              easing: EASE_OUT,
            },
          );
          return (
            <div
              key={`${i}-${words.join(" ")}`}
              ref={(el) => {
                refs.current[i] = el;
              }}
              style={{
                ...text,
                position: "absolute",
                left: margin,
                bottom: H - baseline + liftRest,
                width: blockW,
                transformOrigin: "0 100%",
                transform: `${Math.abs(climb) < 1e-3 ? "" : `translateY(${climb}px) `}scale(${sc.toFixed(4)})${glide(moving)}`,
                opacity: heights ? gone : 0,
                textWrap: "balance",
              }}
            >
              {words.map((w, wi) => {
                const p = rise(s0 + 2 + wi * stagger);
                const riseAt = (tt: number) =>
                  interpolate(
                    tt,
                    [s0 + 2 + wi * stagger, s0 + 2 + wi * stagger + WORD_RISE],
                    [0, 1],
                    { ...CLAMP, easing: EASE_OUT },
                  );
                const rising =
                  !moving &&
                  (Math.abs(riseAt(t + speed * pace) - p) * 0.3 * size > 1e-3 ||
                    Math.abs(p - riseAt(t - speed * pace)) * 0.3 * size > 1e-3);
                return (
                  <span
                    key={`${wi}-${w}`}
                    style={{
                      display: "inline-block",
                      marginRight: "0.24em",
                      color: fg,
                      opacity: p * inkAlpha,
                      transform: `translateY(${((1 - p) * 0.3).toFixed(3)}em)${glide(rising)}`,
                    }}
                  >
                    {w}
                  </span>
                );
              })}
              <span
                style={{
                  display: "inline-block",
                  color: hi,
                  opacity: yetT,
                  transform: `translateX(${((1 - yetT) * 0.35).toFixed(3)}em)`,
                }}
              >
                {word}
              </span>
            </div>
          );
        })}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
