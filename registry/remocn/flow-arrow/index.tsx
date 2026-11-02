"use client";

import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: space } = loadSpace("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface FlowArrowProps {
  metric?: string;
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const FLIGHT = Easing.bezier(0.38, 0, 0.16, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    stream: "#7C7B82",
    hair: "rgba(255,255,255,0.14)",
    shine: "#FFFFFF",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    stream: "#9C9A94",
    hair: "rgba(18,18,20,0.16)",
    shine: "#0E1240",
    grain: 0.045,
  },
} as const;

const TREND: [number, number][] = [
  [0, 0.02],
  [0.15, 0.13],
  [0.26, 0.09],
  [0.42, 0.3],
  [0.52, 0.25],
  [0.69, 0.55],
  [0.78, 0.5],
  [1, 0.9],
];

const LAUNCH = 4;
const SPAN = 52;
const JITTER = 8;
const FLY = 32;
const HIT = LAUNCH + SPAN + JITTER + FLY;
const PASSERS = 80;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** gradients.sh "halo" palette, run from the arrow's tail to its tip. */
const HALO = {
  dark: ["#3D4DFF", "#E2457A", "#FFB36B", "#FFF4EC"],
  light: ["#3D4DFF", "#E2457A", "#F2894A"],
} as const;

function sample(stops: readonly string[], k: number) {
  const x = Math.min(1, Math.max(0, k)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

function mix(a: string, b: string, t: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) =>
    Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${c(16)}${c(8)}${c(0)}`;
}

type Pt = { x: number; y: number };

function catmull(pts: Pt[], steps: number) {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b +
          (-a + c) * t +
          (2 * a - 5 * b + 4 * c - d) * t2 +
          (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function cubic(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
  const q = 1 - t;
  const w0 = q * q * q;
  const w1 = 3 * q * q * t;
  const w2 = 3 * q * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * a.x + w1 * b.x + w2 * c.x + w3 * d.x,
    y: w0 * a.y + w1 * b.y + w2 * c.y + w3 * d.y,
  };
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function buildArrow(W: number, H: number, u: number) {
  const bx0 = W * 0.13;
  const bw = W * 0.5;
  const by1 = H * 0.78;
  const bh = H * 0.54;
  const knots = TREND.map(([x, y]) => ({ x: bx0 + x * bw, y: by1 - y * bh }));
  const line = catmull(knots, 26);
  const cum = [0];
  for (let i = 1; i < line.length; i++) {
    cum.push(
      cum[i - 1] +
        Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y),
    );
  }
  const L = cum[cum.length - 1];
  const end = line[line.length - 1];
  const prev = line[line.length - 10];
  const dl = Math.hypot(end.x - prev.x, end.y - prev.y) || 1;
  const d = { x: (end.x - prev.x) / dl, y: (end.y - prev.y) / dl };
  const n = { x: -d.y, y: d.x };
  const half = 17 * u;
  const hw = 52 * u;
  const hl = 92 * u;
  const tip = { x: end.x + d.x * hl, y: end.y + d.y * hl };
  const total = L + hl;

  const pitch = 9 * u;
  const rowH = pitch * 0.866;
  const minX = bx0 - half * 2;
  const maxX = tip.x + hw;
  const minY = tip.y - hw;
  const maxY = by1 + half * 2;
  const pts: { x: number; y: number; s: number }[] = [];
  for (let gy = minY, row = 0; gy <= maxY; gy += rowH, row++) {
    const off = row % 2 ? pitch / 2 : 0;
    for (let gx = minX + off; gx <= maxX; gx += pitch) {
      const rx = gx - end.x;
      const ry = gy - end.y;
      const along = rx * d.x + ry * d.y;
      const across = rx * n.x + ry * n.y;
      if (
        along >= -1 &&
        along <= hl &&
        Math.abs(across) <= hw * (1 - along / hl)
      ) {
        pts.push({ x: gx, y: gy, s: (L + along) / total });
        continue;
      }
      if (along > -1) continue;
      let best = Number.POSITIVE_INFINITY;
      let bestS = 0;
      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i];
        const b = line[i + 1];
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const len2 = vx * vx + vy * vy || 1;
        const k = Math.max(
          0,
          Math.min(1, ((gx - a.x) * vx + (gy - a.y) * vy) / len2),
        );
        const dist = Math.hypot(gx - (a.x + vx * k), gy - (a.y + vy * k));
        if (dist < best) {
          best = dist;
          bestS = cum[i] + (cum[i + 1] - cum[i]) * k;
        }
      }
      if (best <= half) pts.push({ x: gx, y: gy, s: bestS / total });
    }
  }
  return { pts, tip, start: knots[0], by1 };
}

export function FlowArrow({
  metric = "3×",
  label = "faster growth",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: FlowArrowProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];
  // The tail starts in the accent (the palette's own first stop is the same blue).
  const halo = useMemo(
    () => [accent, ...HALO[theme].slice(1)],
    [accent, theme],
  );
  const r = 3.1 * u;

  const arrow = useMemo(() => buildArrow(W, H, u), [W, H, u]);

  const particles = useMemo(
    () =>
      arrow.pts.map((pt, k) => {
        const h = (o: number) => hash(k * 2.31 + o);
        const o = h(1) * 2 - 1;
        const a = { x: -W * 0.05, y: H * (0.56 + o * 0.05) };
        const b = {
          x: a.x + (pt.x - a.x) * 0.42,
          y: H * (0.26 + o * 0.05) + (pt.y - H * 0.5) * 0.35,
        };
        const c = {
          x: pt.x - W * (0.05 + h(5) * 0.03),
          y: pt.y - H * (0.16 + h(6) * 0.05),
        };
        return {
          k,
          s: pt.s,
          color: sample(halo, pt.s ** 1.15),
          a,
          b,
          c,
          d: { x: pt.x, y: pt.y },
          start: LAUNCH + pt.s * SPAN + h(7) * JITTER,
        };
      }),
    [arrow, W, H, halo],
  );

  const passers = useMemo(
    () =>
      Array.from({ length: PASSERS }, (_, k) => {
        const h = (o: number) => hash(k * 5.17 + 40 + o);
        const o = h(1) * 2 - 1;
        return {
          k,
          a: { x: -W * 0.05, y: H * (0.56 + o * 0.05) },
          b: { x: W * 0.36, y: H * (0.2 + o * 0.06) },
          c: { x: W * 0.7, y: H * (0.62 + o * 0.07) },
          d: { x: W * 1.06, y: H * (0.42 + o * 0.08) },
          start: h(5) * 54 - 14,
          dur: 46 + h(6) * 12,
        };
      }),
    [W, H],
  );

  const sweep = interpolate(t, [HIT - 2, HIT + 26], [-0.15, 1.15], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const land = interpolate(t, [HIT - 6, HIT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labIn = interpolate(t, [HIT + 4, HIT + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const hairIn = interpolate(t, [6, 60], [0, 1], { ...CLAMP, easing: EASE_IO });
  const push = interpolate(t, [0, HIT + 50], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = 0.975 + 0.035 * push;

  const marks: React.ReactNode[] = [];
  for (const q of passers) {
    const raw = (t - q.start) / q.dur;
    if (raw <= 0 || raw >= 1) continue;
    const e = EASE_IO(raw);
    const head = cubic(q.a, q.b, q.c, q.d, e);
    const tail = cubic(q.a, q.b, q.c, q.d, Math.max(0, e - 0.025));
    const fade = Math.min(1, Math.sin(Math.PI * raw) * 2);
    marks.push(
      <line
        key={`p${q.k}`}
        x1={tail.x}
        y1={tail.y}
        x2={head.x}
        y2={head.y}
        stroke={p.stream}
        strokeWidth={r * 1.6}
        strokeLinecap="round"
        opacity={0.5 * fade}
      />,
    );
  }
  for (const q of particles) {
    const raw = interpolate(t, [q.start, q.start + FLY], [0, 1], CLAMP);
    if (raw <= 0) continue;
    if (raw >= 1) {
      const g = Math.exp(-(((q.s - sweep) / 0.07) ** 2));
      const settle = interpolate(
        t,
        [q.start + FLY, q.start + FLY + 6],
        [1.3, 1],
        CLAMP,
      );
      marks.push(
        <circle
          key={q.k}
          cx={q.d.x}
          cy={q.d.y}
          r={r * settle}
          fill={g > 0.02 ? mix(q.color, p.shine, 0.45 * g) : q.color}
        />,
      );
      continue;
    }
    const e = FLIGHT(raw);
    const head = cubic(q.a, q.b, q.c, q.d, e);
    const tail = cubic(q.a, q.b, q.c, q.d, Math.max(0, e - 0.022));
    const tone = interpolate(raw, [0.35, 0.95], [0, 1], CLAMP);
    marks.push(
      <line
        key={q.k}
        x1={tail.x}
        y1={tail.y}
        x2={head.x}
        y2={head.y}
        stroke={mix(p.stream, q.color, tone)}
        strokeWidth={r * 1.7}
        strokeLinecap="round"
        opacity={interpolate(raw, [0, 0.15], [0.3, 0.95], CLAMP)}
      />,
    );
  }

  const baseY = arrow.by1 + 34 * u;
  const baseX0 = arrow.start.x - 10 * u;
  const baseX1 = W * 0.9;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <line
            x1={baseX0}
            y1={baseY}
            x2={baseX0 + (baseX1 - baseX0) * hairIn}
            y2={baseY}
            stroke={p.hair}
            strokeWidth={Math.max(1, u)}
          />
          {marks}
        </svg>

        <div
          style={{
            position: "absolute",
            left: arrow.tip.x + 44 * u,
            top: arrow.tip.y - 30 * u,
            display: "flex",
            flexDirection: "column",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              fontFamily: space,
              fontWeight: 400,
              fontSize: 176 * u,
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              color: p.fg,
              fontVariantNumeric: "tabular-nums",
              opacity: land,
              filter: land < 0.99 ? `blur(${(1 - land) * 8 * u}px)` : undefined,
              transform: `translate(${(1 - land) * -16 * u}px, ${(1 - land) * 14 * u}px)`,
            }}
          >
            {metric}
          </div>
          <div
            style={{
              marginTop: 16 * u,
              fontFamily: space,
              fontWeight: 400,
              fontSize: 26 * u,
              letterSpacing: "-0.01em",
              color: p.muted,
              opacity: labIn,
              transform: `translateY(${(1 - labIn) * 8 * u}px)`,
            }}
          >
            {label}
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
