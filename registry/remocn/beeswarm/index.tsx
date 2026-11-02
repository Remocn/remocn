"use client";

import { loadFont } from "@remotion/google-fonts/DMSans";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface BeeswarmGroup {
  label: string;
  median: number;
  spread: number;
}

export interface BeeswarmProps {
  before?: BeeswarmGroup;
  after?: BeeswarmGroup;
  count?: number;
  domain?: [number, number];
  tickStep?: number;
  axisLabel?: string;
  totalLabel?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_BEFORE: BeeswarmGroup = {
  label: "Before",
  median: 3.4,
  spread: 0.85,
};
const DEFAULT_AFTER: BeeswarmGroup = {
  label: "With remocn",
  median: 10.6,
  spread: 1.05,
};

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const FALL = Easing.bezier(0.55, 0, 0.9, 0.6);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    neutral: "#B9B8BD",
    grey: "#6E6D73",
    axis: "rgba(255,255,255,0.2)",
    rule: "rgba(255,255,255,0.07)",
    // gradients.sh "mesh" as a radial bloom through the hero cluster
    mesh: ["#ecdcf2", "#8796ee", "accent", "#2e45b7"],
    label: "#aab4f4",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    neutral: "#5B5955",
    grey: "#A5A39D",
    axis: "rgba(18,18,20,0.22)",
    rule: "rgba(18,18,20,0.07)",
    mesh: ["#8796ee", "accent", "#2e45b7"],
    label: "#2e45b7",
    grain: 0.045,
  },
} as const;

const POUR = [0, 40] as const;
const FALL_T = 16;
const SPLIT = 64;
const SPLIT_STAGGER = 10;
const SPLIT_T = 32;
const HIT = SPLIT + SPLIT_STAGGER + SPLIT_T - 4;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function normal(seed: number) {
  const a = Math.max(1e-6, hash(seed));
  const b = hash(seed + 91.7);
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
}

