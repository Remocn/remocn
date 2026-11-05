"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface SparklineThreadProps {
  values?: number[];
  metric?: string;
  label?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_VALUES = [20, 26, 24, 29, 35, 34, 41, 38, 49, 56, 53, 64, 70, 77];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "beam" palette: bg #02030a, [#f4f7ff, #8fb4ff, #3d5bff, #1a1660].
// It lives only in the hero series (stroke + area); everything else stays neutral.
const THEMES = {
  dark: {
    bg: "#02030a",
    fg: "#F3F2EF",
    muted: "#8B8C96",
    axis: "rgba(255,255,255,0.14)",
    thread: 0.78,
    stroke: ["#3d5bff", "#8fb4ff", "#f4f7ff"],
    area: [
      ["#8fb4ff", 0.42],
      ["#3d5bff", 0.26],
      ["#1a1660", 0],
    ],
    wash: "rgba(143,180,255,0.07)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    axis: "rgba(18,18,20,0.16)",
    thread: 0.7,
    stroke: ["#8fb4ff", "#3d5bff", "#1a1660"],
    area: [
      ["#3d5bff", 0.3],
      ["#8fb4ff", 0.2],
      ["#8fb4ff", 0],
    ],
    wash: "rgba(255,255,255,0.7)",
    grain: 0.045,
  },
} as const;

const POP = -6;
const POP_STAGGER = 2;
const THREAD = [22, 64] as const;
const THICKEN = [62, 84] as const;
const BLOOM = 82;

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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function monotone(pts: Array<[number, number]>) {
  const n = pts.length;
  if (n < 2) return pts;
  const dx = pts.slice(1).map((q, i) => q[0] - pts[i][0]);
  const sl = pts.slice(1).map((q, i) => (q[1] - pts[i][1]) / dx[i]);
  const m = pts.map((_, i) => {
    if (i === 0) return sl[0];
    if (i === n - 1) return sl[n - 2];
    if (sl[i - 1] * sl[i] <= 0) return 0;
    return (2 * sl[i - 1] * sl[i]) / (sl[i - 1] + sl[i]);
  });
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [, y1] = pts[i + 1];
    const h = dx[i];
    for (let k = 0; k < 16; k++) {
      const s = k / 16;
      const s2 = s * s;
      const s3 = s2 * s;
      const y =
        (2 * s3 - 3 * s2 + 1) * y0 +
        (s3 - 2 * s2 + s) * h * m[i] +
        (-2 * s3 + 3 * s2) * y1 +
        (s3 - s2) * h * m[i + 1];
      out.push([x0 + s * h, y]);
    }
  }
  out.push(pts[n - 1]);
  return out;
}

function cut(curve: Array<[number, number]>, x: number) {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < curve.length; i++) {
    const [cx, cy] = curve[i];
    if (cx <= x) {
      pts.push([cx, cy]);
      continue;
    }
    if (i > 0) {
      const [px, py] = curve[i - 1];
      const k = (x - px) / (cx - px);
      pts.push([x, py + (cy - py) * k]);
    }
    break;
  }
  return pts;
}

const toD = (pts: Array<[number, number]>) =>
  pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

