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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const golos = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface NotYetProps {
  lines?: string[];
  word?: string;
  accent?: string;
  background?: string;
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

function schedule(lines: string[][]) {
  const starts: number[] = [];
  const yets: number[] = [];
  let at = 0;
  for (const words of lines) {
    starts.push(at);
    const set =
      (at === 0 ? 0 : STEP_DUR - 6) +
      2 +
      (words.length - 1) * WORD_GAP +
      WORD_RISE;
    const yet = at + set + YET_PAUSE;
    yets.push(yet);
    at = yet + YET_HOLD;
  }
  const end = (yets[yets.length - 1] ?? 0) + 10;
  return { starts, yets, end };
}

export function NotYet({
  lines = DEFAULT_LINES,
  word = "Yet.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: NotYetProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const wordLines = lines.map(splitWords);
  const plan = schedule(wordLines);
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
      document.fonts.load(`500 100px "${golos.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setFontsOk(true);
      });
    return () => {
      live = false;
    };
  }, []);

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

  const stepIn = wordLines.map((_, i) =>
    i === 0
      ? 1
      : interpolate(t, [plan.starts[i], plan.starts[i] + STEP_DUR], [0, 1], {
          ...CLAMP,
          easing: EASE_STEP,
        }),
  );
  const ages = wordLines.map((_, i) => {
    let a = 0;
    for (let j = i + 1; j < wordLines.length; j++) a += stepIn[j];
    return a;
  });
  const scaleOf = (a: number) => interpolate(a, [0, 1], [1, OLD_SCALE], CLAMP);

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
    fontFamily: golos.fontFamily,
    fontWeight: 500,
    fontSize: size,
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: margin,
          top: baseline + size * 0.2,
          width: blockW,
          height: Math.max(1, Math.round(H * 0.0018)),
          background: c.ink,
          opacity: c.rule,
          transformOrigin: "0 50%",
          transform: `scaleX(${ruleIn.toFixed(4)})`,
        }}
      />
      {wordLines.map((words, i) => {
        const a = ages[i];
        const sc = scaleOf(a);
        let lift = 0;
        if (heights) {
          for (let j = i + 1; j < wordLines.length; j++) {
            lift += (heights[j] * scaleOf(ages[j]) + gap) * stepIn[j];
          }
        }
        const inkAlpha = interpolate(a, [0, 1], [1, OLD_INK], CLAMP);
        const gone = interpolate(a, [2.2, 3], [1, 0], CLAMP);
        const s0 = plan.starts[i] + (i === 0 ? 0 : STEP_DUR - 6);
        const yetT = interpolate(t, [plan.yets[i], plan.yets[i] + 8], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
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
              bottom: H - baseline + lift,
              width: blockW,
              transformOrigin: "0 100%",
              transform: `scale(${sc.toFixed(4)})`,
              opacity: heights ? gone : 0,
              textWrap: "balance",
            }}
          >
            {words.map((w, wi) => {
              const p = rise(s0 + 2 + wi * WORD_GAP);
              return (
                <span
                  key={`${wi}-${w}`}
                  style={{
                    display: "inline-block",
                    marginRight: "0.24em",
                    color: c.ink,
                    opacity: p * inkAlpha,
                    transform: `translateY(${((1 - p) * 0.3).toFixed(3)}em)`,
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
    </AbsoluteFill>
  );
}
