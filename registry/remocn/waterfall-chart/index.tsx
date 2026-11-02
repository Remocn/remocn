"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

// gradients.sh "mesh" palette (bg #0a0d24): #ecdcf2, #8796ee, #2e45b7, #0e1645.
const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;

/** Mesh layers sized for a tall bar: soft wide blobs over a vertical ramp. */
function mesh(drift: number, base: string) {
  return [
    `radial-gradient(130% 34% at ${28 + 14 * drift}% 6%, ${MESH[0]} 0%, transparent 72%)`,
    `radial-gradient(150% 40% at ${74 - 10 * drift}% 34%, color-mix(in oklab, ${MESH[1]} 70%, transparent) 0%, transparent 70%)`,
    `radial-gradient(160% 46% at ${30 + 12 * drift}% 86%, color-mix(in oklab, ${MESH[2]} 80%, transparent) 0%, transparent 72%)`,
    base,
  ].join(", ");
}

export interface WaterfallStep {
  label: string;
  value: number;
}

export interface WaterfallChartProps {
  start?: WaterfallStep;
  steps?: WaterfallStep[];
  totalLabel?: string;
  title?: string;
  format?: (value: number) => string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_START: WaterfallStep = { label: "Start", value: 52 };

const DEFAULT_STEPS: WaterfallStep[] = [
  { label: "Churn", value: -7 },
  { label: "Contraction", value: -3 },
  { label: "New", value: 24 },
  { label: "Expansion", value: 12 },
  { label: "Reactivation", value: 6 },
];

const defaultFormat = (v: number) => `$${Math.round(v)}k`;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_BAR = Easing.bezier(0.3, 0, 0.15, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    axis: "rgba(255,255,255,0.2)",
    hair: "rgba(255,255,255,0.32)",
    base: "#6A696F",
    up: "#C9C7C2",
    down: "#2E2D33",
    downEdge: "rgba(255,255,255,0.16)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    axis: "rgba(18,18,20,0.2)",
    hair: "rgba(18,18,20,0.32)",
    base: "#9C9A95",
    up: "#3F3E3B",
    down: "#E3E1DB",
    downEdge: "rgba(18,18,20,0.24)",
    grain: 0.045,
  },
} as const;

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Column {
  key: string;
  label: string;
  kind: "start" | "up" | "down" | "total";
  from: number;
  to: number;
  delta: number;
  start: number;
  dur: number;
}

