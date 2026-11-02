"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

/** gradients.sh "beam" palette: light to deep. The mid stop takes the accent. */
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

export interface SankeySource {
  label: string;
  value: number;
}

export interface SankeyFlowProps {
  sources?: SankeySource[];
  target?: string;
  total?: number;
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_SOURCES: SankeySource[] = [
  { label: "Kitebase", value: 4100 },
  { label: "Lumen", value: 3200 },
  { label: "Fernway", value: 2400 },
  { label: "Quarry", value: 1700 },
  { label: "Halcyon", value: 1000 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_FLOW = Easing.bezier(0.5, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    node: "#6E6D73",
    band: "#8B8A90",
    bandA: 0.26,
    accentA: 0.5,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    node: "#9C9A94",
    band: "#8E8C86",
    bandA: 0.28,
    accentA: 0.45,
    grain: 0.045,
  },
} as const;

const NODE_START = 2;
const NODE_STAGGER = 3;
const FLOW_START = 16;
const FLOW_STAGGER = 6;
const FLOW_LEN = 34;
const FEATHER = 0.16;

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
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
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function SankeyFlow({
  sources = DEFAULT_SOURCES,
  target = "remocn",
  total,
  label = "videos rendered",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SankeyFlowProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const list = sources.slice(0, 6);
  const sum = list.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  const shown = total ?? sum;

  const srcX = width * 0.25;
  const nodeW = 10 * u;
  const tgtX = width * 0.6;
  const tgtW = 14 * u;
  const cy = height / 2;
  const gap = 16 * u;
  const colH = height * 0.62;
  const scale = (colH - gap * (list.length - 1)) / sum;
  const tgtH = sum * scale;

  let sy = cy - colH / 2;
  let ty = cy - tgtH / 2;
  const nodes = list.map((s, i) => {
    const h = Math.max(0, s.value) * scale;
    const node = {
      ...s,
      i,
      y0: sy,
      y1: sy + h,
      t0: ty,
      t1: ty + h,
      inAt: NODE_START + i * NODE_STAGGER,
      flowAt: FLOW_START + i * FLOW_STAGGER,
    };
    sy += h + gap;
    ty += h;
    return node;
  });

  const xs = srcX + nodeW;
  const xt = tgtX;
  const mx = (xs + xt) / 2;
  const L = xt - xs;
  const lastFlow = FLOW_START + (list.length - 1) * FLOW_STAGGER + FLOW_LEN;
  const HIT = lastFlow - 4;

  const land = spring({
    frame: t - HIT,
    fps,
    config: { damping: 18, stiffness: 150, mass: 0.8 },
  });
  const landO = interpolate(t, [HIT, HIT + 8], [0, 1], CLAMP);
  const blur = interpolate(t, [HIT, HIT + 14], [1, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [HIT, HIT + 26], [0.82, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const cap = interpolate(t, [HIT + 10, HIT + 28], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settle = interpolate(t, [HIT - 4, HIT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const push = interpolate(t, [0, 150], [0.965, 1.005], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stage = interpolate(t, [0, 8], [0.5, 1], CLAMP);

  const numSize = 136 * u;
  const blockLeft = tgtX + tgtW + 40 * u;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: "50% 50%",
          opacity: stage,
        }}
      >
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
              x1={xs}
              y1={0}
              x2={xt}
              y2={0}
            >
              <stop
                offset={0}
                stopColor={p.band}
                stopOpacity={p.bandA * (1 - 0.2 * settle)}
              />
              <stop
                offset={0.34}
                stopColor={p.band}
                stopOpacity={p.bandA * (1 - 0.2 * settle)}
              />
              <stop
                offset={0.62}
                stopColor={theme === "dark" ? BEAM[2] : BEAM[1]}
                stopOpacity={theme === "dark" ? 0.38 + 0.12 * settle : 0.6}
              />
              <stop
                offset={0.86}
                stopColor={accent}
                stopOpacity={0.78 + 0.12 * settle}
              />
              <stop
                offset={1}
                stopColor={theme === "dark" ? BEAM[1] : BEAM[2]}
                stopOpacity={0.9 + 0.1 * settle}
              />
            </linearGradient>
            <linearGradient
              id={`${id}t`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={nodes[0]?.t0 ?? 0}
              x2={0}
              y2={nodes[nodes.length - 1]?.t1 ?? height}
            >
              <stop
                offset={0}
                stopColor={theme === "dark" ? BEAM[0] : BEAM[1]}
              />
              <stop
                offset={0.4}
                stopColor={theme === "dark" ? BEAM[1] : accent}
              />
              <stop
                offset={1}
                stopColor={theme === "dark" ? accent : BEAM[3]}
              />
            </linearGradient>
            {nodes.map((n) => {
              const front = interpolate(
                t,
                [n.flowAt, n.flowAt + FLOW_LEN],
                [0, 1 + FEATHER],
                { ...CLAMP, easing: EASE_FLOW },
              );
              const fx = xs + L * Math.max(front, 0.001);
              const soft = Math.max(0, 1 - (L * FEATHER) / (fx - xs));
              return (
                <linearGradient
                  key={n.label}
                  id={`${id}m${n.i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={xs}
                  y1={0}
                  x2={fx}
                  y2={0}
                >
                  <stop offset={0} stopColor="#fff" stopOpacity={1} />
                  <stop offset={soft} stopColor="#fff" stopOpacity={1} />
                  <stop offset={1} stopColor="#fff" stopOpacity={0} />
                </linearGradient>
              );
            })}
            {nodes.map((n) => (
              <mask key={n.label} id={`${id}k${n.i}`}>
                <rect
                  x={0}
                  y={0}
                  width={width}
                  height={height}
                  fill={`url(#${id}m${n.i})`}
                />
              </mask>
            ))}
          </defs>

          {nodes.map((n) => {
            if (t < n.flowAt) return null;
            const d = [
              `M${xs} ${n.y0}`,
              `C${mx} ${n.y0} ${mx} ${n.t0} ${xt} ${n.t0}`,
              `L${xt} ${n.t1}`,
              `C${mx} ${n.t1} ${mx} ${n.y1} ${xs} ${n.y1}`,
              "Z",
            ].join(" ");
            return (
              <path
                key={n.label}
                d={d}
                fill={`url(#${id}f)`}
                stroke={p.bg}
                strokeWidth={1.5 * u}
                strokeLinejoin="round"
                mask={`url(#${id}k${n.i})`}
              />
            );
          })}

          {nodes.map((n) => {
            const k = interpolate(t, [n.inAt, n.inAt + 16], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const h = (n.y1 - n.y0) * (0.4 + 0.6 * k);
            const mid = (n.y0 + n.y1) / 2;
            return (
              <rect
                key={n.label}
                x={srcX}
                y={mid - h / 2}
                width={nodeW}
                height={h}
                rx={2 * u}
                fill={p.node}
                opacity={k}
              />
            );
          })}

          {nodes.map((n) => {
            const front = interpolate(
              t,
              [n.flowAt, n.flowAt + FLOW_LEN],
              [0, 1 + FEATHER],
              { ...CLAMP, easing: EASE_FLOW },
            );
            const a = interpolate(front, [0.9, 1.1], [0, 1], CLAMP);
            if (a <= 0) return null;
            const first = n.i === 0;
            const last = n.i === nodes.length - 1;
            return (
              <rect
                key={n.label}
                x={tgtX - (1 - a) * 6 * u}
                y={n.t0}
                width={tgtW}
                height={n.t1 - n.t0}
                rx={first || last ? 2 * u : 0}
                fill={`url(#${id}t)`}
                opacity={a}
              />
            );
          })}
        </svg>

        {nodes.map((n) => {
          const k = interpolate(t, [n.inAt + 2, n.inAt + 18], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          return (
            <div
              key={n.label}
              style={{
                position: "absolute",
                right: width - srcX + 16 * u,
                top: (n.y0 + n.y1) / 2,
                transform: `translate(${(1 - k) * 10 * u}px, -50%)`,
                opacity: k * (1 - 0.35 * settle),
                display: "flex",
                alignItems: "baseline",
                gap: 10 * u,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: 19 * u,
                  letterSpacing: "-0.01em",
                  color: p.fg,
                }}
              >
                {n.label}
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontWeight: 400,
                  fontSize: 14 * u,
                  color: p.muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(n.value)}
              </span>
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: blockLeft,
            top: cy,
            transform: `translateY(${-numSize * 0.62}px)`,
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontWeight: 500,
              fontSize: numSize,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              color: p.fg,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              opacity: landO,
              filter: blur > 0.01 ? `blur(${blur * 8 * u}px)` : undefined,
              transform: `translateX(${(1 - land) * -24 * u}px)`,
            }}
          >
            {fmt(shown * count)}
          </div>
          <div
            style={{
              marginTop: 22 * u,
              opacity: cap,
              transform: `translateY(${(1 - cap) * 8 * u}px)`,
              display: "flex",
              flexDirection: "column",
              gap: 10 * u,
              whiteSpace: "nowrap",
            }}
          >
            {target.trim().toLowerCase() === "remocn" ? (
              <RemocnLogo fontSize={26 * u} color={p.fg} />
            ) : (
              <div
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 24 * u,
                  letterSpacing: "-0.02em",
                  color: p.fg,
                }}
              >
                {target}
              </div>
            )}
            <div
              style={{
                fontFamily: mono,
                fontWeight: 400,
                fontSize: 14 * u,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: p.muted,
              }}
            >
              {label}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
