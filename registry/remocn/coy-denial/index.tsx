"use client";

import { loadFont } from "@remotion/google-fonts/FunnelDisplay";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const funnel = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CoyDenialRound {
  say: string;
  aside: string;
}

export interface CoyDenialProps {
  rounds?: CoyDenialRound[];
  accent?: string;
  /** Text color of the denials; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Funnel Display by default. */
  fontFamily?: string;
  /** Frames between words as a denial rises in. */
  stagger?: number;
  /** Frames the aside stays readable before the round leaves. */
  hold?: number;
  /** Size of the copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_ROUNDS: CoyDenialRound[] = [
  { say: "Nothing is launching on Thursday.", aside: "(Something is.)" },
  { say: "Don’t check the site at nine.", aside: "(Do.)" },
];

const THEMES = {
  dark: { bg: "#0B0B0F", ink: "#FFFFFF", accent: "#B79CFF" },
  light: { bg: "#FAFAFA", ink: "#121216", accent: "#6B4FD8" },
} as const;

const SAY_W = 500;
const ASIDE_W = 400;
const TRACK = -0.035;
const ASIDE_TRACK = -0.01;
const PITCH = 1.0;
const MEASURE_PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.8, 0.2);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const SAY_LEN = 15;
const SAY_STAGGER = 3;
const ASIDE_AT = 48;
const ASIDE_GAP = 7;
const ASIDE_LEN = 10;
const OUT_MIN = 84;
const READ_HOLD = 28;
const ROUND_GAP = 12;
const OUT_LEN = 10;
const MIN_HOLD = 36;

let measureCtx: CanvasRenderingContext2D | null = null;

function em(s: string, weight: number, track: number, family: string) {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("coy-denial: no 2d context");
  measureCtx.font = `${weight} ${MEASURE_PX}px "${family}"`;
  return (
    measureCtx.measureText(s).width / MEASURE_PX + track * Array.from(s).length
  );
}

function useFontsReady(family: string) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("coy-denial: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      funnel.waitUntilDone(),
      document.fonts.load(`${SAY_W} 100px "${family}"`),
      document.fonts.load(`${ASIDE_W} 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle, family]);
  return ready;
}

interface Row {
  words: { text: string; x: number }[];
  w: number;
}

function split(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

function sayW(words: string[], family: string) {
  return em(words.join(" "), SAY_W, TRACK, family);
}

function toRow(
  words: string[],
  weight: number,
  track: number,
  family: string,
): Row {
  const space = em(" ", weight, track, family);
  let x = 0;
  const out = words.map((text) => {
    const at = x;
    x += em(text, weight, track, family) + space;
    return { text, x: at };
  });
  return { words: out, w: em(words.join(" "), weight, track, family) };
}

function balanced(words: string[], n: number, family: string): string[][] {
  if (n <= 1) return [words];
  let best: string[][] = [words];
  let bestW = Number.POSITIVE_INFINITY;
  let bestSlack = Number.POSITIVE_INFINITY;
  const walk = (start: number, left: number, acc: string[][]) => {
    if (left === 1) {
      const rows = [...acc, words.slice(start)];
      const widths = rows.map((r) => sayW(r, family));
      const w = Math.max(...widths);
      const slack = widths.reduce((a, x) => a + (w - x) ** 2, 0);
      if (w < bestW - 0.01 || (w < bestW + 0.01 && slack < bestSlack)) {
        bestW = Math.min(w, bestW);
        bestSlack = slack;
        best = rows;
      }
      return;
    }
    for (let i = start + 1; i <= words.length - left + 1; i++) {
      walk(i, left - 1, [...acc, words.slice(start, i)]);
    }
  };
  walk(0, n, []);
  return best;
}

function wrapAside(s: string, maxEm: number, family: string): Row[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  for (const w of split(s)) {
    const next = [...cur, w];
    if (
      cur.length > 0 &&
      em(next.join(" "), ASIDE_W, ASIDE_TRACK, family) > maxEm
    ) {
      rows.push(cur);
      cur = [w];
    } else {
      cur = next;
    }
  }
  if (cur.length) rows.push(cur);
  return rows.map((r) => toRow(r, ASIDE_W, ASIDE_TRACK, family));
}

function fitSay(
  say: string,
  W: number,
  H: number,
  portrait: boolean,
  family: string,
) {
  const words = split(say);
  const maxN = Math.min(words.length, portrait ? 6 : 3);
  let rows: string[][] = [words];
  let F = 0;
  for (let n = 1; n <= maxN; n++) {
    const cand = balanced(words, n, family);
    const w = Math.max(...cand.map((r) => sayW(r, family)));
    const f = Math.min(
      (W * (portrait ? 0.84 : 0.86)) / w,
      (H * (portrait ? 0.46 : 0.6)) / ((n - 1) * PITCH + 1),
    );
    if (f > F * 1.08) {
      F = f;
      rows = cand;
    }
  }
  return { rows, F };
}

function buildLayout(
  rounds: CoyDenialRound[],
  W: number,
  H: number,
  family: string,
) {
  const portrait = H > W * 1.1;
  const fits = rounds.map((r) => fitSay(r.say, W, H, portrait, family));
  const F = Math.min(...fits.map((f) => f.F));
  const says = fits.map((f) =>
    f.rows.map((r) => toRow(r, SAY_W, TRACK, family)),
  );
  const FA = Math.min(W, H) * (portrait ? 0.05 : 0.046);
  const asides = rounds.map((r) =>
    wrapAside(r.aside, (W * (portrait ? 0.6 : 0.36)) / FA, family),
  );
  return { says, asides, F, FA, portrait };
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

export function CoyDenial({
  rounds = DEFAULT_ROUNDS,
  accent,
  ink,
  background,
  fontFamily = funnel.fontFamily,
  stagger = SAY_STAGGER,
  hold = READ_HOLD,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: CoyDenialProps) {
  const glide = useGlide();
  const frame = Math.max(0, useCurrentFrame() - delay);
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady(fontFamily);

  const layout = useMemo(
    () => (ready ? buildLayout(rounds, W, H, fontFamily) : null),
    [ready, rounds, W, H, fontFamily],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const { F, FA, portrait } = layout;
  const n = layout.says.length;
  const plan = layout.asides.map((rows) => {
    const words = rows.reduce((acc, r) => acc + r.words.length, 0);
    const gap = Math.max(3, Math.min(ASIDE_GAP, 36 / Math.max(1, words)));
    const end = ASIDE_AT + (words - 1) * gap + ASIDE_LEN;
    return { gap, end, out: Math.max(OUT_MIN, end + hold) };
  });
  const starts: number[] = [];
  plan.reduce((acc, p) => {
    starts.push(acc);
    return acc + p.out + ROUND_GAP;
  }, 0);
  const motionEnd = starts[n - 1] + plan[n - 1].end;
  const room = durationInFrames * speed - MIN_HOLD;
  const k = Math.max(0.6, Math.min(1, room / motionEnd));
  const t = (frame * speed) / k;

  const mx = W * (portrait ? 0.08 : 0.065);
  const my = H * (portrait ? 0.07 : 0.1);
  const rowH = F * 1.18;
  const clipTop = -F * 0.06;

  const nodes = layout.says.map((rows, ri) => {
    const s = starts[ri];
    const { gap: aGap, out: outAt } = plan[ri];
    const local = t - s;
    const isLast = ri === n - 1;
    if (local < -2) return null;
    if (!isLast && local > outAt + OUT_LEN + 4) return null;

    const out = isLast
      ? 0
      : interpolate(local, [outAt, outAt + OUT_LEN], [0, 1], {
          ...CLAMP,
          easing: EASE_IN,
        });

    let wi = 0;
    const sayNodes = rows.map((row, li) => (
      <div
        key={`s-${ri}-${li}`}
        style={{
          position: "absolute",
          left: mx - F * 0.1,
          top: my + li * PITCH * F + clipTop,
          width: row.w * F + F * 0.3,
          height: rowH,
          overflow: "hidden",
        }}
      >
        {row.words.map((w) => {
          const i = wi++;
          const q = interpolate(
            local,
            [i * stagger, i * stagger + SAY_LEN],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          const dy = (1 - q) * rowH - out * rowH;
          return (
            <div
              key={`sw-${ri}-${i}`}
              style={{
                position: "absolute",
                left: w.x * F + F * 0.1,
                top: -clipTop,
                height: F,
                fontFamily,
                fontWeight: SAY_W,
                fontSize: F,
                lineHeight: `${F}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color: fg,
                transform: `translateY(${dy}px)${glide(midway(q) || midway(out))}`,
              }}
            >
              {w.text}
            </div>
          );
        })}
      </div>
    ));

    const asideRows = layout.asides[ri];
    const asideFade = isLast
      ? 1
      : interpolate(local, [outAt - 6, outAt + 2], [1, 0], CLAMP);
    let ai = 0;
    const asideNodes = asideRows.flatMap((arow, ar) => {
      const ax = W - mx - arow.w * FA;
      const ay = H - my - FA - (asideRows.length - 1 - ar) * FA * 1.22;
      return arow.words.map((w) => {
        const i = ai++;
        const at = ASIDE_AT + i * aGap;
        const q = interpolate(local, [at, at + ASIDE_LEN], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        return (
          <div
            key={`a-${ri}-${i}`}
            style={{
              position: "absolute",
              left: ax + w.x * FA,
              top: ay,
              height: FA,
              fontFamily,
              fontWeight: ASIDE_W,
              fontSize: FA,
              lineHeight: `${FA}px`,
              letterSpacing: `${ASIDE_TRACK}em`,
              whiteSpace: "pre",
              color: hi,
              opacity: q * asideFade,
              transform: `translateY(${(1 - q) * FA * 0.35}px)${glide(midway(q))}`,
            }}
          >
            {w.text}
          </div>
        );
      });
    });

    return (
      <div key={`r-${ri}`} style={{ position: "absolute", inset: 0 }}>
        {sayNodes}
        {asideNodes}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