export function WaterfallChart({
  start = DEFAULT_START,
  steps = DEFAULT_STEPS,
  totalLabel = "MRR",
  title = "Net revenue, Q3",
  format = defaultFormat,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: WaterfallChartProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const list = steps.slice(0, 8);

  const cols: Column[] = [];
  cols.push({
    key: "start",
    label: start.label,
    kind: "start",
    from: 0,
    to: start.value,
    delta: start.value,
    start: 8,
    dur: 22,
  });
  let level = start.value;
  const STAGGER = list.length > 5 ? 7 : 9;
  list.forEach((s, i) => {
    const next = level + s.value;
    cols.push({
      key: `s${i}`,
      label: s.label,
      kind: s.value < 0 ? "down" : "up",
      from: level,
      to: next,
      delta: s.value,
      start: 26 + i * STAGGER,
      dur: 15,
    });
    level = next;
  });
  const total = level;
  const TOTAL_AT = 26 + list.length * STAGGER + 6;
  cols.push({
    key: "total",
    label: totalLabel,
    kind: "total",
    from: 0,
    to: total,
    delta: total,
    start: TOTAL_AT,
    dur: 26,
  });

  const maxLevel = Math.max(
    1,
    ...cols.map((c) => Math.max(c.from, c.to)),
    total,
  );

  const plotL = width * 0.1;
  const plotR = width * 0.9;
  const baseY = height * 0.82;
  const topY = height * 0.34;
  const yOf = (v: number) => baseY - ((baseY - topY) * v) / maxLevel;
  const slot = (plotR - plotL) / cols.length;
  const colW = Math.min(slot * 0.58, 92 * u);
  const xOf = (i: number) => plotL + slot * (i + 0.5);

  const axisIn = interpolate(t, [0, 18], [0, 1], { ...CLAMP, easing: EASE_IO });
  const titleIn = interpolate(t, [4, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const totalRise = spring({
    frame: t - TOTAL_AT,
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.8 },
  });
  const count = interpolate(t, [TOTAL_AT, TOTAL_AT + 24], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const land = interpolate(t, [TOTAL_AT + 2, TOTAL_AT + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const unitIn = interpolate(t, [TOTAL_AT + 12, TOTAL_AT + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const focus = interpolate(t, [TOTAL_AT + 14, TOTAL_AT + 34], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const push = interpolate(t, [0, TOTAL_AT + 60], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = 0.975 + 0.025 * push;
  const settle = interpolate(t, [TOTAL_AT - 14, TOTAL_AT + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const shift = (1 - settle) * -0.075 * height;

  const progress = (c: Column) =>
    c.kind === "total"
      ? Math.max(0, totalRise)
      : interpolate(t, [c.start, c.start + c.dur], [0, 1], {
          ...CLAMP,
          easing: EASE_BAR,
        });

  const sw = Math.max(1, u);
  const radius = 2 * u;
  const totalK = Math.max(0, totalRise);
  const barFull = baseY - yOf(total);
  const drift = interpolate(t, [0, TOTAL_AT + 70], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const barBase = `linear-gradient(180deg, ${MESH[0]} 0%, ${MESH[1]} 34%, ${MESH[2]} 82%, #283da6 100%)`;
  const labelSize = 16 * u;
  const valueSize = 17 * u;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, transformOrigin: "50% 55%" }}
      >
        <AbsoluteFill style={{ transform: `translateY(${shift}px)` }}>
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <line
              x1={plotL}
              x2={plotL + (plotR - plotL) * axisIn}
              y1={baseY + sw / 2}
              y2={baseY + sw / 2}
              stroke={p.axis}
              strokeWidth={sw}
            />
            {cols.map((c, i) => {
              if (i === 0) return null;
              const prev = cols[i - 1];
              const y = yOf(prev.to);
              const x0 = xOf(i - 1) + colW / 2;
              const x1 = xOf(i) - colW / 2;
              const k = interpolate(t, [c.start - 7, c.start + 1], [0, 1], {
                ...CLAMP,
                easing: EASE_IO,
              });
              if (k <= 0) return null;
              const dim = c.kind === "total" ? 1 : 1 - 0.45 * focus;
              return (
                <line
                  key={`c${c.key}`}
                  x1={x0}
                  x2={x0 + (x1 - x0) * k}
                  y1={y}
                  y2={y}
                  stroke={p.hair}
                  strokeWidth={sw}
                  opacity={dim}
                />
              );
            })}
            {cols.map((c, i) => {
              const k = progress(c);
              if (k <= 0 || c.kind === "total") return null;
              const anchor = c.from;
              const end = anchor + (c.to - anchor) * k;
              const lo = Math.min(anchor, end);
              const hi = Math.max(anchor, end);
              const y0 = yOf(hi);
              const h = Math.max(sw, yOf(lo) - y0);
              const fill =
                c.kind === "start" ? p.base : c.kind === "up" ? p.up : p.down;
              const op = 1 - 0.4 * focus;
              return (
                <rect
                  key={c.key}
                  x={xOf(i) - colW / 2}
                  y={y0}
                  width={colW}
                  height={h}
                  rx={radius}
                  fill={fill}
                  stroke={c.kind === "down" ? p.downEdge : "none"}
                  strokeWidth={c.kind === "down" ? sw : 0}
                  opacity={op}
                />
              );
            })}
          </svg>

          {totalK > 0 ? (
            <div
              style={{
                position: "absolute",
                left: xOf(cols.length - 1) - colW / 2,
                top: yOf(total * totalK),
                width: colW,
                height: baseY - yOf(total * totalK),
                borderRadius: radius,
                overflow: "hidden",
                background: MESH[0],
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: barFull,
                  background: mesh(drift, barBase),
                }}
              />
            </div>
          ) : null}

          {cols.map((c, i) => {
            const a = interpolate(t, [c.start, c.start + 14], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const dim = c.kind === "total" ? 1 : 1 - 0.35 * focus;
            return (
              <div
                key={`l${c.key}`}
                style={{
                  position: "absolute",
                  left: xOf(i),
                  top: baseY + 14 * u,
                  transform: `translate(-50%, ${(1 - a) * 6 * u}px)`,
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: labelSize,
                  color: c.kind === "total" ? p.fg : p.muted,
                  whiteSpace: "nowrap",
                  opacity: a * dim,
                }}
              >
                {c.label}
              </div>
            );
          })}

          {cols.map((c, i) => {
            if (c.kind === "total") return null;
            const a = interpolate(
              t,
              [c.start + c.dur - 8, c.start + c.dur + 6],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            const top = yOf(Math.max(c.from, c.to));
            const text =
              c.kind === "start"
                ? format(c.delta)
                : `${c.delta < 0 ? "−" : "+"}${format(Math.abs(c.delta))}`;
            return (
              <div
                key={`v${c.key}`}
                style={{
                  position: "absolute",
                  left: xOf(i),
                  top: top - 10 * u,
                  transform: `translate(-50%, ${-100 + (1 - a) * 18}%)`,
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: valueSize,
                  letterSpacing: "-0.005em",
                  fontVariantNumeric: "tabular-nums",
                  color: c.kind === "down" ? p.muted : p.fg,
                  whiteSpace: "nowrap",
                  opacity: a * (1 - 0.4 * focus),
                }}
              >
                {text}
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: plotL,
              top: height * 0.255,
              transform: `translateY(-100%) translateY(${(1 - titleIn) * 8 * u}px)`,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 20 * u,
              letterSpacing: "-0.01em",
              color: p.muted,
              whiteSpace: "nowrap",
              opacity: titleIn,
            }}
          >
            {title}
          </div>
        </AbsoluteFill>

        <div
          style={{
            position: "absolute",
            right: width - plotR,
            top: height * 0.255,
            transform: "translateY(-100%)",
            display: "flex",
            alignItems: "baseline",
            gap: 14 * u,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 136 * u,
              lineHeight: 0.86,
              letterSpacing: "-0.045em",
              paddingRight: "0.05em",
              color: "transparent",
              backgroundImage: `linear-gradient(100deg, ${theme === "dark" ? MESH[0] : MESH[2]} ${4 + 10 * drift}%, ${MESH[1]} 48%, ${theme === "dark" ? MESH[2] : MESH[3]} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              fontVariantNumeric: "tabular-nums",
              display: "inline-block",
              opacity: land,
              filter: land < 0.99 ? `blur(${(1 - land) * 8 * u}px)` : undefined,
              transform: `translateY(${(1 - land) * 20 * u}px)`,
            }}
          >
            {format(total * count)}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10 * u,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 30 * u,
              letterSpacing: "-0.015em",
              color: p.muted,
              opacity: unitIn,
              transform: `translateY(${(1 - unitIn) * 8 * u}px)`,
            }}
          >
            <span
              style={{
                width: 10 * u,
                height: 10 * u,
                borderRadius: "50%",
                background: accent,
              }}
            />
            {totalLabel}
          </span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 64%, ${p.bg} 100%)`,
          opacity: 0.5,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
