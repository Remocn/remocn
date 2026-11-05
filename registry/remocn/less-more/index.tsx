"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const figtree = loadFigtree("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface LessMoreProps {
  less?: string;
  more?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const SKY = "#1185FE";

const THEMES = {
  dark: { bg: "#0B0F14", ink: "#F5F8FA", muted: "#5F6B7A" },
  light: { bg: "#FFFFFF", ink: "#0B0F14", muted: "#A3ACB7" },
} as const;

const MEASURE_PX = 200;

const RISE_AT = 0;
const RISE_LEN = 18;
const RISE_GAP = 1.2;
const RISE_SPAN = 14;
const LINE_GAP = 6;
const DRAIN_AT = 34;
const DRAIN_SPREAD = 30;
const DRAIN_LEN = 18;
const FILL_AT = 80;
const FILL_SPREAD = 12;
const FILL_LEN = 12;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  adv: number[][];
  cap: number;
}

function measure(lines: string[]): Metrics {
  const host = document.createElement("div");
  host.style.cssText =
    "position:absolute;left:-100000px;top:0;visibility:hidden;white-space:pre;";
  document.body.appendChild(host);
  const make = (text: string) => {
    const s = document.createElement("span");
    s.textContent = text;
    s.style.fontFamily = `"${figtree.fontFamily}"`;
    s.style.fontSize = `${MEASURE_PX}px`;
    s.style.fontWeight = "500";
    s.style.fontKerning = "normal";
    s.style.display = "inline-block";
    host.appendChild(s);
    return s;
  };
  const jobs = lines.map((line) => {
    const chars = Array.from(line);
    return chars.map((ch, i) => {
      const nx = chars[i + 1];
      return { pair: make(nx ? ch + nx : ch), next: nx ? make(nx) : null };
    });
  });
  const adv = jobs.map((line) =>
    line.map(({ pair, next }) => {
      const w = pair.getBoundingClientRect().width;
      const n = next ? next.getBoundingClientRect().width : 0;
      return (w - n) / MEASURE_PX;
    }),
  );
  document.body.removeChild(host);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let cap = 0.7;
  if (ctx) {
    ctx.font = `500 ${MEASURE_PX}px "${figtree.fontFamily}"`;
    cap = ctx.measureText("H").actualBoundingBoxAscent / MEASURE_PX;
  }
  return { adv, cap };
}

