"use client";

import { loadFont as loadFamiljen } from "@remotion/google-fonts/FamiljenGrotesk";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const familjen = loadFamiljen("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface WindowTrailProps {
  from?: string;
  text?: string;
  tagline?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const ORANGE = "#FF4F00";

const THEMES = {
  dark: { field: "#1E1E1E", ink: "#FFE7D6", inkOnAccent: "#1E1E1E" },
  light: { field: "#FFE7D6", ink: "#1E1E1E", inkOnAccent: "#1E1E1E" },
} as const;

const TRACK = -0.03;
const OUT_AT = 8;
const OUT_LEN = 18;
const IN_AT = 28;
const IN_LEN = 30;
const TAIL = 4;
const RETRACT = 2;
const GAP = 1.12;
const TAG_DELAY = 6;

const EASE_DRAG = Easing.bezier(0.2, 0.85, 0.25, 1);
const EASE_THROW = Easing.bezier(0.55, 0, 0.85, 0.35);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface TrailState {
  front: number;
  stamps: { y: number; id: number }[];
}

function trail(
  f: number,
  len: number,
  ease: (u: number) => number,
  y0: number,
  y1: number,
  gap: number,
  rest: number | null,
): TrailState {
  const pos = (g: number) =>
    y0 + (y1 - y0) * ease(Math.max(0, Math.min(1, g / len)));
  const front = pos(f);
  const all: { y: number; id: number }[] = [];
  let last: number | null = null;
  for (let g = 0; g <= Math.min(f, len); g += 0.25) {
    const q = pos(g);
    if (rest !== null && Math.abs(q - rest) < gap) continue;
    if (last === null || Math.abs(q - last) >= gap) {
      all.push({ y: q, id: all.length });
      last = q;
    }
  }
  const clear = all.filter((s) => Math.abs(s.y - front) >= gap);
  const retract = f > len ? Math.floor((f - len) / RETRACT) + 1 : 0;
  const keep = Math.max(0, Math.min(clear.length, TAIL) - retract);
  return { front, stamps: clear.slice(clear.length - keep) };
}

interface Metrics {
  from: number;
  text: number;
  tag: number;
}

function measure(from: string, text: string, tag: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("window-trail: no 2d context");
  const fam = `"${familjen.fontFamily}"`;
  ctx.font = `500 100px ${fam}`;
  const w = (s: string) =>
    s ? ctx.measureText(s).width / 100 + TRACK * Array.from(s).length : 0;
  const textW = w(text);
  const fromW = w(from);
  ctx.font = `400 100px ${fam}`;
  const tagW = tag ? ctx.measureText(tag).width / 100 : 0;
  return { from: fromW, text: textW, tag: tagW };
}

function useMetrics(from: string, text: string, tag: string) {
  const key = `${from}\u0001${text}\u0001${tag}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("window-trail: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [a, b, d] = key.split("\u0001");
    Promise.all([
      familjen.waitUntilDone(),
      document.fonts.load(`500 100px "${familjen.fontFamily}"`),
      document.fonts.load(`400 100px "${familjen.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(a, b, d) });
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

function mix(a: string, b: string, k: number) {
  const pct = Math.round(Math.max(0, Math.min(1, 1 - k)) * 100);
  return `color-mix(in srgb, ${a} ${pct}%, ${b})`;
}

export function WindowTrail({
  from = "Old look.",
  text = "New look, same product.",
  tagline = "Repainted in one render.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: WindowTrailProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const m = useMetrics(from, text, tagline);

  const transparent = background === "transparent";
  const hot = accent ?? ORANGE;
  const fieldA = transparent ? c.field : (background ?? c.field);

  if (!m) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: transparent ? "transparent" : fieldA,
        }}
      />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);
  const marginX = W * (portrait ? 0.08 : 0.065);
  const measureW = W - marginX * 2;

  const fit = (w: number) =>
    Math.min(measureW / Math.max(w, 0.01), H * (portrait ? 0.09 : 0.2));
  const F = fit(m.text);
  const F0 = m.from ? fit(m.from) : F;
  const splitY = H * (portrait ? 0.54 : 0.5);
  const baseY = splitY;
  const baseY0 = splitY;

  const hasFrom = from.length > 0;
  const inAt = hasFrom ? IN_AT : 0;
  const tagAt = inAt + IN_LEN + TAG_DELAY;

  const inTrail = trail(
    t - inAt,
    IN_LEN,
    EASE_DRAG,
    H + F * 0.4,
    baseY,
    F * GAP,
    baseY,
  );
  const outTrail = hasFrom
    ? trail(t - OUT_AT, OUT_LEN, EASE_THROW, baseY0, -F0 * 0.4, F0 * GAP, null)
    : null;

  const paints = [
    {
      key: "a",
      y: 0,
      h: splitY,
      ink: c.ink,
      stamp: (rank: number) => mix(hot, fieldA, 0.12 + rank * 0.2),
    },
    {
      key: "b",
      y: splitY,
      h: H - splitY,
      ink: transparent ? c.ink : c.inkOnAccent,
      stamp: (rank: number) =>
        transparent
          ? mix(hot, fieldA, 0.12 + rank * 0.2)
          : mix(c.inkOnAccent, hot, 0.3 + rank * 0.16),
    },
  ];

  const textProps = (size: number) => ({
    fontFamily: familjen.fontFamily,
    fontWeight: 500,
    fontSize: size,
    letterSpacing: `${TRACK}em`,
  });

  const layer = (
    tr: TrailState,
    str: string,
    size: number,
    key: string,
    showFront: boolean,
    p: (typeof paints)[number],
  ) => (
    <g key={key}>
      {tr.stamps.map((q, j) => (
        <text
          key={`${key}${q.id}`}
          {...textProps(size)}
          x={marginX}
          y={q.y}
          style={{ fill: p.stamp(tr.stamps.length - 1 - j) }}
        >
          {str}
        </text>
      ))}
      {showFront ? (
        <text {...textProps(size)} x={marginX} y={tr.front} fill={p.ink}>
          {str}
        </text>
      ) : null}
    </g>
  );

  const tagFs = (portrait ? 42 : 34) * s;
  const tagWords = tagline ? tagline.split(" ") : [];
  const tagTop = baseY + F * 0.62;
  const tagW = Math.min(measureW, m.tag * tagFs * 1.04);

  const nodes: React.ReactNode[] = paints.map((p) => (
    <g key={p.key} clipPath={`url(#${uid}${p.key})`}>
      {outTrail
        ? layer(outTrail, from, F0, `o${p.key}`, t < OUT_AT + OUT_LEN, p)
        : null}
      {t >= inAt ? layer(inTrail, text, F, `i${p.key}`, true, p) : null}
    </g>
  ));

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : fieldA,
        overflow: "hidden",
      }}
    >
      {transparent ? null : (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: splitY,
            width: W,
            height: H - splitY,
            background: hot,
          }}
        />
      )}
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          {paints.map((p) => (
            <clipPath key={p.key} id={`${uid}${p.key}`}>
              <rect x={0} y={p.y} width={W} height={p.h} />
            </clipPath>
          ))}
        </defs>
        {nodes}
      </svg>

      {tagline ? (
        <div
          style={{
            position: "absolute",
            left: marginX,
            width: tagW,
            top: tagTop,
            fontFamily: familjen.fontFamily,
            fontWeight: 400,
            fontSize: tagFs,
            lineHeight: 1.25,
            letterSpacing: "-0.005em",
            color: paints[1].ink,
            whiteSpace: "nowrap",
          }}
        >
          {tagWords.map((w, k) => {
            const q = interpolate(
              t,
              [tagAt + k * 2, tagAt + k * 2 + 16],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={`${w}-${k}`}
                style={{
                  display: "inline-block",
                  marginRight: k < tagWords.length - 1 ? "0.26em" : 0,
                  opacity: q,
                  transform: `translateY(${((1 - q) * tagFs * 0.7).toFixed(2)}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
