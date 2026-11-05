"use client";

import { loadVariableFont } from "@remotion/google-fonts/Urbanist";
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

const urbanist = loadVariableFont("normal", { subsets: ["latin"] });

export interface TwoHitProps {
  before?: string;
  after?: string;
  hitAt?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0B0B0B", ink: "#FFFFFF", blue: "#2F6BFF" },
  light: { bg: "#FFFFFF", ink: "#0A0A0A", blue: "#1F4FE0" },
} as const;

const WGHT = 400;
const REST = -0.035;
const FIRST_GAIN = 0.32;
const MAX_TRACK = 0.75;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_ATTACK = Easing.bezier(0.2, 0.9, 0.3, 1);
const EASE_RELEASE = Easing.bezier(0.45, 0, 0.15, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  widths: number[][];
  baseline: number;
  cap: number;
}

function measure(phrases: string[][]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let widths = phrases.map((lines) => lines.map((l) => l.length * 0.5));
  let baseline = 0.8;
  let cap = 0.7;
  if (ctx) {
    ctx.font = `${WGHT} 200px "${urbanist.fontFamily}"`;
    widths = phrases.map((lines) =>
      lines.map((l) => ctx.measureText(l).width / 200),
    );
    const fm = ctx.measureText("H");
    const asc = fm.fontBoundingBoxAscent / 200;
    const desc = fm.fontBoundingBoxDescent / 200;
    baseline = (1 - (asc + desc)) / 2 + asc;
    cap = fm.actualBoundingBoxAscent / 200;
  }
  return { widths, baseline, cap };
}

function useMetrics(phrases: string[][]) {
  const key = phrases.map((l) => l.join("\u0002")).join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("two-hit: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const list = key.split("\u0001").map((l) => l.split("\u0002"));
    Promise.all([
      urbanist.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${urbanist.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(list) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.m : null;
}

function pulse(x: number, attack: number, hold: number, release: number) {
  if (x <= 0) return 0;
  if (x < attack) return EASE_ATTACK(x / attack);
  if (x < attack + hold) return 1;
  return 1 - EASE_RELEASE(Math.min(1, (x - attack - hold) / release));
}

function splitLast(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  const i = clean.lastIndexOf(" ");
  if (i < 0) return [clean];
  return [clean.slice(0, i), clean.slice(i + 1)];
}

function normalizeHex(c: string | undefined, fallback: string) {
  if (c && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) return c;
  return fallback;
}

export function TwoHit({
  before = "Premieres Friday.",
  after = "Streaming now.",
  hitAt = 34,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: TwoHitProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const blue = normalizeHex(accent, c.blue);
  const a = before.trim() || "Soon.";
  const b = after.trim() || "Now.";
  const phrases = useMemo(() => [splitLast(a), splitLast(b)], [a, b]);
  const m = useMetrics(phrases);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const margin = W * (portrait ? 0.06 : 0.055);
  const span = W - margin * 2;
  const lens = phrases.map((lines) => lines.map((l) => Array.from(l).length));
  const restW = (i: number, j: number) =>
    m.widths[i][j] + REST * (lens[i][j] - 1);
  let widest = 0;
  phrases.forEach((lines, i) => {
    lines.forEach((_, j) => {
      widest = Math.max(widest, restW(i, j));
    });
  });
  const rows = Math.max(phrases[0].length, phrases[1].length);
  const LEAD = 0.98;
  const F = Math.min(
    (W * (portrait ? 0.86 : 0.62)) / widest,
    (H * (portrait ? 0.3 : 0.62)) / (m.cap + (rows - 1) * LEAD),
  );
  const peak = (i: number, j: number) =>
    Math.min(
      MAX_TRACK,
      Math.max(REST, (span / F - m.widths[i][j]) / Math.max(1, lens[i][j] - 1)),
    );

  const h1 = hitAt;
  const h2 = hitAt + 24;
  const swapAt = h2 + 7;
  const e1 = FIRST_GAIN * pulse(t - h1, 4, 0, 16);
  const e2 = pulse(t - h2, 5, 4, 24);
  const e = Math.max(e1, e2);
  const idx = t < swapAt ? 0 : 1;
  const lines = phrases[idx];

  const enter = (j: number) =>
    interpolate(t, [2 + j * 4, 20 + j * 4], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const blockH = (m.cap + (lines.length - 1) * LEAD) * F;
  const firstBase = H * (portrait ? 0.5 : 0.53) - blockH / 2 + m.cap * F;

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: urbanist.fontFamily,
      }}
    >
      {lines.map((line, j) => {
        const track = REST + e * (peak(idx, j) - REST);
        const baseY = firstBase + j * LEAD * F;
        const p = enter(j);
        const last = j === lines.length - 1 && lines.length > 1;
        return (
          <div
            key={`${idx}-${j}`}
            style={{
              position: "absolute",
              right: margin,
              top: baseY - m.baseline * F - F * 0.1,
              height: F * 1.25,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                paddingTop: F * 0.1,
                fontSize: F,
                lineHeight: `${F}px`,
                fontVariationSettings: `"wght" ${WGHT}`,
                letterSpacing: `${track.toFixed(4)}em`,
                marginRight: `${(-track).toFixed(4)}em`,
                whiteSpace: "pre",
                color: last ? blue : c.ink,
                transform: `translateY(${((1 - p) * F * 1.05).toFixed(2)}px)`,
              }}
            >
              {line}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