function useMetrics(lines: string[]) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("less-more: measuring"));
  const released = useRef(false);
  const key = lines.join("\u0000");
  useEffect(() => {
    let live = true;
    const ls = key.split("\u0000");
    Promise.all([
      figtree.waitUntilDone(),
      document.fonts.load(`500 100px "${figtree.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(ls));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return metrics;
}

function trackFor(size: number, small: number, big: number) {
  return interpolate(size, [small, big], [-0.004, -0.04], CLAMP);
}

interface Row {
  group: 0 | 1;
  from: number;
  to: number;
}

function splitRows(
  chars: string[],
  widthOf: (from: number, to: number) => number,
  rows: number,
): Row[] {
  const spaces = chars.flatMap((ch, i) => (ch === " " ? [i] : []));
  if (rows <= 1 || spaces.length < rows - 1) {
    return [{ group: 1, from: 0, to: chars.length }];
  }
  let best: Row[] = [{ group: 1, from: 0, to: chars.length }];
  let bestW = Number.POSITIVE_INFINITY;
  const pick = (start: number, left: number, cuts: number[]) => {
    if (left === 0) {
      const out: Row[] = [];
      let from = 0;
      for (const cut of cuts) {
        out.push({ group: 1, from, to: cut });
        from = cut + 1;
      }
      out.push({ group: 1, from, to: chars.length });
      const w = Math.max(...out.map((r) => widthOf(r.from, r.to)));
      if (w < bestW) {
        bestW = w;
        best = out;
      }
      return;
    }
    for (let k = start; k < spaces.length; k++) {
      pick(k + 1, left - 1, [...cuts, spaces[k]]);
    }
  };
  pick(0, rows - 1, []);
  return best;
}

export function LessMore({
  less = "Less explaining.",
  more = "More showing.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: LessMoreProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const sky = accent ?? SKY;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const lines = useMemo(() => [less.trim(), more.trim()], [less, more]);
  const m = useMetrics(lines);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.065);
  const marginY = portrait ? H * 0.07 : H * 0.1;
  const measureW = W - marginX * 2;
  const chars = lines.map((l) => Array.from(l));
  const n1 = chars[0].length;
  const n2 = chars[1].length;

  const emRange = (g: number, from: number, to: number, track: number) => {
    let w = 0;
    for (let i = from; i < to; i++) w += m.adv[g][i] + track;
    return w;
  };

  const fitFor = (rows: Row[]) => {
    const widest = Math.max(
      ...rows.map((r) => emRange(1, r.from, r.to, -0.04)),
    );
    return Math.min(H * (portrait ? 0.16 : 0.32), measureW / widest);
  };
  let moreRows = splitRows(chars[1], (a, b) => emRange(1, a, b, -0.04), 1);
  let B = fitFor(moreRows);
  const enough = Math.min(W, H) * (portrait ? 0.24 : 0.2);
  if (B < enough) {
    for (const r of [2, 3]) {
      const rows = splitRows(chars[1], (a, b) => emRange(1, a, b, -0.04), r);
      const fit = fitFor(rows);
      if (fit > B * 1.08) {
        B = fit;
        moreRows = rows;
      }
    }
  }
  const S = Math.min(
    Math.max(B * 0.26, Math.min(W, H) * 0.045),
    measureW / emRange(0, 0, n1, -0.004),
  );
  const fitEqual =
    measureW /
    Math.max(
      emRange(0, 0, n1, -0.025),
      ...moreRows.map((r) => emRange(1, r.from, r.to, -0.025)),
    );
  const M = Math.max(S * 1.4, Math.min(fitEqual, B * 0.62));
  const rows: Row[] = [{ group: 0, from: 0, to: n1 }, ...moreRows];

  const drainStep = n1 > 1 ? DRAIN_SPREAD / (n1 - 1) : 0;
  const growStep = n2 > 1 ? DRAIN_SPREAD / (n2 - 1) : 0;
  const shrink = chars[0].map((_, i) =>
    interpolate(
      t,
      [DRAIN_AT + i * drainStep, DRAIN_AT + i * drainStep + DRAIN_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    ),
  );
  const grow = chars[1].map((_, j) =>
    spring({
      frame: t - (DRAIN_AT + 3 + j * growStep),
      fps,
      config: { damping: 20, stiffness: 120, mass: 0.9 },
    }),
  );

  const sizes = [
    shrink.map((p) => M + (S - M) * p),
    grow.map((p) => M + (B - M) * p),
  ];
  const placed = rows.map((r) => {
    const xs: number[] = [];
    let x = 0;
    let max = 0;
    for (let i = r.from; i < r.to; i++) {
      const sz = sizes[r.group][i];
      xs.push(x);
      x += m.adv[r.group][i] * sz + trackFor(sz, S, B) * sz;
      max = Math.max(max, sz);
    }
    return { xs, max };
  });
  const bases: number[] = [];
  let y = marginY;
  placed.forEach((p, k) => {
    if (k > 0) {
      const prev = placed[k - 1].max;
      y += k === 1 ? 0.36 * prev + 0.1 * p.max : 0.24 * prev + 0.02 * p.max;
    }
    y += m.cap * p.max;
    bases.push(y);
  });

  const riseGap = Math.min(RISE_GAP, RISE_SPAN / Math.max(1, n1, n2));
  const riseEnd = (row: number, len: number) =>
    RISE_AT + row * LINE_GAP + (len - 1) * riseGap + RISE_LEN;
  const rise = (row: number, i: number) =>
    interpolate(
      t,
      [
        RISE_AT + row * LINE_GAP + i * riseGap,
        RISE_AT + row * LINE_GAP + i * riseGap + RISE_LEN,
      ],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
  const fillStep = n2 > 1 ? FILL_SPREAD / (n2 - 1) : 0;
  const fill = chars[1].map((_, j) =>
    interpolate(
      t,
      [FILL_AT + j * fillStep, FILL_AT + j * fillStep + FILL_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    ),
  );

  const glyph = (
    ch: string,
    x: number,
    gy: number,
    s: number,
    color: string,
    key: string,
    opacity: number,
  ) =>
    ch === " " || opacity <= 0.001 ? null : (
      <text
        key={key}
        x={x}
        y={gy}
        fontSize={s}
        fill={color}
        opacity={opacity}
        style={{
          fontFamily: figtree.fontFamily,
          fontWeight: 500,
          fontKerning: "none",
        }}
      >
        {ch}
      </text>
    );

  const groups = rows.map((r, k) => {
    const lay = placed[k];
    const base = bases[k];
    const nodes: React.ReactNode[] = [];
    for (let i = r.from; i < r.to; i++) {
      const ch = chars[r.group][i];
      const x = marginX + lay.xs[i - r.from];
      const sz = sizes[r.group][i];
      const gy = base + (1 - rise(k, i - r.from)) * M * 1.05;
      if (r.group === 0) {
        const mix = interpolate(shrink[i], [0.15, 0.85], [0, 1], CLAMP);
        nodes.push(glyph(ch, x, gy, sz, c.ink, `i${i}`, 1 - mix));
        nodes.push(glyph(ch, x, gy, sz, c.muted, `m${i}`, mix));
      } else {
        nodes.push(glyph(ch, x, gy, sz, c.ink, `i${i}`, 1 - fill[i]));
        nodes.push(glyph(ch, x, gy, sz, sky, `f${i}`, fill[i]));
      }
    }
    const masking = t < riseEnd(k, r.to - r.from);
    const clipId = `${uid}c${k}`;
    return (
      <g
        key={`r${r.group}-${r.from}`}
        clipPath={masking ? `url(#${clipId})` : undefined}
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={0}
              y={base - m.cap * lay.max - 0.36 * lay.max}
              width={W}
              height={m.cap * lay.max + 0.7 * lay.max}
            />
          </clipPath>
        </defs>
        {nodes}
      </g>
    );
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {groups}
      </svg>
    </AbsoluteFill>
  );
}
