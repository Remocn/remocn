"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface LogRescaleDatum {
  label: string;
  value: number;
}

export interface LogRescaleProps {
  data?: LogRescaleDatum[];
  accentIndex?: number;
  title?: string;
  /** Scale tag before the chart rescales. */
  linearLabel?: string;
  /** Scale tag after the chart rescales. */
  logLabel?: string;
  /** Frame at which the axis starts morphing from linear to log. */
  morphAt?: number;
  accent?: string;
  /** Text color of the title and values; overrides the theme. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  grain?: boolean;
  /** Size of the chart, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_DATA: LogRescaleDatum[] = [
  { label: "2021", value: 340 },
  { label: "2022", value: 1200 },
  { label: "2023", value: 4800 },
  { label: "2024", value: 18000 },
  { label: "2025", value: 96000 },
  { label: "2026", value: 2400000 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    bar: "#46464D",
    barEnd: "#5E5E66",
    grid: "rgba(243,242,239,0.1)",
    minor: "rgba(243,242,239,0.04)",
    base: "rgba(243,242,239,0.36)",
    grain: 0.06,
    // gradients.sh "beam": the hero bar heats from accent blue to ice white.
    hero: ["#2e45b7", "#3d5bff", "#8fb4ff", "#e4ebff"],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    bar: "#CFCDC6",
    barEnd: "#B9B6AE",
    grid: "rgba(18,18,20,0.1)",
    minor: "rgba(18,18,20,0.045)",
    base: "rgba(18,18,20,0.4)",
    grain: 0.045,
    hero: ["#24339a", "#3d5bff", "#6f8fff", "#9db4ff"],
  },
} as const;

const MORPH = [64, 106] as const;
const ACCENT_GROW = 24;
const LABELS_AT = 100;

function compact(v: number) {
  const fmt = (n: number, suffix: string) => {
    const r = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
    return `${String(r).replace(/\.0$/, "")}${suffix}`;
  };
  if (v >= 1e9) return fmt(v / 1e9, "B");
  if (v >= 1e6) return fmt(v / 1e6, "M");
  if (v >= 1e3) return fmt(v / 1e3, "k");
  return fmt(v, "");
}

function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * pow;
}

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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

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

export function LogRescale({
  data = DEFAULT_DATA,
  accentIndex,
  title = "remocn renders per year",
  linearLabel = "Linear",
  logLabel = "Log",
  morphAt = MORPH[0],
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = sans,
  grain = true,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: LogRescaleProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width, height, fps } = useVideoConfig();
  const u = height / 720;
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const bg =
    background === "transparent" ? "transparent" : (background ?? p.bg);
  const morph = [morphAt, morphAt + MORPH[1] - MORPH[0]];
  const heroId = `hero${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const rows = data.length > 0 ? data : DEFAULT_DATA;
  const n = rows.length;
  const values = rows.map((d) => Math.max(d.value, 1e-6));
  const maxV = Math.max(...values);
  const minV = Math.min(...values);
  const ai =
    accentIndex !== undefined && accentIndex >= 0 && accentIndex < n
      ? accentIndex
      : values.indexOf(maxV);

  const step = niceStep(maxV / 5);
  const linMax = Math.ceil(maxV / step - 1e-9) * step;
  const lo = 10 ** Math.floor(Math.log10(minV));
  const hi = 10 ** Math.ceil(Math.log10(maxV) + 1e-9);
  const decades = Math.round(Math.log10(hi / lo));

  const mAt = (tt: number) =>
    interpolate(tt, morph, [0, 1], { ...CLAMP, easing: EASE_IO });
  const m = mAt(t);
  const linN = (v: number) => v / linMax;
  const logN = (v: number) =>
    (Math.log10(Math.max(v, lo)) - Math.log10(lo)) / decades;
  const normAt = (v: number, mm: number) => lerp(linN(v), logN(v), mm);
  const norm = (v: number) => normAt(v, m);
  // A frame on either side, to tell a value still easing from one at rest.
  const moves = (at: (tt: number) => number) =>
    Math.abs(at(t + speed) - at(t)) > 1e-3 ||
    Math.abs(at(t) - at(t - speed)) > 1e-3;

  const left = width * 0.16;
  const right = width * 0.88;
  const top = height * 0.24;
  const bottom = height * 0.8;
  const chartH = bottom - top;
  const yOf = (v: number) => bottom - norm(v) * chartH;
  const yAt = (v: number, tt: number) => bottom - normAt(v, mAt(tt)) * chartH;

  const intro = interpolate(t, [0, 14], [0, 1], { ...CLAMP, easing: EASE_OUT });

  const tickMap = new Map<number, { lin: boolean; log: boolean }>();
  for (let v = 0; v <= linMax + step / 2; v += step) {
    const key = Math.round(v);
    tickMap.set(key, { lin: true, log: false });
  }
  for (let k = 0; k <= decades; k++) {
    const key = Math.round(lo * 10 ** k);
    const prev = tickMap.get(key);
    tickMap.set(key, { lin: prev?.lin ?? false, log: true });
  }
  const linA = interpolate(m, [0.02, 0.34], [1, 0], CLAMP);
  const logA = interpolate(m, [0.48, 0.9], [0, 1], CLAMP);
  const ticks = [...tickMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([v, kind]) => {
      const y = yOf(v);
      const a = Math.max(kind.lin ? linA : 0, kind.log ? logA : 0);
      const edge = interpolate(y, [top - 34 * u, top - 4 * u], [0, 1], CLAMP);
      // A label is laid out where the morph leaves it and rides there by
      // transform all its life: layout rounds a baseline to whole pixels, so
      // a label eased by `top` clicks along, and one handed back to layout at
      // rest jumps by what the rounding takes.
      const anchor = yOf(v) - yAt(v, morph[1]);
      const sliding = moves((tt) => yAt(v, tt));
      return { v, y, a: a * edge * intro, anchor, sliding };
    });

  const minors: Array<{ v: number; y: number }> = [];
  for (let k = 0; k < decades; k++) {
    for (let j = 2; j <= 9; j++) {
      const v = lo * 10 ** k * j;
      minors.push({ v, y: yOf(v) });
    }
  }
  const minorA = interpolate(m, [0.5, 1], [0, 1], CLAMP);

  const slot = (right - left) / n;
  const bw = Math.min(slot * 0.52, 84 * u);

  const growOf = (i: number, tt = t) => {
    if (i === ai) {
      return spring({
        frame: tt - ACCENT_GROW,
        fps,
        config: { damping: 18, stiffness: 70, mass: 0.9 },
      });
    }
    const order = i < ai ? i : i - 1;
    return interpolate(tt, [6 + order * 3, 26 + order * 3], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };

  const scaleSwap = interpolate(t, [morph[0] + 4, morph[0] + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const titleA = interpolate(t, [2, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const accentBig = interpolate(t, [LABELS_AT, LABELS_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const accentIn = interpolate(
    t,
    [ACCENT_GROW + 14, ACCENT_GROW + 26],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );
  const dim = interpolate(t, [LABELS_AT, LABELS_AT + 16], [0, 1], CLAMP);
  const sw = Math.max(1, u);
  const tagH = 20 * u;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={heroId}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={bottom}
              x2={0}
              y2={top - chartH * 0.05}
            >
              <stop offset={0} stopColor={p.hero[0]} />
              <stop offset={0.38} stopColor={accent} />
              <stop offset={0.78} stopColor={p.hero[2]} />
              <stop offset={1} stopColor={p.hero[3]} />
            </linearGradient>
          </defs>
          {minors.map((mi) =>
            mi.y > top - 2 * u && mi.y < bottom - 1 ? (
              <line
                key={`mi-${mi.v}`}
                x1={left}
                x2={right}
                y1={mi.y}
                y2={mi.y}
                stroke={p.minor}
                strokeWidth={sw}
                opacity={minorA}
              />
            ) : null,
          )}
          {ticks.map((tk) =>
            tk.a > 0.001 && tk.y < bottom - 1 ? (
              <line
                key={`g-${tk.v}`}
                x1={left}
                x2={right}
                y1={tk.y}
                y2={tk.y}
                stroke={p.grid}
                strokeWidth={sw}
                opacity={tk.a}
              />
            ) : null,
          )}

          {rows.map((d, i) => {
            const g = growOf(i);
            const h = Math.max(
              2 * u * Math.min(1, g * 4),
              norm(values[i]) * chartH * g,
            );
            const x = left + slot * (i + 0.5) - bw / 2;
            const isA = i === ai;
            const r = Math.min(4 * u, h / 2, bw / 2);
            const fill = isA
              ? `url(#${heroId})`
              : interpolateColors(dim, [0, 1], [p.barEnd, p.bar]);
            return (
              <path
                key={`b-${d.label}`}
                d={`M${x} ${bottom} L${x} ${bottom - h + r} Q${x} ${bottom - h} ${x + r} ${bottom - h} L${x + bw - r} ${bottom - h} Q${x + bw} ${bottom - h} ${x + bw} ${bottom - h + r} L${x + bw} ${bottom} Z`}
                fill={fill}
                opacity={g > 0 ? 1 : 0}
              />
            );
          })}

          <line
            x1={left}
            x2={lerp(left, right, intro)}
            y1={bottom}
            y2={bottom}
            stroke={p.base}
            strokeWidth={Math.max(1, 1.25 * u)}
          />
        </svg>

        {ticks.map((tk) =>
          tk.a > 0.001 ? (
            <div
              key={`t-${tk.v}`}
              style={{
                position: "absolute",
                left: left - 160 * u,
                width: 160 * u - 16 * u,
                top: tk.y - tk.anchor - 10 * u,
                height: 20 * u,
                transform: `translateY(${tk.anchor}px)${glide(tk.sliding)}`,
                lineHeight: `${20 * u}px`,
                textAlign: "right",
                fontFamily,
                fontWeight: 400,
                fontSize: 16 * u,
                letterSpacing: "0",
                fontVariantNumeric: "tabular-nums",
                color: p.muted,
                opacity: tk.a,
                whiteSpace: "nowrap",
              }}
            >
              {compact(tk.v)}
            </div>
          ) : null,
        )}

        {rows.map((d, i) => {
          const x = left + slot * (i + 0.5);
          const isA = i === ai;
          const order = i < ai ? i : i - 1;
          const a = isA
            ? accentIn
            : interpolate(
                t,
                [LABELS_AT + order * 3, LABELS_AT + 12 + order * 3],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
          const bigAt = (tt: number) =>
            interpolate(tt, [LABELS_AT, LABELS_AT + 18], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
          const fsAt = (tt: number) =>
            isA ? lerp(20, 60, bigAt(tt)) * u : 17 * u;
          const topAt = (tt: number) => {
            const h = normAt(values[i], mAt(tt)) * chartH * growOf(i, tt);
            return bottom - h - fsAt(tt) * 1.1 - lerp(8, 6, bigAt(tt)) * u;
          };
          const fs = fsAt(t);
          const top = topAt(t);
          // The label is laid out where it ends, at its final size, and rides
          // there by transform all its life: layout rounds a baseline to whole
          // pixels, a font size that grows moves the baseline inside its own
          // box, and a label handed back to layout at rest jumps by what the
          // rounding takes.
          const riding = moves(topAt) || moves(fsAt);
          const fsEnd = fsAt(1e4);
          const topEnd = topAt(1e4);
          const rise = (1 - a) * 6 * u;
          // The accent's spring leaves a tail far under a pixel.
          const ride = top - topEnd + rise;
          const box = fsEnd;
          return (
            <div key={`v-${d.label}`}>
              <div
                style={{
                  position: "absolute",
                  left: x - 140 * u,
                  width: 280 * u,
                  top: topEnd,
                  height: box * 1.1,
                  lineHeight: `${box * 1.1}px`,
                  textAlign: "center",
                  fontFamily,
                  fontWeight: 500,
                  fontSize: box,
                  letterSpacing: isA
                    ? `${lerp(-0.01, -0.04, accentBig)}em`
                    : "-0.005em",
                  fontVariantNumeric: "tabular-nums",
                  color: fg,
                  opacity: a,
                  transformOrigin: "50% 0",
                  transform: `translateY(${Math.abs(ride) > 1e-3 ? ride : 0}px) scale(${fs / fsEnd})${glide(riding || midway(a))}`,
                  whiteSpace: "nowrap",
                }}
              >
                {compact(values[i])}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: x - 100 * u,
                  width: 200 * u,
                  top: bottom + 14 * u,
                  textAlign: "center",
                  fontFamily,
                  fontWeight: isA ? 500 : 400,
                  fontSize: 16 * u,
                  letterSpacing: "0",
                  fontVariantNumeric: "tabular-nums",
                  color: isA ? fg : p.muted,
                  opacity: interpolate(
                    t,
                    [4 + i * 2, 16 + i * 2],
                    [0, 1],
                    CLAMP,
                  ),
                }}
              >
                {d.label}
              </div>
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: left - 16 * u - 2 * u,
            top: height * 0.085,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            width: right - left + 18 * u,
            opacity: titleA,
            transform: `translateY(${(1 - titleA) * 8 * u}px)${glide(midway(titleA))}`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: 500,
              fontSize: 28 * u,
              letterSpacing: "-0.025em",
              color: fg,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              fontFamily,
              fontWeight: 400,
              fontSize: 17 * u,
              color: p.muted,
            }}
          >
            <div
              style={{
                position: "relative",
                height: tagH,
                width: 52 * u,
                overflow: "hidden",
              }}
            >
              {[linearLabel, logLabel].map((w, k) => (
                <div
                  key={w}
                  style={{
                    position: "absolute",
                    right: 0,
                    // Each tag is laid out where it rests and slides by
                    // transform, for the same reason as the labels above.
                    top: 0,
                    transform: `translateY(${(k - scaleSwap) * tagH}px)${glide(midway(scaleSwap))}`,
                    height: tagH,
                    lineHeight: `${tagH}px`,
                    color: k === 1 ? fg : p.muted,
                    opacity: k === 0 ? 1 - scaleSwap : scaleSwap,
                    whiteSpace: "nowrap",
                  }}
                >
                  {w}
                </div>
              ))}
            </div>
            <div style={{ lineHeight: `${tagH}px` }}>scale</div>
          </div>
        </div>
      </ScaleLayer>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 64%, ${bg} 100%)`,
          opacity: 0.5,
        }}
      />
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
