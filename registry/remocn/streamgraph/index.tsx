"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
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

const { fontFamily: sans } = loadBricolage("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: manrope } = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface StreamSeries {
  label: string;
  values: number[];
}

export interface StreamgraphProps {
  series?: StreamSeries[];
  highlight?: number;
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_SERIES: StreamSeries[] = [
  {
    label: "Kitebase",
    values: [12, 14, 17, 19, 18, 16, 17, 19, 18, 16, 15, 15, 14, 13, 13, 12],
  },
  {
    label: "Lumen",
    values: [9, 10, 12, 14, 15, 13, 12, 13, 14, 13, 11, 10, 10, 9, 9, 9],
  },
  {
    label: "remocn",
    values: [2, 2, 3, 4, 5, 7, 9, 11, 13, 16, 19, 22, 25, 28, 31, 33],
  },
  {
    label: "Fernway",
    values: [11, 12, 12, 10, 11, 13, 13, 11, 10, 11, 10, 9, 9, 8, 8, 8],
  },
  {
    label: "Quarry",
    values: [7, 8, 10, 11, 9, 8, 9, 10, 9, 8, 8, 7, 7, 7, 7, 7],
  },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GROW = Easing.bezier(0.42, 0, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    grays: ["#5E5D63", "#3B3A40", "#4C4B51", "#2F2E34"],
    hair: "rgba(255,255,255,0.28)",
    grain: 0.06,
    // gradients.sh "beam": bg #02030a, [#f4f7ff, #8fb4ff, #3d5bff, #1a1660]
    beam: ["#1a1660", "#3d5bff", "#7f9dff", "#b9cdff"],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    grays: ["#A9A7A1", "#D2D0CA", "#BEBCB6", "#DEDCD6"],
    hair: "rgba(18,18,20,0.3)",
    grain: 0.045,
    beam: ["#1a1660", "#2c3fd6", "#3d5bff", "#8fb4ff"],
  },
} as const;

const GROW = [-16, 82] as const;
const TIP = 0.12;
const HIT = 82;
const SAMPLES = 220;

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
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** The remocn.dev logo: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
        whiteSpace: "nowrap",
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

function sampleValues(values: number[], u: number) {
  const m = values.length;
  if (m === 0) return 0;
  if (m === 1) return Math.max(0, values[0]);
  const s = Math.min(1, Math.max(0, u)) * (m - 1);
  const i = Math.min(m - 2, Math.floor(s));
  const f = s - i;
  const p0 = values[Math.max(0, i - 1)];
  const p1 = values[i];
  const p2 = values[i + 1];
  const p3 = values[Math.min(m - 1, i + 2)];
  const v =
    0.5 *
    (2 * p1 +
      (-p0 + p2) * f +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f +
      (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
  return Math.max(0, v);
}

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

export function Streamgraph({
  series = DEFAULT_SERIES,
  highlight = 2,
  label = "of new projects",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: StreamgraphProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const list = series.slice(0, 6);
  const hl = Math.min(Math.max(0, Math.round(highlight)), list.length - 1);

  const x0 = width * 0.105;
  const x1 = width * 0.69;
  const cy = height / 2;
  const maxH = height * 0.54;

  let peak = 0;
  for (let i = 0; i <= 48; i++) {
    const sum = list.reduce((s, x) => s + sampleValues(x.values, i / 48), 0);
    peak = Math.max(peak, sum);
  }
  const scale = peak > 0 ? maxH / peak : 0;

  const wave = (uu: number) =>
    height * 0.022 * Math.sin(Math.PI * 2 * 0.9 * uu + 0.4);
  const front = interpolate(t, GROW, [0, 1 + TIP], {
    ...CLAMP,
    easing: EASE_GROW,
  });
  const reach = Math.min(1, front);
  const steps = Math.max(2, Math.ceil(SAMPLES * reach));
  const span = x1 - x0;
  const fx = x0 + span * front;
  const feather = span * TIP * 0.6;
  const fEnd = Math.max(fx, x0 + 1);
  const stop = (x: number) => Math.min(1, Math.max(0, (x - x0) / (fEnd - x0)));
  const inStop = stop(x0 + span * 0.14);
  const outStop = Math.max(inStop, stop(fx - feather));
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const columns = Array.from({ length: steps + 1 }, (_, j) => {
    const uu = (reach * j) / steps;
    const env =
      (0.3 + 0.7 * Math.sin((Math.PI / 2) * smooth(0, 0.2, uu))) *
      (1 - 0.6 * smooth(front - TIP, front, uu));
    const vals = list.map((s) => sampleValues(s.values, uu) * env * scale);
    const total = vals.reduce((a, b) => a + b, 0);
    const edges = [cy + wave(uu) - total / 2];
    for (const v of vals) edges.push(edges[edges.length - 1] + v);
    return { x: x0 + (x1 - x0) * uu, edges };
  });

  const layerPath = (k: number) => {
    const top = columns.map(
      (c, j) => `${j ? "L" : "M"}${c.x.toFixed(2)} ${c.edges[k].toFixed(2)}`,
    );
    const bottom = [...columns]
      .reverse()
      .map((c) => `L${c.x.toFixed(2)} ${c.edges[k + 1].toFixed(2)}`);
    return `${top.join(" ")} ${bottom.join(" ")} Z`;
  };

  const endVals = list.map((s) => sampleValues(s.values, 1));
  const endTotal = endVals.reduce((a, b) => a + b, 0) || 1;
  const share = endVals[hl] / endTotal;
  const endTop = cy + wave(1) - (endTotal * scale) / 2;
  let hlTop = endTop;
  for (let i = 0; i < hl; i++) hlTop += endVals[i] * scale;
  const hlMid = hlTop + (endVals[hl] * scale) / 2;

  const dim = interpolate(t, [HIT - 6, HIT + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
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
  const count = interpolate(t, [HIT, HIT + 28], [0.6, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const lead = interpolate(t, [HIT - 4, HIT + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cap = interpolate(t, [HIT + 10, HIT + 28], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const push = interpolate(t, [0, 150], [0.965, 1.005], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stage = interpolate(t, [0, 8], [0.5, 1], CLAMP);

  const sheen = interpolate(t, [0, 150], [0, 1], { ...CLAMP, easing: EASE_IO });

  let grayIdx = 0;
  const colors = list.map((_, i) =>
    i === hl ? accent : p.grays[grayIdx++ % p.grays.length],
  );

  const numSize = 144 * u;
  const numLeft = x1 + 44 * u;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: "45% 50%",
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
              id={`${id}g`}
              gradientUnits="userSpaceOnUse"
              x1={x0}
              y1={0}
              x2={fEnd}
              y2={0}
            >
              <stop offset={0} stopColor="#fff" stopOpacity={0} />
              <stop offset={inStop} stopColor="#fff" stopOpacity={1} />
              <stop offset={outStop} stopColor="#fff" stopOpacity={1} />
              <stop offset={1} stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <linearGradient
              id={`${id}b`}
              gradientUnits="userSpaceOnUse"
              x1={x0 + span * 0.08}
              y1={hlMid + height * 0.12}
              x2={x1}
              y2={hlMid - height * 0.06}
            >
              <stop offset={0} stopColor={p.beam[0]} />
              <stop offset={0.42 - 0.06 * sheen} stopColor={p.beam[1]} />
              <stop offset={0.8 - 0.04 * sheen} stopColor={p.beam[2]} />
              <stop offset={1} stopColor={p.beam[3]} />
            </linearGradient>
            <mask id={`${id}m`}>
              <rect width={width} height={height} fill={`url(#${id}g)`} />
            </mask>
          </defs>
          <g mask={`url(#${id}m)`}>
            {list.map((s, k) => (
              <path
                key={s.label}
                d={layerPath(k)}
                fill={k === hl ? `url(#${id}b)` : colors[k]}
                stroke={p.bg}
                strokeWidth={2 * u}
                strokeLinejoin="round"
                opacity={k === hl ? 1 : 1 - 0.38 * dim}
              />
            ))}
          </g>
          <line
            x1={x1 + 12 * u}
            y1={hlMid}
            x2={x1 + 12 * u + 20 * u * lead}
            y2={hlMid}
            stroke={accent}
            strokeWidth={Math.max(1, 1.5 * u)}
            opacity={lead}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            left: numLeft,
            top: hlMid,
            transform: `translateY(${-numSize * 0.47}px)`,
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontWeight: 400,
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
            {Math.round(share * 100 * count)}
            <span
              style={{
                fontSize: numSize * 0.5,
                letterSpacing: "-0.02em",
                marginLeft: numSize * 0.03,
                color: p.muted,
              }}
            >
              %
            </span>
          </div>
          <div
            style={{
              marginTop: 20 * u,
              marginLeft: numSize * 0.04,
              opacity: cap,
              transform: `translateY(${(1 - cap) * 8 * u}px)`,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 21 * u,
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {list[hl]?.label.toLowerCase() === "remocn" ? (
              <RemocnLogo fontSize={30 * u} color={p.fg} />
            ) : (
              <div style={{ color: p.fg, fontSize: 24 * u }}>
                {list[hl]?.label}
              </div>
            )}
            <div style={{ color: p.muted, marginTop: 6 * u }}>{label}</div>
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
