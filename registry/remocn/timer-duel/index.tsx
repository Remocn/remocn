"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const display = sans;

/** Space Grotesk 500 with tnum: digits 0.62em, ":" and "." 0.276em. */
const READ_TRACK = -0.02;
function readoutEm(text: string) {
  let w = 0;
  for (const ch of text) w += (/[0-9]/.test(ch) ? 0.62 : 0.276) + READ_TRACK;
  return w - READ_TRACK;
}

export interface TimerDuelProps {
  before?: number;
  after?: number;
  beforeLabel?: string;
  afterLabel?: string;
  delta?: string;
  accent?: string;
  /** Text color of the running timers; overrides the theme. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Space Grotesk by default. */
  fontFamily?: string;
  /** Frames the fast timer runs before it stops. */
  run?: number;
  /** Frames the slow timer takes to catch up after the fast one stops. */
  chase?: number;
  grain?: boolean;
  /** Size of the timers and delta, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const START = 18;
const RUN = 32;
const CHASE = 50;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    stage: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#85848A",
    dim: "#4A4A50",
    track: "rgba(243,242,239,0.12)",
    grain: 0.065,
    fluted:
      "linear-gradient(100deg, #2f7bff 0%, #6d7cf0 30%, #ff7a3d 72%, #ffe2c4 100%)",
    band: "linear-gradient(90deg, #1d2a8f 0%, #2f7bff 45%, #ff7a3d 100%)",
    glow: "color-mix(in oklab, #2f7bff 14%, transparent)",
  },
  light: {
    bg: "#F5F4F0",
    stage: "rgba(255,255,255,0.9)",
    fg: "#121214",
    muted: "#6E6C67",
    dim: "#B4B1A9",
    track: "rgba(18,18,20,0.12)",
    grain: 0.045,
    fluted: "linear-gradient(100deg, #1d2a8f 0%, #2f7bff 38%, #ff7a3d 100%)",
    band: "linear-gradient(90deg, #1d2a8f 0%, #2f7bff 45%, #ff7a3d 100%)",
    glow: "color-mix(in oklab, #ff7a3d 9%, transparent)",
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

function format(sec: number, long: boolean) {
  const s = Math.max(0, sec);
  if (long) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = Math.floor(s % 60);
    return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  const cs = Math.floor(s * 100 + 1e-6);
  const m = Math.floor(cs / 6000);
  const ss = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
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
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Readout({
  text,
  size,
  color,
  lead,
  sep,
  fontFamily,
}: {
  fontFamily: string;
  text: string;
  size: number;
  color: string;
  lead: string;
  sep: string;
}) {
  const cut = text.length - 4;
  let first = text.search(/[1-9]/);
  if (first < 0 || first > cut) first = cut;
  return (
    <div
      style={{
        fontFamily,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: `${READ_TRACK}em`,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}
    >
      {text.split("").map((ch, i) => {
        const isSep = ch === ":" || ch === ".";
        const c = i < first ? lead : isSep ? sep : color;
        return (
          <span key={`${i}-${ch}`} style={{ color: c }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
}

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

export function TimerDuel({
  before = 2718.4,
  after = 70.9,
  beforeLabel = "Before",
  afterLabel = "With remocn",
  delta,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = display,
  run = RUN,
  chase = CHASE,
  grain = true,
  scale = 1,
  delay = 0,
  theme = "dark",
  speed = 1,
}: TimerDuelProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const STOP_AFTER = START + run;
  const STOP_BEFORE = STOP_AFTER + chase;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p: Palette = THEMES[theme];
  const fg = ink ?? p.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? p.bg);
  const slow = Math.max(before, after * 1.5);
  const fast = Math.max(0.01, Math.min(after, before));
  const long = slow >= 3600;
  const ratio = slow / fast;
  const deltaText =
    delta ?? `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× faster`;

  const r0 = fast / run;
  const clock = (f: number) => {
    if (f <= START) return 0;
    if (f <= STOP_AFTER) return (f - START) * r0;
    const dt = Math.min(chase, f - STOP_AFTER);
    const k = EASE_IO(dt / chase);
    return fast + r0 * dt + (slow - fast - r0 * chase) * k;
  };
  const c = clock(t);
  const left = Math.min(slow, c);
  const right = Math.min(fast, c);

  const appear = (d: number) =>
    interpolate(t, [d, d + 18], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const rightStop = interpolate(
    t,
    [STOP_AFTER, STOP_AFTER + 2, STOP_AFTER + 16],
    [0, 1, 0],
    CLAMP,
  );
  const rightLit = t >= STOP_AFTER;
  const freeze = interpolate(t, [STOP_BEFORE + 2, STOP_BEFORE + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const leftStop = interpolate(
    t,
    [STOP_BEFORE, STOP_BEFORE + 2, STOP_BEFORE + 12],
    [0, 1, 0],
    CLAMP,
  );

  const rise = interpolate(t, [STOP_BEFORE + 6, STOP_BEFORE + 36], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const deltaIn = interpolate(t, [STOP_BEFORE + 14, STOP_BEFORE + 38], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const hold = interpolate(
    t,
    [STOP_BEFORE + 38, STOP_BEFORE + 120],
    [0, 1],
    CLAMP,
  );

  const size = Math.min(height * 0.16, width * 0.085);
  const sample = format(slow, long);
  const colW = size * (readoutEm(sample) + 0.08);
  const gapX = Math.max(width * 0.06, size * 0.6);
  const rowW = colW * 2 + gapX;
  // The row rises by transform, not `top`: layout rounds a box and a
  // baseline to whole pixels, so a row eased by `top` clicks up pixel by pixel.
  const rowY = height * 0.47;
  const rowLift = (height * 0.31 - rowY) * rise;
  const rowMoving = midway(rise);
  const rowScale = interpolate(rise, [0, 1], [1, 0.8]);
  const labelSize = 22 * u;
  const deltaSize = Math.min(height * 0.2, width * 0.11);

  const columns = [
    {
      key: "before",
      label: beforeLabel,
      text: format(left, long),
      fill: left / slow,
      color: freeze > 0.5 ? p.muted : fg,
      bar: fg,
      opacity: 1 - freeze * 0.35,
      pulse: leftStop,
      x: 0,
      d: 0,
    },
    {
      key: "after",
      label: afterLabel,
      text: format(right, long),
      fill: right / slow,
      color: rightLit ? accent : fg,
      bar: p.band,
      opacity: 1,
      pulse: rightStop,
      x: colW + gapX,
      d: 3,
    },
  ];

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 46% 40% at 50% ${70 - 3 * hold}%, ${p.glow}, transparent 72%)`,
            `radial-gradient(ellipse 60% 60% at 50% 42%, ${p.stage}, transparent 75%)`,
          ].join(", "),
        }}
      />
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: (width - rowW) / 2,
            top: rowY,
            width: rowW,
            height: 0,
            transform: `${rise > 0 ? `translateY(${rowLift}px) ` : ""}scale(${rowScale})${glide(rowMoving)}`,
          }}
        >
          {columns.map((col) => {
            const a = appear(col.d);
            return (
              <div
                key={col.key}
                style={{
                  position: "absolute",
                  left: col.x,
                  top: 0,
                  width: colW,
                  transform: `translateY(calc(-50% + ${(1 - a) * 16 * u}px))${glide(midway(a))}`,
                  opacity: a,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10 * u,
                    marginBottom: size * 0.2,
                    fontFamily,
                    fontWeight: 500,
                    fontSize: labelSize,
                    letterSpacing: "-0.01em",
                    color: p.muted,
                  }}
                >
                  <div
                    style={{
                      width: 8 * u,
                      height: 8 * u,
                      borderRadius: 8 * u,
                      background: col.key === "after" ? accent : p.muted,
                      boxShadow: `0 0 0 ${col.pulse * 6 * u}px ${col.key === "after" ? `${accent}33` : p.track}`,
                    }}
                  />
                  {col.label}
                </div>
                <div
                  style={{
                    opacity: col.opacity,
                    transformOrigin: "0% 60%",
                    transform: `scale(${1 + col.pulse * 0.02})${glide(col.pulse > 5e-4 && !rowMoving)}`,
                  }}
                >
                  <Readout
                    text={col.text}
                    size={size}
                    color={col.color}
                    lead={p.dim}
                    sep={col.key === "after" && rightLit ? accent : p.muted}
                    fontFamily={fontFamily}
                  />
                </div>
                <div
                  style={{
                    position: "relative",
                    marginTop: size * 0.26,
                    width: colW,
                    height: Math.max(1, u),
                    background: p.track,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: col.key === "after" ? -1.5 * u : -u,
                      height: (col.key === "after" ? 4 : 3) * u,
                      borderRadius: 2 * u,
                      width: Math.max(c > 0 ? 3 * u : 0, colW * col.fill),
                      background: col.bar,
                      backgroundSize: `${colW}px 100%`,
                      opacity: col.opacity,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            width,
            top: height * 0.69,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(calc(-50% + ${(1 - deltaIn) * 26 * u}px)) scale(${1 + hold * 0.015})${glide(midway(deltaIn) || midway(hold))}`,
            opacity: deltaIn,
            fontFamily,
            fontWeight: 500,
            fontSize: deltaSize,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              color: "transparent",
              backgroundImage: p.fluted,
              backgroundSize: `${100 + 30 * hold}% 100%`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              padding: "0.06em 0.04em",
            }}
          >
            {deltaText.split(" ")[0]}
          </span>
          {deltaText.includes(" ") ? (
            <span style={{ color: p.muted, marginLeft: deltaSize * 0.24 }}>
              {deltaText.slice(deltaText.indexOf(" ") + 1)}
            </span>
          ) : null}
        </div>
      </ScaleLayer>
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
