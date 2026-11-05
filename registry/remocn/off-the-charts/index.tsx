"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
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

export interface OffTheChartsDatum {
  label: string;
  value: number;
}

export interface OffTheChartsProps {
  data?: OffTheChartsDatum[];
  accentIndex?: number;
  target?: number;
  max?: number;
  unit?: string;
  targetLabel?: string;
  value?: string;
  caption?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_DATA: OffTheChartsDatum[] = [
  { label: "Q1", value: 58 },
  { label: "Q2", value: 74 },
  { label: "Q3", value: 86 },
  { label: "Q4", value: 260 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const PUSH = Easing.bezier(0.45, 0, 0.3, 1);
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
    frame: "rgba(243,242,239,0.42)",
    grid: "rgba(243,242,239,0.1)",
    target: "rgba(243,242,239,0.7)",
    heatTop: "#ffe2c4",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    bar: "#CFCDC6",
    frame: "rgba(18,18,20,0.42)",
    grid: "rgba(18,18,20,0.1)",
    target: "rgba(18,18,20,0.72)",
    heatTop: "#ffbf8f",
    grain: 0.045,
  },
} as const;

const RISE = 40;
const PRESS = 66;
const BREAK = 69;

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
          seed={29}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function barPath(x: number, bottom: number, w: number, h: number, r0: number) {
  const r = Math.max(0, Math.min(r0, h / 2, w / 2));
  const top = bottom - h;
  return `M${x} ${bottom} L${x} ${top + r} Q${x} ${top} ${x + r} ${top} L${x + w - r} ${top} Q${x + w} ${top} ${x + w} ${top + r} L${x + w} ${bottom} Z`;
}

export function OffTheCharts({
  data = DEFAULT_DATA,
  accentIndex,
  target = 100,
  max = 150,
  unit = "%",
  targetLabel = "Target",
  value,
  caption = "of the Q4 target",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: OffTheChartsProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = height / 720;
  const p = THEMES[theme];
  const heatId = `heat${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const rows = data.length > 0 ? data : DEFAULT_DATA;
  const n = rows.length;
  const ai =
    accentIndex !== undefined && accentIndex >= 0 && accentIndex < n
      ? accentIndex
      : n - 1;
  const peak = Math.max(rows[ai].value, max * 1.02);
  const heroText = value ?? `${rows[ai].value}${unit}`;

  const boxL = width * 0.15;
  const boxR = width * 0.62;
  const bottom = height * 0.84;
  const ceiling = height * 0.13;
  const px = (bottom - ceiling) / peak;
  const boxT = bottom - max * px;
  const slot = (boxR - boxL) / (n + 0.6);
  const bw = Math.min(slot * 0.6, 96 * u);
  const barX = (i: number) => boxL + slot * (i + 0.8) - bw / 2;
  const aX = barX(ai);
  const sw = Math.max(1, 1.25 * u);

  const frameIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const gridIn = interpolate(t, [6, 20], [0, 1], CLAMP);
  const targetDraw = interpolate(t, [10, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const targetLab = interpolate(t, [24, 36], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const rest = rows.map((d, i) => {
    if (i === ai) return 0;
    const order = i < ai ? i : i - 1;
    return (
      d.value *
      interpolate(t, [18 + order * 4, 40 + order * 4], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      })
    );
  });

  const accentV = rows[ai].value;
  const breaks = accentV > max;
  const pressTo = breaks ? max : accentV;
  const phaseA = interpolate(t, [RISE, PRESS], [0, pressTo], {
    ...CLAMP,
    easing: PUSH,
  });
  const tension = breaks
    ? interpolate(t, [PRESS, BREAK], [0, 7 * u], {
        ...CLAMP,
        easing: Easing.bezier(0.55, 0, 1, 0.45),
      })
    : 0;
  const release = spring({
    frame: t - BREAK,
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.8 },
  });
  const broken = breaks && t >= BREAK;
  const aH = broken
    ? lerp(max * px + 7 * u, accentV * px, release)
    : phaseA * px + tension;
  const aVal = aH / px;
  const aTop = bottom - aH;

  const snap = breaks
    ? spring({
        frame: t - BREAK,
        fps,
        config: { damping: 11, stiffness: 260, mass: 0.5 },
      })
    : 0;
  const pad = 12 * u;
  const half = bw / 2 + pad * snap;
  const cx = aX + bw / 2;

  const slashIn = broken
    ? interpolate(snap, [0, 0.7], [0.4, 1], { ...CLAMP, easing: EASE_OUT })
    : 0;
  const slashLen = 16 * u;
  const slashDx = slashLen * 0.36;

  const hitAt = BREAK + 14;
  const hero = spring({
    frame: t - hitAt,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.7 },
  });
  const heroO = interpolate(t, [hitAt, hitAt + 7], [0, 1], CLAMP);
  const cap = interpolate(t, [hitAt + 8, hitAt + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const counterO =
    interpolate(t, [RISE + 4, RISE + 10], [0, 1], CLAMP) *
    interpolate(t, [hitAt - 4, hitAt + 2], [1, 0], CLAMP);

  const ty = bottom - target * px;
  const boxStop = Math.min(0.9, max / Math.max(accentV, max));
  const gridVals = [0, max / 3, (2 * max) / 3, max];
  const fmt = (v: number) => `${Math.round(v)}${v === 0 ? "" : unit}`;

  const leftW = lerp(0, boxR - boxL, frameIn);
  const upH = lerp(0, bottom - boxT, frameIn);
  const topDraw = interpolate(t, [8, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rightDraw = interpolate(t, [18, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          {/* gradients.sh "fluted": in-chart blue, overheating past the frame. */}
          <linearGradient
            id={heatId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={bottom}
            x2={0}
            y2={bottom - accentV * px}
          >
            <stop offset={0} stopColor="#1d2a8f" />
            <stop offset={boxStop * 0.55} stopColor={accent} />
            <stop offset={boxStop} stopColor="#2f7bff" />
            <stop offset={boxStop + 0.012} stopColor="#ff7a3d" />
            <stop offset={1} stopColor={p.heatTop} />
          </linearGradient>
        </defs>
        {gridVals.slice(1, -1).map((g) => (
          <line
            key={`g-${g}`}
            x1={boxL}
            x2={boxR}
            y1={bottom - g * px}
            y2={bottom - g * px}
            stroke={p.grid}
            strokeWidth={sw}
            opacity={gridIn}
          />
        ))}

        <line
          x1={boxL}
          x2={boxL}
          y1={bottom}
          y2={bottom - upH}
          stroke={p.frame}
          strokeWidth={sw}
        />
        {rightDraw > 0 && (
          <line
            x1={boxR}
            x2={boxR}
            y1={boxT}
            y2={lerp(boxT, bottom, rightDraw)}
            stroke={p.frame}
            strokeWidth={sw}
          />
        )}
        {topDraw > 0 && !broken && tension > 0 && (
          <polyline
            points={`${boxL},${boxT} ${aX},${boxT - tension} ${aX + bw},${boxT - tension} ${boxR},${boxT}`}
            fill="none"
            stroke={p.frame}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        )}
        {topDraw > 0 && (broken || tension <= 0) && (
          <>
            <line
              x1={boxL}
              x2={broken ? cx - half : lerp(boxL, boxR, topDraw)}
              y1={boxT}
              y2={boxT}
              stroke={p.frame}
              strokeWidth={sw}
            />
            {broken && (
              <line
                x1={cx + half}
                x2={lerp(boxL, boxR, topDraw)}
                y1={boxT}
                y2={boxT}
                stroke={p.frame}
                strokeWidth={sw}
              />
            )}
          </>
        )}

        {rows.map((d, i) => {
          if (i === ai) return null;
          const h = rest[i] * px;
          if (h <= 0.01) return null;
          return (
            <path
              key={`b-${d.label}`}
              d={barPath(barX(i), bottom, bw, h, 4 * u)}
              fill={p.bar}
            />
          );
        })}

        <line
          x1={boxL}
          x2={lerp(boxL, boxR, targetDraw)}
          y1={ty}
          y2={ty}
          stroke={p.target}
          strokeWidth={Math.max(1, 1.5 * u)}
          strokeDasharray={`${7 * u} ${6 * u}`}
        />

        {aH > 0.01 && (
          <path
            d={barPath(aX, bottom, bw, aH, 4 * u)}
            fill={`url(#${heatId})`}
          />
        )}

        {broken &&
          [cx - half, cx + half].map((x) => (
            <line
              key={`s-${x > cx ? "r" : "l"}`}
              x1={x - slashDx * slashIn}
              y1={boxT + (slashLen / 2) * slashIn}
              x2={x + slashDx * slashIn}
              y2={boxT - (slashLen / 2) * slashIn}
              stroke={p.fg}
              strokeWidth={Math.max(1, 1.6 * u)}
              strokeLinecap="round"
              opacity={slashIn}
            />
          ))}

        <line
          x1={boxL}
          x2={boxL + leftW}
          y1={bottom}
          y2={bottom}
          stroke={p.frame}
          strokeWidth={Math.max(1, 1.5 * u)}
        />
      </svg>

      {gridVals.map((g) => (
        <div
          key={`gl-${g}`}
          style={{
            position: "absolute",
            left: boxL - 150 * u,
            width: 150 * u - 14 * u,
            top: bottom - g * px - 10 * u,
            height: 20 * u,
            lineHeight: `${20 * u}px`,
            textAlign: "right",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 16 * u,
            fontVariantNumeric: "tabular-nums",
            color: p.muted,
            opacity: gridIn,
          }}
        >
          {fmt(g)}
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: boxR + 14 * u,
          top: ty - 10 * u,
          height: 20 * u,
          lineHeight: `${20 * u}px`,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 16 * u,
          color: p.fg,
          opacity: targetLab,
          transform: `translateX(${(1 - targetLab) * -6 * u}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {targetLabel}
      </div>

      {rows.map((d, i) => (
        <div
          key={`c-${d.label}`}
          style={{
            position: "absolute",
            left: barX(i) + bw / 2 - 80 * u,
            width: 160 * u,
            top: bottom + 14 * u,
            textAlign: "center",
            fontFamily: sans,
            fontWeight: i === ai ? 500 : 400,
            fontSize: 16 * u,
            color: i === ai ? p.fg : p.muted,
            opacity: interpolate(t, [6 + i * 2, 18 + i * 2], [0, 1], CLAMP),
          }}
        >
          {d.label}
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: aX,
          width: bw,
          top: aTop + 10 * u,
          textAlign: "center",
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 16 * u,
          letterSpacing: "0",
          fontVariantNumeric: "tabular-nums",
          color: broken ? "#2B1206" : "#FFFFFF",
          opacity: counterO * interpolate(aH, [36 * u, 48 * u], [0, 1], CLAMP),
          whiteSpace: "nowrap",
        }}
      >
        {`${Math.round(aVal)}${unit}`}
      </div>

      <div
        style={{
          position: "absolute",
          left: aX + bw + 30 * u,
          top: aTop - 10 * u,
          opacity: heroO,
          transform: `translateY(${(1 - hero) * 18 * u}px)`,
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 150 * u,
            lineHeight: 0.86,
            letterSpacing: "-0.04em",
            color: p.fg,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {heroText}
        </div>
        <div
          style={{
            marginTop: 16 * u,
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 24 * u,
            letterSpacing: "-0.01em",
            color: p.muted,
            opacity: cap,
            transform: `translateY(${(1 - cap) * 8 * u}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {caption}
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
