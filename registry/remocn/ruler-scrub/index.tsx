"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const display = sans;

export interface RulerScrubProps {
  from?: number;
  to?: number;
  step?: number;
  format?: string | ((value: number) => string);
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const SCRUB_END = 70;
const SUBDIV = 10;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    stage: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#85848A",
    faint: "#46464C",
    major: "rgba(243,242,239,0.7)",
    minor: "rgba(243,242,239,0.26)",
    future: 0.4,
    grain: 0.065,
    hero: (a: number) =>
      `linear-gradient(${172 + a}deg, #fbeee4 0%, #f3d6c0 22%, #b9a6ff 58%, #8a7bff 78%, #5a5ef0 100%)`,
    glow: [
      "color-mix(in oklab, #8a7bff 16%, transparent)",
      "color-mix(in oklab, #3b3fd8 22%, transparent)",
    ],
  },
  light: {
    bg: "#F5F4F0",
    stage: "rgba(255,255,255,0.9)",
    fg: "#121214",
    muted: "#6E6C67",
    faint: "#B9B6AE",
    major: "rgba(18,18,20,0.66)",
    minor: "rgba(18,18,20,0.24)",
    future: 0.45,
    grain: 0.045,
    hero: (a: number) =>
      `linear-gradient(${155 + a}deg, #7a5cff 0%, #b04cd9 30%, #ff3d9a 62%, #ff8a3d 100%)`,
    glow: [
      "color-mix(in oklab, #ff8a3d 10%, transparent)",
      "color-mix(in oklab, #7a5cff 12%, transparent)",
    ],
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

function decimalsOf(step: number) {
  const s = String(step);
  const i = s.indexOf(".");
  return i < 0 ? 0 : Math.min(4, s.length - i - 1);
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
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Ticks({
  pos,
  steps,
  gap,
  width,
  u,
  h,
  p,
  accent,
  text,
  centerLit,
  heroOut,
  labelSize,
}: {
  pos: number;
  steps: number;
  gap: number;
  width: number;
  u: number;
  h: number;
  p: Palette;
  accent: string;
  text: (i: number) => string;
  centerLit: number;
  heroOut: number;
  labelSize: number;
}) {
  const span = width / 2 / gap + 1;
  const first = Math.floor((pos - span) * SUBDIV);
  const last = Math.ceil((pos + span) * SUBDIV);
  const lines: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  for (let k = first; k <= last; k++) {
    const x = width / 2 + (k / SUBDIV - pos) * gap;
    const major = k % SUBDIV === 0;
    const mid = !major && k % (SUBDIV / 2) === 0;
    const len = h * (major ? 0.075 : mid ? 0.048 : 0.028);
    const future = k / SUBDIV > steps + 1e-6 ? p.future : 1;
    const isHero = k === steps * SUBDIV;
    const lit = isHero ? centerLit : 0;
    lines.push(
      <line
        key={k}
        x1={x}
        x2={x}
        y1={0}
        y2={-len * (1 + lit * 0.35)}
        stroke={lit > 0.5 ? accent : major ? p.major : p.minor}
        strokeWidth={(major ? 1.75 : 1.1) * u * (1 + lit * 0.4)}
        opacity={future}
      />,
    );
    if (major) {
      const i = k / SUBDIV;
      labels.push(
        <div
          key={`t${k}`}
          style={{
            position: "absolute",
            left: x - gap / 2,
            width: gap,
            top: -h * 0.098 - labelSize,
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: labelSize,
            lineHeight: 1,
            letterSpacing: "-0.005em",
            fontVariantNumeric: "tabular-nums",
            color: isHero ? p.fg : p.muted,
            opacity: future * (isHero ? 1 - heroOut : 1),
          }}
        >
          {text(i)}
        </div>,
      );
    }
  }
  return (
    <>
      <svg
        width={width}
        height={h * 0.12}
        viewBox={`0 ${-h * 0.12} ${width} ${h * 0.12}`}
        style={{
          position: "absolute",
          left: 0,
          top: -h * 0.12,
          overflow: "visible",
        }}
        aria-hidden
      >
        {lines}
      </svg>
      {labels}
    </>
  );
}

export function RulerScrub({
  from = 2012,
  to = 2026,
  step = 1,
  format = "{value}",
  label = "The year launch videos became code",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RulerScrubProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p: Palette = THEMES[theme];
  const inc = step > 0 ? step : 1;
  const steps = Math.max(1, Math.round((to - from) / inc));
  const dec = decimalsOf(inc);
  const fmt = (v: number) => {
    const n = v.toFixed(dec);
    return typeof format === "function"
      ? format(Number(n))
      : format.replace("{value}", n);
  };
  const text = (i: number) => fmt(from + i * inc);

  const gap = Math.max(width * 0.115, 96 * u);
  const scrubAt = (f: number) => {
    const x = Math.min(1, Math.max(0, f / SCRUB_END));
    const main = (1 - (1 - x) ** 3) * 0.93 + x * 0.07;
    if (f <= SCRUB_END) return steps * main;
    const dt = f - SCRUB_END;
    const v0 = (0.07 * steps) / SCRUB_END;
    return steps + (v0 / 0.9) * Math.sin(dt * 0.9) * Math.exp(-dt * 0.5);
  };
  const pos = scrubAt(t);
  const vel = (scrubAt(t) - scrubAt(t - 1)) * gap;
  const ghost = interpolate(Math.abs(vel), [8 * u, 60 * u], [0, 1], CLAMP);

  const lift = interpolate(t, [SCRUB_END + 6, SCRUB_END + 38], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rulerY = interpolate(lift, [0, 1], [height * 0.56, height * 0.68]);
  const centerLit = interpolate(
    t,
    [SCRUB_END - 4, SCRUB_END + 2],
    [0, 1],
    CLAMP,
  );
  const heroOut = interpolate(lift, [0, 0.06], [0, 1], CLAMP);
  const enter = interpolate(t, [0, 10], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const flash = interpolate(
    t,
    [SCRUB_END - 2, SCRUB_END + 1, SCRUB_END + 14],
    [0, 1, 0],
    CLAMP,
  );
  const blur = Math.min(8 * u, Math.max(0, Math.abs(vel) - 6 * u) * 0.11);
  const blurId = `b${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const labelSize = 21 * u;
  const heroSize = Math.min(height * 0.34, width * 0.2);
  const heroScale0 = labelSize / heroSize;
  const heroStartY = rulerY - height * 0.098 - labelSize * 0.5;
  const heroEndY = height * 0.34;
  const heroY = interpolate(lift, [0, 1], [heroStartY, heroEndY]);
  const heroScale =
    interpolate(lift, [0, 1], [heroScale0, 1]) *
    interpolate(t, [SCRUB_END + 38, SCRUB_END + 110], [1, 1.02], CLAMP);
  const heroWeight = interpolate(lift, [0, 1], [450, 500]);
  const sheen = interpolate(t, [SCRUB_END, SCRUB_END + 110], [-4, 4], CLAMP);

  const markTop = -height * 0.075 * (1 + centerLit * 0.35) - 6 * u;
  const markBottom = height * 0.034;

  const labelIn = interpolate(t, [SCRUB_END + 30, SCRUB_END + 54], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const ghosts = [0.5, 1];
  const fade =
    "linear-gradient(90deg, transparent 0%, #000 22%, #000 78%, transparent 100%)";
  const tickProps = {
    pos,
    steps,
    gap,
    width,
    u,
    h: height,
    p,
    accent,
    text,
    labelSize,
  };

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 42% 46% at ${46 + sheen}% ${36 - 6 * (1 - lift)}%, ${p.glow[0]}, transparent 72%)`,
            `radial-gradient(ellipse 70% 50% at 50% 100%, ${p.glow[1]}, transparent 72%)`,
            `radial-gradient(ellipse 60% 60% at 50% 48%, ${p.stage}, transparent 75%)`,
          ].join(", "),
        }}
      />
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id={blurId} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: rulerY - height * 0.25,
          width,
          height: height * 0.3,
          opacity: enter,
          maskImage: fade,
          WebkitMaskImage: fade,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: height * 0.25,
            width,
            height: Math.max(1, u),
            background: p.minor,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            filter: blur > 0.4 ? `url(#${blurId})` : undefined,
          }}
        >
          <div style={{ position: "absolute", left: 0, top: height * 0.25 }}>
            {ghosts.map((g) =>
              ghost > 0.01 ? (
                <div
                  key={g}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    opacity: ghost * 0.22 * (1.25 - g),
                    transform: `translateX(${vel * g * 0.7}px)`,
                  }}
                >
                  <Ticks {...tickProps} centerLit={0} heroOut={0} />
                </div>
              ) : null,
            )}
            <div style={{ position: "absolute", left: 0, top: 0 }}>
              <Ticks {...tickProps} centerLit={centerLit} heroOut={heroOut} />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: width / 2 - u,
          top: rulerY + markTop,
          width: 2 * u,
          height: markBottom - markTop,
          background: accent,
          borderRadius: u,
          opacity: enter,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width / 2 - 4.5 * u,
          top: rulerY + markBottom - 4.5 * u,
          width: 9 * u,
          height: 9 * u,
          borderRadius: 9 * u,
          background: accent,
          opacity: enter,
          boxShadow: `0 0 0 ${flash * 7 * u}px ${accent}2E`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          width,
          top: heroY,
          height: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: heroOut,
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontWeight: heroWeight,
            fontSize: heroSize,
            lineHeight: 1,
            letterSpacing: `${interpolate(lift, [0, 1], [-0.005, -0.05])}em`,
            fontVariantNumeric: "tabular-nums",
            color: "transparent",
            backgroundImage: p.hero(sheen),
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            padding: "0.08em 0.06em",
            whiteSpace: "nowrap",
            transform: `scale(${heroScale})`,
          }}
        >
          {text(steps)}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          width,
          top: height * 0.83,
          display: "flex",
          justifyContent: "center",
          fontFamily: sans,
          fontWeight: 400,
          fontSize: 28 * u,
          letterSpacing: "-0.015em",
          color: p.fg,
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 14 * u}px)`,
        }}
      >
        {label}
      </div>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
