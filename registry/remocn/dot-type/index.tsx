"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Sora";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const DISPLAY = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface DotTypeProps {
  words?: string[];
  accentLast?: boolean;
  count?: number;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_WORDS = ["Think.", "Make.", "Ship."];

const FIELD = 14;
const FIRST = 32;
const STREAM = 34;
const HOLD = 22;
const FINAL_HOLD = 32;
const FLIGHT = 0.66;

const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const SOFT = Easing.bezier(0.45, 0, 0.2, 1);

function windows(wordCount: number) {
  const out: { start: number; len: number }[] = [];
  let t = FIELD;
  for (let i = 0; i < wordCount; i++) {
    const len = i === 0 ? FIRST : STREAM;
    out.push({ start: t, len });
    t += len + HOLD;
  }
  return out;
}

export const dotTypeLength = (wordCount = DEFAULT_WORDS.length) => {
  const w = windows(wordCount);
  const last = w[w.length - 1];
  return last.start + last.len + FINAL_HOLD;
};

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const h = (a: number, b: number) => hash(a * 57.3 + b * 131.9);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const top = h(xi, yi) * (1 - u) + h(xi + 1, yi) * u;
  const bot = h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u;
  return top * (1 - v) + bot * v;
}

interface Pt {
  x: number;
  y: number;
}

interface WordSample {
  pts: Pt[];
  spacing: number;
  cy: number;
}

function hilbert(x: number, y: number, order = 128): number {
  let d = 0;
  let px = x;
  let py = y;
  for (let s = order / 2; s >= 1; s = Math.floor(s / 2)) {
    const rx = (px & s) > 0 ? 1 : 0;
    const ry = (py & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        px = s - 1 - px;
        py = s - 1 - py;
      }
      const t = px;
      px = py;
      py = t;
    }
  }
  return d;
}

function hilbertOrder(pts: Pt[]): number[] {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const ox = minX - (span - (maxX - minX)) / 2;
  const oy = minY - (span - (maxY - minY)) / 2;
  return pts
    .map((p, i) => ({
      i,
      h: hilbert(
        Math.min(127, Math.floor(((p.x - ox) / span) * 128)),
        Math.min(127, Math.floor(((p.y - oy) / span) * 128)),
      ),
    }))
    .sort((m, n) => m.h - n.h)
    .map((m) => m.i);
}

function xOrder(pts: Pt[]): number[] {
  return pts
    .map((p, i) => ({ i, k: p.x + p.y * 1e-4 }))
    .sort((m, n) => m.k - n.k)
    .map((m) => m.i);
}

function sampleWords(
  words: string[],
  family: string,
  n: number,
  W: number,
  H: number,
): WordSample[] | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const setFont = (px: number) => {
    ctx.font = `500 ${px}px "${family}", sans-serif`;
    if ("letterSpacing" in ctx) {
      (
        ctx as CanvasRenderingContext2D & { letterSpacing: string }
      ).letterSpacing = `${(-0.03 * px).toFixed(2)}px`;
    }
  };
  setFont(100);
  let widest = 1;
  for (const w of words) widest = Math.max(widest, ctx.measureText(w).width);
  const cap = ctx.measureText("H").actualBoundingBoxAscent || 72;
  const fs = Math.min((W * 0.66 * 100) / widest, (H * 0.34 * 100) / cap);
  setFont(fs);
  const capPx = ctx.measureText("H").actualBoundingBoxAscent || fs * 0.72;
  const baseline = H / 2 + capPx / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  return words.map((word) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.fillText(word, W / 2, baseline);
    const data = ctx.getImageData(0, 0, W, H).data;
    let x0 = W;
    let y0 = H;
    let x1 = 0;
    let y1 = 0;
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        if (data[(y * W + x) * 4 + 3] > 127) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    x0 = Math.max(0, x0 - 4);
    y0 = Math.max(0, y0 - 4);
    x1 = Math.min(W - 1, x1 + 4);
    y1 = Math.min(H - 1, y1 + 4);
    const grid = (s: number) => {
      const out: Pt[] = [];
      const rowH = s * 0.866;
      let row = 0;
      for (let y = y0 + rowH / 2; y < y1; y += rowH, row++) {
        const off = row % 2 ? s / 2 : 0;
        for (let x = x0 + off; x < x1; x += s) {
          const px = Math.round(x);
          const py = Math.round(y);
          if (data[(py * W + px) * 4 + 3] > 127) out.push({ x, y });
        }
      }
      return out;
    };
    let lo = 1;
    let hi = 40;
    for (let it = 0; it < 16; it++) {
      const mid = (lo + hi) / 2;
      if (grid(mid).length >= n) lo = mid;
      else hi = mid;
    }
    const pts = grid(lo);
    const picked: Pt[] = [];
    for (let j = 0; j < n; j++) {
      picked.push(pts[Math.floor(((j + 0.5) * pts.length) / n)] ?? pts[0]);
    }
    return { pts: picked, spacing: lo, cy: H / 2 };
  });
}