function swarm(xs: number[], d: number) {
  const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
  const placed: { x: number; y: number }[] = [];
  const ys = new Array<number>(xs.length).fill(0);
  const d2 = d * d - 1e-6;
  for (const i of order) {
    const x = xs[i];
    const near = placed.filter((q) => Math.abs(q.x - x) < d);
    const cands = [0];
    for (const q of near) {
      const dy = Math.sqrt(Math.max(0, d * d - (q.x - x) ** 2));
      cands.push(q.y + dy, q.y - dy);
    }
    const flip = i % 2 === 0 ? 1 : -1;
    cands.sort((a, b) => Math.abs(a) - Math.abs(b) || (a - b) * flip);
    let y = 0;
    for (const c of cands) {
      if (near.every((q) => (q.x - x) ** 2 + (q.y - c) ** 2 >= d2)) {
        y = c;
        break;
      }
    }
    placed.push({ x, y });
    ys[i] = y;
  }
  return ys;
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
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const fmt = (n: number) => n.toFixed(1).replace(/\.0$/, "");

export function Beeswarm({
  before = DEFAULT_BEFORE,
  after = DEFAULT_AFTER,
  count = 200,
  domain = [0, 14],
  tickStep = 2,
  axisLabel = "launch videos shipped per quarter",
  totalLabel = "200 teams",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: BeeswarmProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];

  const N = Math.max(20, Math.min(320, Math.round(count)));
  const [d0, d1] = domain;
  const x0 = W * 0.12;
  const x1 = W * 0.88;
  const xOf = (v: number) => x0 + ((v - d0) / (d1 - d0 || 1)) * (x1 - x0);
  const axisY = H * 0.46;
  const r = 6.6 * u;
  const pitch = 2 * r + 1.2 * u;

  const layout = useMemo(() => {
    const mid = (before.median + after.median) / 2;
    const midSpread = Math.max(before.spread, after.spread) * 1.45;
    const clampV = (v: number) => Math.min(d1 - 0.3, Math.max(d0 + 0.3, v));
    const v1 = Array.from({ length: N }, (_, i) =>
      clampV(mid + midSpread * normal(i * 2.31 + 0.17)),
    );
    const rank = v1
      .map((v, i) => ({ v, i }))
      .sort((a, b) => a.v - b.v)
      .map((o, k) => ({ i: o.i, score: k / N + (hash(o.i + 6.6) - 0.5) * 0.7 }))
      .sort((a, b) => a.score - b.score);
    const half = Math.floor(N / 2);
    const group = new Array<number>(N).fill(0);
    rank.forEach((o, k) => {
      group[o.i] = k < half ? 0 : 1;
    });
    const members = [0, 1].map((g) =>
      v1
        .map((v, i) => ({ v, i }))
        .filter((o) => group[o.i] === g)
        .sort((a, b) => a.v - b.v),
    );
    const v2 = new Array<number>(N).fill(0);
    members.forEach((list, g) => {
      const src = g === 0 ? before : after;
      const vals = list
        .map((_, k) =>
          clampV(src.median + src.spread * normal(k * 3.7 + g * 101.3)),
        )
        .sort((a, b) => a - b);
      const med = vals[Math.floor(vals.length / 2)] ?? src.median;
      list.forEach((o, k) => {
        v2[o.i] = vals[k] - med + src.median;
      });
    });
    const toX = (v: number) => x0 + ((v - d0) / (d1 - d0 || 1)) * (x1 - x0);
    const xs1 = v1.map(toX);
    const ys1 = swarm(xs1, pitch);
    const xs2 = v2.map(toX);
    const ys2 = [0, 1].reduce((acc, g) => {
      const idx = members[g].map((o) => o.i);
      const ys = swarm(
        idx.map((i) => xs2[i]),
        pitch,
      );
      idx.forEach((i, k) => {
        acc[i] = ys[k];
      });
      return acc;
    }, new Array<number>(N).fill(0));
    const pourOrder = ys1
      .map((y, i) => ({ i, k: y + (hash(i + 4.2) - 0.5) * pitch * 0.6 }))
      .sort((a, b) => b.k - a.k);
    const pourRank = new Array<number>(N).fill(0);
    pourOrder.forEach((o, k) => {
      pourRank[o.i] = k / Math.max(1, N - 1);
    });
    const ext = (g: number) =>
      Math.max(pitch, ...members[g].map((o) => Math.abs(ys2[o.i])));
    return {
      xs1,
      ys1,
      xs2,
      ys2,
      group,
      pourRank,
      ext1: Math.max(pitch, ...ys1.map(Math.abs)),
      ext: [ext(0), ext(1)],
    };
  }, [N, before, after, d0, d1, x0, x1, pitch]);

  const ruleIn = interpolate(t, [0, 18], [0, 1], { ...CLAMP, easing: EASE_IO });
  const totalIn =
    interpolate(t, [POUR[1] + 6, POUR[1] + 16], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    }) * interpolate(t, [SPLIT - 2, SPLIT + 8], [1, 0], CLAMP);
  const push = interpolate(t, [0, HIT + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camScale = 0.975 + 0.025 * push;

  const meshId = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-mesh`;
  const meshStops = p.mesh.map((c) => (c === "accent" ? accent : c));
  const bloomX = xOf(after.median);
  const bloomR = Math.max(
    after.spread * 2.4 * ((x1 - x0) / (d1 - d0 || 1)),
    layout.ext[1] * 1.6,
  );
  const circles: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const g = layout.group[i];
    const start = POUR[0] + layout.pourRank[i] * (POUR[1] - POUR[0]);
    const fall = interpolate(t, [start, start + FALL_T], [0, 1], {
      ...CLAMP,
      easing: FALL,
    });
    if (fall <= 0) continue;
    const fromY = -H * 0.08 - hash(i + 12.1) * H * 0.12;
    const ty1 = axisY + layout.ys1[i];
    const landT = t - start - FALL_T;
    const settle =
      landT > 0 && landT < 8
        ? Math.sin((landT / 8) * Math.PI) * 1.6 * u * (1 - landT / 8)
        : 0;
    const y1 = fromY + (ty1 - fromY) * fall + settle;
    const sStart = SPLIT + hash(i + 2.9) * SPLIT_STAGGER;
    const k = interpolate(t, [sStart, sStart + SPLIT_T], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const x = layout.xs1[i] + (layout.xs2[i] - layout.xs1[i]) * k;
    const y2 = axisY + layout.ys2[i];
    const lift = Math.sin(k * Math.PI) * (g === 0 ? -1 : 1) * 10 * u;
    const y = y1 + (y2 - y1) * k + lift;
    const o = interpolate(fall, [0, 0.25], [0, 1], CLAMP);
    if (g === 0) {
      const fill = interpolateColors(k, [0, 1], [p.neutral, p.grey]);
      circles.push(
        <circle key={i} cx={x} cy={y} r={r} fill={fill} opacity={o} />,
      );
    } else {
      circles.push(
        <g key={i} opacity={o}>
          {k < 1 && <circle cx={x} cy={y} r={r} fill={p.neutral} />}
          {k > 0 && (
            <circle cx={x} cy={y} r={r} fill={`url(#${meshId})`} opacity={k} />
          )}
        </g>,
      );
    }
  }

  const ticks: number[] = [];
  for (let v = d0; v <= d1 + 1e-6; v += tickStep) ticks.push(v);
  const axisBase = axisY + Math.max(layout.ext1, ...layout.ext) + 72 * u;

  const groups = [before, after].map((grp, g) => {
    const snap = spring({
      frame: t - HIT - g * 4,
      fps,
      config: { damping: 14, stiffness: 190, mass: 0.6 },
    });
    const a = interpolate(t, [HIT + g * 4, HIT + g * 4 + 8], [0, 1], CLAMP);
    const lab = interpolate(t, [HIT + 6 + g * 4, HIT + 24 + g * 4], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const ext = Math.max(...layout.ext) + 16 * u;
    return {
      grp,
      g,
      x: xOf(grp.median),
      top: axisY - ext,
      bot: axisY + ext,
      labelBottom: H - axisY + ext + 14 * u,
      snap,
      a,
      lab,
      color: g === 0 ? p.muted : p.label,
      line: g === 0 ? p.fg : accent,
    };
  });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${camScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <line
            x1={W / 2 - ((x1 - x0) / 2) * ruleIn}
            x2={W / 2 + ((x1 - x0) / 2) * ruleIn}
            y1={axisY}
            y2={axisY}
            stroke={p.rule}
            strokeWidth={Math.max(1, u)}
          />
          <line
            x1={W / 2 - ((x1 - x0) / 2) * ruleIn}
            x2={W / 2 + ((x1 - x0) / 2) * ruleIn}
            y1={axisBase}
            y2={axisBase}
            stroke={p.axis}
            strokeWidth={Math.max(1, u)}
          />
          {ticks.map((v) => (
            <line
              key={v}
              x1={xOf(v)}
              x2={xOf(v)}
              y1={axisBase}
              y2={axisBase + 6 * u}
              stroke={p.axis}
              strokeWidth={Math.max(1, u)}
              opacity={ruleIn}
            />
          ))}
          <defs>
            <radialGradient
              id={meshId}
              gradientUnits="userSpaceOnUse"
              cx={bloomX + (push - 0.5) * 6 * u}
              cy={axisY}
              r={bloomR}
            >
              {meshStops.map((c, k) => (
                <stop
                  key={c}
                  offset={(k / (meshStops.length - 1)) ** 1.15}
                  stopColor={c}
                />
              ))}
            </radialGradient>
          </defs>
          {circles}
          {groups.map((m) => {
            const len = (m.bot - m.top) * (0.4 + 0.6 * m.snap);
            const cy = (m.top + m.bot) / 2;
            return (
              <g key={m.grp.label} opacity={m.a}>
                <line
                  x1={m.x}
                  x2={m.x}
                  y1={cy - len / 2}
                  y2={cy + len / 2}
                  stroke={p.bg}
                  strokeWidth={6 * u}
                  strokeLinecap="round"
                />
                <line
                  x1={m.x}
                  x2={m.x}
                  y1={cy - len / 2}
                  y2={cy + len / 2}
                  stroke={m.line}
                  strokeWidth={2.4 * u}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: axisY - layout.ext1 - 52 * u,
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 18 * u,
            letterSpacing: "-0.01em",
            color: p.muted,
            opacity: totalIn,
          }}
        >
          {totalLabel}
        </div>

        {groups.map((m) => (
          <div
            key={`lab${m.grp.label}`}
            style={{
              position: "absolute",
              left: m.x - 200 * u,
              width: 400 * u,
              bottom: m.labelBottom,
              textAlign: "center",
              opacity: m.lab,
              transform: `translateY(${(1 - m.lab) * 10 * u}px)`,
            }}
          >
            <div
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: 18 * u,
                letterSpacing: "-0.01em",
                color: m.color,
                whiteSpace: "nowrap",
              }}
            >
              {m.grp.label}
            </div>
            <div
              style={{
                marginTop: 2 * u,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 64 * u,
                lineHeight: 1,
                letterSpacing: "-0.035em",
                color: p.fg,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {fmt(m.grp.median)}
            </div>
          </div>
        ))}

        {ticks.map((v) => (
          <div
            key={`t${v}`}
            style={{
              position: "absolute",
              left: xOf(v) - 30 * u,
              width: 60 * u,
              top: axisBase + 12 * u,
              textAlign: "center",
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 15 * u,
              color: p.muted,
              fontVariantNumeric: "tabular-nums",
              opacity: ruleIn,
            }}
          >
            {fmt(v)}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: axisBase + 40 * u,
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 16 * u,
            color: p.muted,
            opacity: ruleIn,
          }}
        >
          {axisLabel}
        </div>
      </AbsoluteFill>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
