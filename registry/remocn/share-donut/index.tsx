"use client";

import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
loadDisplay("italic", { weights: ["300"], subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600, tracking-tight. */
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

const isBrand = (label: string) => label.trim().toLowerCase() === "remocn";

export interface DonutSegment {
  label: string;
  value: number;
}

export interface ShareDonutProps {
  segments?: DonutSegment[];
  highlight?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_SEGMENTS: DonutSegment[] = [
  { label: "remocn", value: 38 },
  { label: "Kitebase", value: 24 },
  { label: "Lumen", value: 17 },
  { label: "Fernway", value: 12 },
  { label: "Other", value: 9 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SEG = Easing.bezier(0.55, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.22)",
    track: "rgba(255,255,255,0.05)",
    grays: ["#B9B7B2", "#85848A", "#5C5B61", "#3E3D43"],
    // gradients.sh "halo": the highlighted share burns accent → rose → amber.
    halo: ["#E2457A", "#FFB36B"],
    haze: ["rgba(226,69,122,0.12)", "rgba(61,77,255,0.09)"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.22)",
    track: "rgba(18,18,20,0.05)",
    grays: ["#4F4D49", "#85837E", "#AEACA6", "#D0CEC8"],
    halo: ["#E2457A", "#FF9A4D"],
    haze: ["rgba(226,69,122,0.08)", "rgba(61,77,255,0.05)"],
    grain: 0.045,
  },
} as const;

const DRAW_START = 6;
const DRAW_LEN = 52;
const TAU = Math.PI * 2;

function pt(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = pt(cx, cy, r, a0);
  const e = pt(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
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
          seed={29}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function ShareDonut({
  segments = DEFAULT_SEGMENTS,
  highlight = 0,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ShareDonutProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const list = segments.slice(0, 5);
  const hl = Math.min(Math.max(0, Math.round(highlight)), list.length - 1);
  const total = list.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;

  const cx = width / 2;
  const cy = height / 2;
  const R = height * 0.3;
  const sw = 12 * u;
  const gapA = (6 * u) / R;

  let acc = 0;
  let grayIdx = 0;
  let clock = DRAW_START;
  const segs = list.map((s, i) => {
    const frac = Math.max(0, s.value) / total;
    const a0 = acc * TAU;
    acc += frac;
    const a1 = acc * TAU;
    const dur = Math.max(9, DRAW_LEN * frac);
    const start = clock;
    clock += dur - 2;
    const color = i === hl ? accent : p.grays[Math.min(grayIdx++, 3)];
    return {
      ...s,
      i,
      frac,
      a0: a0 + gapA / 2,
      a1: a1 - gapA / 2,
      mid: (a0 + a1) / 2,
      start,
      end: start + dur,
      color,
      pct: Math.round(frac * 100),
    };
  });
  const drawEnd = segs.length ? segs[segs.length - 1].end : DRAW_START;
  const HIT = drawEnd + 8;

  const detach = spring({
    frame: t - HIT,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.7 },
  });
  const dim = interpolate(t, [HIT, HIT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const land = interpolate(t, [HIT + 4, HIT + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [HIT + 4, HIT + 30], [0.55, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const labIn = interpolate(t, [HIT + 12, HIT + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const stage = interpolate(t, [0, 10], [0.4, 1], CLAMP);
  const spin = interpolate(t, [0, HIT + 10], [-14, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const push = interpolate(t, [0, HIT + 60], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = 0.97 + 0.04 * push;

  const target = segs[hl];
  const gradId = `h${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const g0 = target ? pt(cx, cy, R, target.a0) : { x: cx, y: cy - R };
  const g1 = target ? pt(cx, cy, R, target.a1) : { x: cx + R, y: cy };
  const off = detach * 18 * u;
  const hx = target ? Math.sin(target.mid) * off : 0;
  const hy = target ? -Math.cos(target.mid) * off : 0;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent ${R * 0.62}px, ${p.haze[0]} ${R * 1.02}px, ${p.haze[1]} ${R * 1.3}px, transparent ${R * 1.85}px)`,
          opacity: 0.25 + 0.75 * land,
          transform: `rotate(${spin}deg)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, opacity: stage }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={g0.x}
              y1={g0.y}
              x2={g1.x}
              y2={g1.y}
            >
              <stop offset="0" stopColor={accent} />
              <stop offset="0.58" stopColor={p.halo[0]} />
              <stop offset="1" stopColor={p.halo[1]} />
            </linearGradient>
          </defs>
          <g transform={`rotate(${spin} ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={R}
              fill="none"
              stroke={p.track}
              strokeWidth={sw}
              opacity={1 - dim}
            />
            {segs.map((s) => {
              const k = interpolate(t, [s.start, s.end], [0, 1], {
                ...CLAMP,
                easing: EASE_SEG,
              });
              if (k <= 0 || s.a1 <= s.a0) return null;
              const isHl = s.i === hl;
              const a1 = s.a0 + (s.a1 - s.a0) * k;
              return (
                <path
                  key={s.label}
                  d={arc(cx, cy, R, s.a0, a1)}
                  fill="none"
                  stroke={isHl ? `url(#${gradId})` : s.color}
                  strokeLinecap={isHl ? "round" : "butt"}
                  strokeWidth={isHl ? sw * (1 + 0.5 * detach) : sw}
                  opacity={isHl ? 1 : 1 - 0.5 * dim}
                  transform={isHl ? `translate(${hx} ${hy})` : undefined}
                />
              );
            })}
            {segs.map((s) => {
              const a = interpolate(t, [s.end - 6, s.end + 8], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              const p0 = pt(cx, cy, R + sw / 2 + 8 * u, s.mid);
              const p1 = pt(cx, cy, R + sw / 2 + 8 * u + 14 * u * a, s.mid);
              const fade = s.i === hl ? 1 - dim : 1 - 0.55 * dim;
              return (
                <line
                  key={s.label}
                  x1={p0.x}
                  y1={p0.y}
                  x2={p1.x}
                  y2={p1.y}
                  stroke={p.hair}
                  strokeWidth={Math.max(1, u)}
                  opacity={a * fade}
                />
              );
            })}
          </g>
        </svg>

        {segs.map((s) => {
          const a = interpolate(t, [s.end - 4, s.end + 12], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const ang = s.mid + (spin * Math.PI) / 180;
          const q = pt(cx, cy, R + sw / 2 + 38 * u + (1 - a) * -8 * u, ang);
          const right = Math.sin(ang) >= -0.05;
          const fade = s.i === hl ? 1 - dim : 1 - 0.6 * dim;
          return (
            <div
              key={s.label}
              style={{
                position: "absolute",
                left: q.x,
                top: q.y,
                transform: `translate(${right ? 0 : -100}%, -50%)`,
                display: "flex",
                flexDirection: "column",
                alignItems: right ? "flex-start" : "flex-end",
                gap: 2 * u,
                opacity: a * fade * stage,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 22 * u,
                  letterSpacing: "-0.02em",
                  color: p.fg,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.pct}%
              </span>
              {isBrand(s.label) ? (
                <RemocnLogo fontSize={15 * u} color={p.muted} />
              ) : (
                <span
                  style={{
                    fontFamily: sans,
                    fontWeight: 400,
                    fontSize: 15 * u,
                    color: p.muted,
                  }}
                >
                  {s.label}
                </span>
              )}
            </div>
          );
        })}

        {target ? (
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: display,
                fontWeight: 300,
                fontSize: 176 * u,
                lineHeight: 0.9,
                letterSpacing: "-0.035em",
                color: p.fg,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                opacity: land,
                filter:
                  land < 0.99 ? `blur(${(1 - land) * 8 * u}px)` : undefined,
                transform: `translateY(${(1 - land) * 22 * u}px) scale(${1.05 - 0.05 * land})`,
                marginTop: 10 * u,
              }}
            >
              {Math.round(target.pct * count)}
              <span
                style={{
                  fontSize: 92 * u,
                  fontStyle: "italic",
                  letterSpacing: "-0.02em",
                  marginLeft: 4 * u,
                  color: p.muted,
                }}
              >
                %
              </span>
            </div>
            <div
              style={{
                marginTop: 14 * u,
                display: "flex",
                alignItems: "center",
                gap: 10 * u,
                opacity: labIn,
                transform: `translateY(${(1 - labIn) * 8 * u}px)`,
              }}
            >
              {isBrand(target.label) ? (
                <RemocnLogo fontSize={28 * u} color={p.fg} />
              ) : (
                <>
                  <span
                    style={{
                      width: 10 * u,
                      height: 10 * u,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${accent}, ${p.halo[0]}, ${p.halo[1]})`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: sans,
                      fontWeight: 400,
                      fontSize: 22 * u,
                      letterSpacing: "-0.01em",
                      color: p.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {target.label}
                  </span>
                </>
              )}
            </div>
          </AbsoluteFill>
        ) : null}
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