function splitMetric(metric: string) {
  const m = metric.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!m) return null;
  const n = Number.parseFloat(m[2].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const decimals = (m[2].split(".")[1] ?? "").length;
  return { pre: m[1], n, post: m[3], decimals, grouped: m[2].includes(",") };
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function SparklineThread({
  values = DEFAULT_VALUES,
  metric = "+212%",
  label = "weekly renders",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: SparklineThreadProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = height / 720;
  const p = THEMES[theme];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const L = width * 0.07;
  const R = width * 0.54;
  const T = height * 0.3;
  const B = height * 0.7;
  const base = height * 0.8;

  const data = values.length >= 2 ? values : DEFAULT_VALUES;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const pts = data.map(
    (v, i) =>
      [
        lerp(L, R, i / (data.length - 1)),
        lerp(B, T, hi === lo ? 0.5 : (v - lo) / (hi - lo)),
      ] as [number, number],
  );
  const curve = monotone(pts);
  const last = pts[pts.length - 1];

  const threadX = interpolate(t, THREAD, [L, R], { ...CLAMP, easing: EASE_IO });
  const thickX = interpolate(t, THICKEN, [L, R], { ...CLAMP, easing: EASE_IO });
  const threadPts = cut(curve, threadX);
  const thickPts = cut(curve, thickX);
  const head = threadPts[threadPts.length - 1] ?? pts[0];
  const headO =
    interpolate(t, [THREAD[0], THREAD[0] + 4], [0, 1], CLAMP) *
    interpolate(t, [THREAD[1] - 4, THREAD[1] + 2], [1, 0], CLAMP);

  const bloom = spring({
    frame: t - BLOOM,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.7 },
  });
  const ring = interpolate(t, [BLOOM, BLOOM + 28], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const leader = interpolate(t, [BLOOM + 2, BLOOM + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const numIn = interpolate(t, [BLOOM + 6, BLOOM + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [BLOOM + 6, BLOOM + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labIn = interpolate(t, [BLOOM + 16, BLOOM + 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const fillIn = interpolate(
    t,
    [THICKEN[0] + 6, THICKEN[1] + 10],
    [0, 1],
    CLAMP,
  );

  const parts = splitMetric(metric);
  const shown = parts
    ? `${parts.pre}${(parts.n * count).toLocaleString("en-US", {
        minimumFractionDigits: parts.decimals,
        maximumFractionDigits: parts.decimals,
        useGrouping: parts.grouped,
      })}${parts.post}`
    : metric;

  const metricX = R + width * 0.055;
  const numSize = 136 * u;
  const fillD =
    thickPts.length > 1
      ? `${toD(thickPts)} L${thickPts[thickPts.length - 1][0].toFixed(2)} ${base.toFixed(2)} L${L.toFixed(2)} ${base.toFixed(2)} Z`
      : "";

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle ${height * 0.55}px at ${t < BLOOM ? head[0] : last[0]}px ${t < BLOOM ? head[1] : last[1]}px, ${p.wash}, transparent 100%)`,
        }}
      />
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={`${id}f`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={T}
            x2={0}
            y2={base}
          >
            {p.area.map(([c, o], i) => (
              <stop
                key={`${c}${i}`}
                offset={i / (p.area.length - 1)}
                stopColor={c}
                stopOpacity={o}
              />
            ))}
          </linearGradient>
          <linearGradient
            id={`${id}s`}
            gradientUnits="userSpaceOnUse"
            x1={L}
            y1={B}
            x2={R}
            y2={T}
          >
            {p.stroke.map((c, i) => (
              <stop
                key={`${c}${i}`}
                offset={i / (p.stroke.length - 1)}
                stopColor={c}
              />
            ))}
          </linearGradient>
          <radialGradient id={`${id}h`}>
            <stop offset="0" stopColor={p.stroke[1]} stopOpacity={0.32} />
            <stop offset="1" stopColor={p.stroke[1]} stopOpacity={0} />
          </radialGradient>
        </defs>

        <line
          x1={L}
          y1={base}
          x2={interpolate(t, [0, 26], [lerp(L, R, 0.3), R], {
            ...CLAMP,
            easing: EASE_OUT,
          })}
          y2={base}
          stroke={p.axis}
          strokeWidth={Math.max(1, u)}
        />
        {pts.map(([x], i) => {
          const a = interpolate(
            t,
            [POP + i * POP_STAGGER, POP + i * POP_STAGGER + 8],
            [0, 1],
            CLAMP,
          );
          return (
            <line
              key={`tick-${x}`}
              x1={x}
              y1={base}
              x2={x}
              y2={base + 7 * u}
              stroke={p.axis}
              strokeWidth={Math.max(1, u)}
              opacity={a}
            />
          );
        })}

        {fillD && <path d={fillD} fill={`url(#${id}f)`} opacity={fillIn} />}

        {threadPts.length > 1 && (
          <path
            d={toD(threadPts)}
            fill="none"
            stroke={p.fg}
            strokeOpacity={p.thread}
            strokeWidth={1.3 * u}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {thickPts.length > 1 && (
          <path
            d={toD(thickPts)}
            fill="none"
            stroke={`url(#${id}s)`}
            strokeWidth={3.6 * u}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {pts.map(([x, y], i) => {
          const isLast = i === pts.length - 1;
          const pop = spring({
            frame: t - POP - i * POP_STAGGER,
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.6 },
          });
          const o = interpolate(
            t,
            [POP + i * POP_STAGGER, POP + i * POP_STAGGER + 5],
            [0, 1],
            CLAMP,
          );
          const threaded = interpolate(
            threadX - x,
            [0, 2 * u, 40 * u],
            [0, 1, 0],
            CLAMP,
          );
          const absorbed =
            isLast || t < THICKEN[0]
              ? 0
              : interpolate(thickX - x, [-6 * u, 10 * u], [0, 1], CLAMP);
          const r =
            4 * u * (0.5 + 0.5 * pop) * (1 + 0.45 * threaded) * (1 - absorbed);
          if (isLast && t >= BLOOM) return null;
          return (
            <circle
              key={`dot-${x}`}
              cx={x}
              cy={y}
              r={Math.max(0, r)}
              fill={absorbed > 0 ? p.stroke[1] : p.fg}
              opacity={o}
            />
          );
        })}

        <circle
          cx={head[0]}
          cy={head[1]}
          r={16 * u}
          fill={`url(#${id}h)`}
          opacity={headO}
        />
        <circle
          cx={head[0]}
          cy={head[1]}
          r={2.6 * u}
          fill={p.fg}
          opacity={headO}
        />

        {t >= BLOOM && (
          <g>
            <circle
              cx={last[0]}
              cy={last[1]}
              r={30 * u}
              fill={`url(#${id}h)`}
              opacity={bloom}
            />
            <circle
              cx={last[0]}
              cy={last[1]}
              r={lerp(8, 52, ring) * u}
              fill="none"
              stroke={accent}
              strokeWidth={1.4 * u}
              opacity={(1 - ring) * 0.75}
            />
            <line
              x1={last[0] + 14 * u}
              y1={last[1]}
              x2={lerp(last[0] + 14 * u, metricX - 18 * u, leader)}
              y2={last[1]}
              stroke={p.fg}
              strokeOpacity={0.3}
              strokeWidth={Math.max(1, u)}
              strokeDasharray={`${2 * u} ${5 * u}`}
              strokeLinecap="round"
            />
            <circle
              cx={last[0]}
              cy={last[1]}
              r={lerp(4, 8, bloom) * u}
              fill={p.bg}
              stroke={p.stroke[2]}
              strokeWidth={3 * u}
            />
            <circle
              cx={last[0]}
              cy={last[1]}
              r={lerp(0, 3, bloom) * u}
              fill={p.stroke[2]}
            />
          </g>
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          left: metricX,
          top: last[1] - numSize * 0.52,
          opacity: numIn,
          transform: `translateX(${(1 - numIn) * -22 * u}px)`,
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontWeight: 400,
            fontSize: numSize,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: p.fg,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {shown}
        </div>
        <div
          style={{
            marginTop: 18 * u,
            marginLeft: 6 * u,
            fontFamily: mono,
            fontWeight: 400,
            fontSize: 18 * u,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: p.muted,
            opacity: labIn,
            transform: `translateY(${(1 - labIn) * 8 * u}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      </div>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, ${p.bg} 100%)`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
