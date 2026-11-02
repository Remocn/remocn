"use client";

import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
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

export interface GrowthMilestone {
  /**
   * Position along the curve, 0..1. Omit it when the label is a number ("10k"):
   * the dot then sits where the curve actually crosses that value.
   */
  at?: number;
  label: string;
}

export interface GrowthLineProps {
  /** The number that lands at the tip. */
  value?: string;
  /** Muted line under the value. */
  label?: string;
  milestones?: GrowthMilestone[];
  /** How hard the curve bends upward: 2 = gentle, 6 = hockey stick. */
  steepness?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_MILESTONES: GrowthMilestone[] = [
  { at: 0.03, label: "Launch" },
  { label: "1k" },
  { label: "10k" },
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
    axis: "rgba(255,255,255,0.16)",
    dot: "rgba(255,255,255,0.07)",
    wash: "rgba(255,122,61,0.07)",
    tail: 0.35,
    fill: 0.26,
    grain: 0.06,
    /** gradients.sh "fluted" (#1d2a8f #2f7bff #ff7a3d #ffe2c4): cool start, hot tip */
    line: ["#3346C8", "#2F7BFF", "#FF7A3D", "#FFE2C4"],
    tip: "#FFB27F",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    axis: "rgba(18,18,20,0.16)",
    dot: "rgba(18,18,20,0.08)",
    wash: "rgba(255,255,255,0.7)",
    tail: 0.4,
    fill: 0.22,
    grain: 0.045,
    line: ["#1D2A8F", "#2F7BFF", "#FF7A3D", "#E2551C"],
    tip: "#FF7A3D",
  },
} as const;

/** Beats, in frames at speed 1. */
const DRAW = [-4, 118] as const;
const PULL = [84, 128] as const;
const HIT = 120;
const DRAW_EASE = Easing.bezier(0.3, 0.05, 0.55, 1);

const drawProgress = (t: number) =>
  interpolate(t, DRAW, [0, 1], { ...CLAMP, easing: DRAW_EASE });

