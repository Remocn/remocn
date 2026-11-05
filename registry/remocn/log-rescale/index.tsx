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
  accent?: string;
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

export function LogRescale({
  data = DEFAULT_DATA,
  accentIndex,
  title = "remocn renders per year",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: LogRescaleProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = height / 720;
  const p = THEMES[theme];
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

  const m = interpolate(t, MORPH, [0, 1], { ...CLAMP, easing: EASE_IO });
  const linN = (v: number) => v / linMax;
  const logN = (v: number) =>
    (Math.log10(Math.max(v, lo)) - Math.log10(lo)) / decades;
  const norm = (v: number) => lerp(linN(v), logN(v), m);

  const left = width * 0.16;
  const right = width * 0.88;
  const top = height * 0.24;
  const bottom = height * 0.8;
  const chartH = bottom - top;
  const yOf = (v: number) => bottom - norm(v) * chartH;

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
      return { v, y, a: a * edge * intro };
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

  const growOf = (i: number) => {
    if (i === ai) {
      return spring({
        frame: t - ACCENT_GROW,
        fps,
        config: { damping: 18, stiffness: 70, mass: 0.9 },
      });
    }
    const order = i < ai ? i : i - 1;
    return interpolate(t, [6 + order * 3, 26 + order * 3], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };

  const scaleSwap = interpolate(t, [MORPH[0] + 4, MORPH[0] + 20], [0, 1], {
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
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
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
              top: tk.y - 10 * u,
              height: 20 * u,
              lineHeight: `${20 * u}px`,
              textAlign: "right",
              fontFamily: sans,
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
        const g = growOf(i);
        const h = norm(values[i]) * chartH * g;
        const order = i < ai ? i : i - 1;
        const a = isA
          ? accentIn
          : interpolate(
              t,
              [LABELS_AT + order * 3, LABELS_AT + 12 + order * 3],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
        const fs = isA ? lerp(20, 60, accentBig) * u : 17 * u;
        return (
          <div key={`v-${d.label}`}>
            <div
              style={{
                position: "absolute",
                left: x - 140 * u,
                width: 280 * u,
                top: bottom - h - fs * 1.1 - lerp(8, 6, accentBig) * u,
                height: fs * 1.1,
                lineHeight: `${fs * 1.1}px`,
                textAlign: "center",
                fontFamily: sans,
                fontWeight: 500,
                fontSize: fs,
                letterSpacing: isA
                  ? `${lerp(-0.01, -0.04, accentBig)}em`
                  : "-0.005em",
                fontVariantNumeric: "tabular-nums",
                color: p.fg,
                opacity: a,
                transform: `translateY(${(1 - a) * 6 * u}px)`,
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
                fontFamily: sans,
                fontWeight: isA ? 500 : 400,
                fontSize: 16 * u,
                letterSpacing: "0",
                fontVariantNumeric: "tabular-nums",
                color: isA ? p.fg : p.muted,
                opacity: interpolate(t, [4 + i * 2, 16 + i * 2], [0, 1], CLAMP),
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
          transform: `translateY(${(1 - titleA) * 8 * u}px)`,
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 28 * u,
            letterSpacing: "-0.025em",
            color: p.fg,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8 * u,
            fontFamily: sans,
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
            {["Linear", "Log"].map((w, k) => (
              <div
                key={w}
                style={{
                  position: "absolute",
                  right: 0,
                  top: (k - scaleSwap) * tagH,
                  height: tagH,
                  lineHeight: `${tagH}px`,
                  color: k === 1 ? p.fg : p.muted,
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