function fieldPoints(n: number, W: number, H: number) {
  const cols = Math.round(Math.sqrt((n * W) / H));
  const rows = Math.ceil(n / cols);
  const pts: (Pt & { b: number })[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = ((c + 0.15 + hash(i * 3.1) * 0.7) / cols) * W;
    const y = ((r + 0.15 + hash(i * 5.7) * 0.7) / rows) * H;
    const nx = x / W - 0.5;
    const ny = y / H - 0.5;
    const vignette = Math.max(0, 1 - (nx * nx * 2.6 + ny * ny * 3.4));
    const b = valueNoise(x / (W * 0.14), y / (H * 0.2)) ** 1.4;
    pts.push({ x, y, b: (0.12 + b * 0.55) * (0.25 + 0.75 * vignette) });
  }
  return pts;
}

function Grain({ opacity, light }: { opacity: number; light: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={`${uid}-grain`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.85}
          numOctaves={2}
          seed={7}
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0"
        />
      </filter>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${uid}-grain)`}
        opacity={opacity}
        style={{ mixBlendMode: light ? "multiply" : "screen" }}
      />
    </svg>
  );
}

/* gradients.sh "dither-field" palette, as a fill on the last word's dots. */
const DITHER = {
  dark: ["#2b3dd8", "#ff6a3d", "#ffd9a8"],
  light: ["#2b3dd8", "#ff6a3d", "#e0703b"],
} as const;

function circle(x: number, y: number, r: number) {
  const rs = r.toFixed(2);
  const d = (2 * r).toFixed(2);
  return `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${rs} ${rs} 0 1 0 ${d} 0a${rs} ${rs} 0 1 0 -${d} 0`;
}

export function DotType({
  words = DEFAULT_WORDS,
  accentLast = true,
  count = 1500,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: DotTypeProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const isLight = theme === "light";
  const bg = isLight ? "#F5F4F0" : "#0A0A0B";
  const ink = isLight ? "#141416" : "#EEEEF0";
  const n = Math.max(300, Math.round(count));
  const list = words.length ? words : DEFAULT_WORDS;
  const key = list.join("\u0000");

  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("dot-type: font"));
  const released = useRef(false);

  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setReady(true);
    };
    DISPLAY.waitUntilDone()
      .then(() =>
        typeof document !== "undefined" && document.fonts
          ? document.fonts.load(`500 120px "${DISPLAY.fontFamily}"`)
          : undefined,
      )
      .then(done, done);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready && !released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [ready, handle]);

  const model = useMemo(() => {
    if (!ready) return null;
    const samples = sampleWords(
      key.split("\u0000"),
      DISPLAY.fontFamily,
      n,
      W,
      H,
    );
    if (!samples) return null;
    const field = fieldPoints(n, W, H);
    const fieldIdx = hilbertOrder(field);
    const firstIdx = hilbertOrder(samples[0].pts);
    const states: Pt[][] = [];
    const s0: Pt[] = new Array(n);
    const s1: Pt[] = new Array(n);
    const fieldB: number[] = new Array(n);
    for (let r = 0; r < n; r++) {
      const dot = fieldIdx[r];
      s0[dot] = field[dot];
      fieldB[dot] = field[dot].b;
      s1[dot] = samples[0].pts[firstIdx[r]];
    }
    states.push(s0, s1);
    const rankOf: number[][] = [];
    for (let k = 1; k < samples.length; k++) {
      const prev = states[k];
      const prevOrder = xOrder(prev);
      const rank: number[] = new Array(n);
      prevOrder.forEach((dot, r) => {
        rank[dot] = r;
      });
      rankOf.push(rank);
      const target = samples[k].pts;
      const tOrder = xOrder(target);
      const next: Pt[] = new Array(n);
      for (let dot = 0; dot < n; dot++)
        next[dot] = target[tOrder[n - 1 - rank[dot]]];
      states.push(next);
    }
    return {
      states,
      fieldB,
      rankOf,
      spacing: samples.map((s) => s.spacing),
    };
  }, [ready, key, n, W, H]);

  const wins = windows(list.length);
  const total = dotTypeLength(list.length);
  const cx = W / 2;
  const cy = H / 2;

  const push = 1 + 0.035 * INOUT(Math.min(1, frame / total));
  const gid = `dt${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const sweep = Math.min(1, frame / total);
  const stops = DITHER[theme];

  const BUCKETS = 6;
  const inkPaths: string[][] = Array.from({ length: BUCKETS }, () => []);
  const accPaths: string[][] = Array.from({ length: BUCKETS }, () => []);

  if (model) {
    let k = 0;
    for (let i = 0; i < wins.length; i++) if (frame >= wins[i].start) k = i + 1;
    const { states, fieldB, rankOf, spacing } = model;
    const from = states[Math.max(0, k - 1)];
    const to = states[k];
    const win = wins[Math.max(0, k - 1)];
    const u = k === 0 ? 0 : (frame - win.start) / win.len;
    const lastK = list.length;
    const unit = Math.min(W, H) / 720;
    const rField = 1.7 * unit;
    const rWord = (s: number) => s * 0.37;
    const maxD = Math.hypot(W, H) / 2;

    for (let i = 0; i < n; i++) {
      const a = from[i];
      const b = to[i];
      let x: number;
      let y: number;
      let r: number;
      let bright: number;
      let acc = false;
      if (k === 0) {
        x = a.x + Math.sin(frame * 0.028 + i) * 2 * unit + frame * 0.35 * unit;
        y = a.y + Math.cos(frame * 0.022 + i * 1.3) * 2 * unit;
        r = rField * (0.5 + fieldB[i]);
        bright = fieldB[i];
      } else if (k === 1) {
        const ax =
          a.x + Math.sin(FIELD * 0.028 + i) * 2 * unit + FIELD * 0.35 * unit;
        const ay = a.y + Math.cos(FIELD * 0.022 + i * 1.3) * 2 * unit;
        const d = Math.hypot(ax - cx, ay - cy) / maxD;
        const delay = Math.min(1, d * 0.8 + hash(i * 9.1) * 0.2) * (1 - FLIGHT);
        const t = Math.max(0, Math.min(1, (u - delay) / FLIGHT));
        const e = INOUT(t);
        const dx = b.x - ax;
        const dy = b.y - ay;
        const curl = (0.22 + hash(i * 4.3) * 0.14) * Math.sin(Math.PI * e);
        x = ax + dx * e - dy * curl;
        y = ay + dy * e + dx * curl;
        r = rField * (0.5 + fieldB[i]) * (1 - e) + rWord(spacing[0]) * e;
        bright = fieldB[i] + (1 - fieldB[i]) * e;
        acc = accentLast && lastK === 1 && e > 0.92;
      } else {
        const rank = rankOf[k - 2][i] / n;
        const delay =
          Math.min(1, (1 - rank) * 0.82 + hash(i * 7.7) * 0.18) * (1 - FLIGHT);
        const t = Math.max(0, Math.min(1, (u - delay) / FLIGHT));
        const e = SOFT(t);
        const lift = Math.sin(Math.PI * e);
        const side = a.y < cy ? -1 : 1;
        const lane = 0.78 + hash(i * 3.3) * 0.44;
        const theta = Math.PI * e;
        const ox = cx + Math.cos(theta) * W * 0.36 * (0.9 + lane * 0.1);
        const oy = cy + side * Math.sin(theta) * H * 0.29 * lane;
        x = (a.x + (b.x - a.x) * e) * (1 - lift) + ox * lift;
        y = (a.y + (b.y - a.y) * e) * (1 - lift) + oy * lift;
        r =
          (rWord(spacing[k - 2]) * (1 - e) + rWord(spacing[k - 1]) * e) *
          (1 - lift * 0.3);
        bright = 1 - lift * 0.35;
        acc = accentLast && k === lastK && e > 0.9;
      }
      const sx = cx + (x - cx) * push;
      const sy = cy + (y - cy) * push;
      if (sx < -10 || sx > W + 10) continue;
      bright = Math.max(0, Math.min(1, bright));
      const bucket = Math.min(BUCKETS - 1, Math.floor(bright * BUCKETS));
      (acc ? accPaths : inkPaths)[bucket].push(circle(sx, sy, r * push));
    }
  }

  return (
    <AbsoluteFill
      style={{
        background: isLight
          ? `radial-gradient(80% 75% at 50% 45%, #FBFAF7 0%, ${bg} 72%)`
          : `radial-gradient(80% 75% at 50% 45%, #121215 0%, ${bg} 72%)`,
        overflow: "hidden",
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gid}
            gradientUnits="userSpaceOnUse"
            colorInterpolation="linearRGB"
            x1={W * (0.2 - 0.04 * sweep)}
            y1={H * 0.36}
            x2={W * (0.8 - 0.04 * sweep)}
            y2={H * 0.64}
          >
            <stop offset="0" stopColor={accent} />
            <stop offset="0.18" stopColor={stops[0]} />
            <stop offset="0.66" stopColor={stops[1]} />
            <stop offset="1" stopColor={stops[2]} />
          </linearGradient>
        </defs>
        {inkPaths.map((segs, i) =>
          segs.length ? (
            <path
              key={`i${i}`}
              d={segs.join("")}
              fill={ink}
              opacity={0.22 + ((i + 1) / BUCKETS) * 0.78}
            />
          ) : null,
        )}
        {accPaths.map((segs, i) =>
          segs.length ? (
            <path
              key={`a${i}`}
              d={segs.join("")}
              fill={`url(#${gid})`}
              opacity={0.5 + ((i + 1) / BUCKETS) * 0.5}
            />
          ) : null,
        )}
      </svg>
      <Grain opacity={isLight ? 0.045 : 0.06} light={isLight} />
    </AbsoluteFill>
  );
}