/** The frame at which the tip reaches `at` (inverts the draw easing). */
function reachFrame(at: number) {
  for (let fr = DRAW[0]; fr <= DRAW[1]; fr += 0.5) {
    if (drawProgress(fr) >= at) return fr;
  }
  return DRAW[1];
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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** "100k" -> 100000, "1.2M" -> 1200000, "10,000" -> 10000. */
function parseValue(v: string) {
  const m = v.replace(/,/g, "").match(/([\d.]+)\s*([kKmMbB]?)/);
  if (!m) return null;
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[m[2].toLowerCase()] ?? 1;
  return n * mult;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function GrowthLine({
  value = "100k",
  label = "creators in the first year",
  milestones = DEFAULT_MILESTONES,
  steepness = 4.6,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: GrowthLineProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = height / 720;
  const p = THEMES[theme];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // World: the full curve as it sits in the final, pulled-back frame.
  const L = width * 0.1;
  const Rr = width * 0.84;
  const B = height * 0.84;
  const T = height * 0.2;
  const k = steepness;
  const base = (x: number) => (Math.exp(k * x) - 1) / (Math.exp(k) - 1);
  const f = (x: number) => {
    // a little organic texture that calms down as the curve takes off
    const wob =
      0.008 * Math.sin(x * 31 + 1.3) * Math.sin(x * 7.3 + 0.4) * (1 - x) +
      0.004 * Math.sin(x * 67 + 2.1) * (1 - x);
    return Math.max(0, base(x) + wob * Math.min(1, x * 6));
  };
  const world = (x: number): [number, number] => [
    lerp(L, Rr, x),
    lerp(B, T, f(x)),
  ];

  // Tip progress
  const prog = drawProgress(t);
  const [tipWx, tipWy] = world(prog);

  // Camera: tracks the tip close-up, then pulls back to the whole curve.
  const pull = interpolate(t, PULL, [0, 1], { ...CLAMP, easing: EASE_IO });
  const zTrack = interpolate(t, [0, PULL[0]], [2.9, 2.2], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const kick =
    1 +
    0.014 *
      interpolate(t, [HIT, HIT + 4, HIT + 22], [0, 1, 0], {
        ...CLAMP,
        easing: EASE_OUT,
      });
  const z = lerp(zTrack, 1, pull) * kick;
  // the tip rides low-left of centre early on, drifting up as the curve steepens
  const anchorX = width * lerp(0.56, 0.6, prog);
  const anchorY = height * lerp(0.6, 0.66, prog);
  const cx = lerp(tipWx, width / 2, pull);
  const cy = lerp(tipWy, height / 2, pull);
  const ax = lerp(anchorX, width / 2, pull);
  const ay = lerp(anchorY, height / 2, pull);
  const proj = (wx: number, wy: number): [number, number] => [
    (wx - cx) * z + ax,
    (wy - cy) * z + ay,
  ];

  // Curve path, screen space
  const N = 220;
  const pts: Array<[number, number]> = [];
  const steps = Math.max(2, Math.ceil(N * prog));
  for (let i = 0; i <= steps; i++) {
    const [wx, wy] = world((prog * i) / steps);
    pts.push(proj(wx, wy));
  }
  const d = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const [sx0, sy0] = proj(L, B);
  const [sxr] = proj(Rr, B);
  const [tipX, tipY] = proj(tipWx, tipWy);
  const fillD = `${d} L${tipX.toFixed(2)} ${sy0.toFixed(2)} L${pts[0][0].toFixed(2)} ${sy0.toFixed(2)} Z`;
  const [, syTop] = proj(L, T);

  // Parallax dot grid behind the line (moves at a fraction of the camera)
  const zp = 1 + (z - 1) * 0.45;
  const gap = 44 * u * zp;
  const gx = (((ax - cx * zp) % gap) + gap) % gap;
  const gy = (((ay - cy * zp) % gap) + gap) % gap;

  const enter = interpolate(t, [0, 10], [0.55, 1], CLAMP);

  // A running count rides just ahead of the tip and hands off to the value.
  const target = parseValue(value);
  const marks = milestones.flatMap((m) => {
    if (m.at !== undefined) return [{ at: m.at, label: m.label }];
    const v = parseValue(m.label);
    if (v === null || target === null || v <= 0 || v >= target) return [];
    // invert the base curve: x where f(x) = v / target
    const at = Math.log(1 + (v / target) * (Math.exp(k) - 1)) / k;
    return [{ at, label: m.label }];
  });
  const count = target === null ? null : Math.round(target * base(prog));
  const countO =
    interpolate(t, [0, 6], [0.4, 1], CLAMP) *
    interpolate(t, [HIT - 4, HIT + 2], [1, 0], CLAMP);

  // Final hit
  const hit = spring({
    frame: t - HIT,
    fps,
    config: { damping: 15, stiffness: 170, mass: 0.7 },
  });
  const hitO = interpolate(t, [HIT, HIT + 6], [0, 1], CLAMP);
  const ring = interpolate(t, [HIT, HIT + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lab = interpolate(t, [HIT + 8, HIT + 28], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const valueSize = 128 * u;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      {/* depth: a sparse dot plane that drifts slower than the line */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle at center, ${p.dot} ${1.1 * u}px, transparent ${1.7 * u}px)`,
          backgroundSize: `${gap}px ${gap}px`,
          backgroundPosition: `${gx - gap / 2}px ${gy - gap / 2}px`,
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 100%)",
          opacity: enter,
        }}
      />
      {/* soft light that follows the tip */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle ${height * 0.5}px at ${tipX}px ${tipY}px, ${p.wash}, transparent 100%)`,
        }}
      />

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, opacity: enter }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={`${id}s`}
            gradientUnits="userSpaceOnUse"
            x1={pts[0][0]}
            y1={pts[0][1]}
            x2={tipX}
            y2={tipY}
          >
            <stop offset="0" stopColor={p.line[0]} stopOpacity={p.tail} />
            <stop offset="0.42" stopColor={p.line[1]} stopOpacity={0.9} />
            <stop offset="0.86" stopColor={p.line[2]} stopOpacity={1} />
            <stop offset="1" stopColor={p.line[3]} stopOpacity={1} />
          </linearGradient>
          {/* area: the same palette left to right, faded out toward the axis */}
          <linearGradient
            id={`${id}f`}
            gradientUnits="userSpaceOnUse"
            x1={pts[0][0]}
            y1={0}
            x2={tipX}
            y2={0}
          >
            <stop offset="0" stopColor={p.line[0]} />
            <stop offset="0.5" stopColor={p.line[1]} />
            <stop offset="1" stopColor={p.line[2]} />
          </linearGradient>
          <linearGradient
            id={`${id}v`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={Math.min(tipY, syTop)}
            x2={0}
            y2={sy0}
          >
            <stop offset="0" stopColor="#fff" stopOpacity={p.fill} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={`${id}m`} maskUnits="userSpaceOnUse">
            <rect
              x={0}
              y={Math.min(tipY, syTop) - 10}
              width={width}
              height={height * 4}
              fill={`url(#${id}v)`}
            />
          </mask>
          <radialGradient id={`${id}h`}>
            <stop offset="0" stopColor={p.line[2]} stopOpacity={0.3} />
            <stop offset="1" stopColor={p.line[2]} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* hairline axes */}
        <line
          x1={sx0}
          y1={sy0}
          x2={sxr}
          y2={sy0}
          stroke={p.axis}
          strokeWidth={Math.max(1, u)}
        />
        <line
          x1={sx0}
          y1={sy0}
          x2={sx0}
          y2={syTop}
          stroke={p.axis}
          strokeWidth={Math.max(1, u)}
        />

        <path d={fillD} fill={`url(#${id}f)`} mask={`url(#${id}m)`} />
        <path
          d={d}
          fill="none"
          stroke={`url(#${id}s)`}
          strokeWidth={3 * u}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* milestones */}
        {marks.map((m) => {
          const [mx, my] = proj(...world(m.at));
          const reach = reachFrame(m.at);
          const pop = spring({
            frame: t - reach,
            fps,
            config: { damping: 13, stiffness: 190, mass: 0.6 },
          });
          if (t < reach) return null;
          return (
            <g key={m.label}>
              <circle
                cx={mx}
                cy={my}
                r={5.5 * u * (0.6 + 0.4 * pop)}
                fill={p.bg}
                stroke={accent}
                strokeWidth={2.2 * u}
                opacity={Math.min(1, pop * 1.5)}
              />
            </g>
          );
        })}

        {/* tip */}
        <circle cx={tipX} cy={tipY} r={18 * u} fill={`url(#${id}h)`} />
        <circle
          cx={tipX}
          cy={tipY}
          r={lerp(6, 40, ring) * u}
          fill="none"
          stroke={p.line[2]}
          strokeWidth={1.5 * u}
          opacity={t >= HIT ? (1 - ring) * 0.7 : 0}
        />
        <circle cx={tipX} cy={tipY} r={5 * u} fill={p.tip} />
        <circle cx={tipX} cy={tipY} r={1.8 * u} fill={p.bg} opacity={0.9} />
      </svg>

      {/* milestone labels: screen-space type, upper-left of the dot */}
      {marks.map((m) => {
        const [mx, my] = proj(...world(m.at));
        const reach = reachFrame(m.at);
        const a = interpolate(t, [reach + 1, reach + 14], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        // labels quiet down once the camera pulls back so the value owns the frame
        const quiet = interpolate(t, [HIT - 6, HIT + 14], [1, 0.55], CLAMP);
        return (
          <div
            key={m.label}
            style={{
              position: "absolute",
              left: mx - 200 * u,
              top: my - 46 * u,
              width: 200 * u + 6 * u,
              textAlign: "right",
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 17 * u,
              letterSpacing: "-0.01em",
              color: p.fg,
              opacity: a * quiet,
              transform: `translateY(${(1 - a) * 10 * u}px)`,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {m.label}
          </div>
        );
      })}

      {count !== null && (
        <div
          style={{
            position: "absolute",
            left: tipX + 14 * u,
            top: tipY - 34 * u,
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 16 * u,
            letterSpacing: "-0.01em",
            color: p.muted,
            fontVariantNumeric: "tabular-nums",
            opacity: countO,
            whiteSpace: "nowrap",
          }}
        >
          {count.toLocaleString("en-US")}
        </div>
      )}

      {/* the value lands at the tip */}
      <div
        style={{
          position: "absolute",
          right: width - tipX + 78 * u,
          top: tipY - 16 * u,
          textAlign: "right",
          opacity: hitO,
          transform: `translateY(${(1 - hit) * 26 * u}px) scale(${1.06 - 0.06 * hit})`,
          transformOrigin: "100% 0%",
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 400,
            fontSize: valueSize,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
            color: p.fg,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: 14 * u,
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 20 * u,
            letterSpacing: "-0.01em",
            color: p.muted,
            opacity: lab,
            transform: `translateY(${(1 - lab) * 10 * u}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      </div>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, ${p.bg} 100%)`,
          opacity: 0.7,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
