"use client";

import { loadFont } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Sora";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: mono } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface FrostedClearProps {
  title?: string;
  kicker?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_CLEAR = Easing.bezier(0.4, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "mesh" palette: bg #0a0d24, [#ecdcf2, #8796ee, #2e45b7, #0e1645].
// It fills the hero number (clip-text) and tints the stage behind the glass.
const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;

const THEMES = {
  dark: {
    bg: "#0a0d24",
    ink: [MESH[0], MESH[1], MESH[1], MESH[2]],
    ground: 0.5,
    fg: "#F3F2EF",
    frost: "rgba(255,255,255,0.055)",
    frostGrain: 0.13,
    rest: "rgba(255,255,255,0.22)",
    glint: "rgba(255,255,255,0.95)",
    sheen: "rgba(255,255,255,0.1)",
    shadow: "rgba(0,0,0,0.75)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    ink: [MESH[1], MESH[2], MESH[2], MESH[3]],
    ground: 0.16,
    fg: "#121214",
    frost: "rgba(255,255,255,0.5)",
    frostGrain: 0.09,
    rest: "rgba(18,18,20,0.16)",
    glint: "rgba(255,255,255,1)",
    sheen: "rgba(255,255,255,0.7)",
    shadow: "rgba(70,62,48,0.2)",
    grain: 0.045,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

function textWidth(s: string, size: number) {
  let w = 0;
  for (const ch of s) {
    if (ch === " ") w += 0.26;
    else if ("iljtfr,.;:!'|1".includes(ch)) w += 0.4;
    else if ("mwMW".includes(ch)) w += 0.86;
    else if (ch >= "A" && ch <= "Z") w += 0.68;
    else if (ch >= "0" && ch <= "9") w += 0.64;
    else w += 0.6;
    w -= 0.03;
  }
  return w * size;
}

function Grain({ opacity, seed }: { opacity: number; seed: number }) {
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
          baseFrequency="0.85"
          numOctaves={2}
          seed={seed}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Ground({ t, p, accent }: { t: number; p: Palette; accent: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: p.ground,
        background: [
          `radial-gradient(85% 95% at ${16 + 3 * Math.sin(t / 60)}% 20%, color-mix(in oklab, ${MESH[1]} 55%, transparent) 0%, transparent 68%)`,
          `radial-gradient(85% 95% at 84% ${26 + 3 * Math.cos(t / 64)}%, color-mix(in oklab, ${MESH[2]} 80%, transparent) 0%, transparent 68%)`,
          `radial-gradient(85% 95% at 72% 86%, color-mix(in oklab, ${accent} 45%, transparent) 0%, transparent 68%)`,
          `radial-gradient(85% 95% at 22% 80%, ${MESH[3]} 0%, transparent 68%)`,
        ].join(", "),
      }}
    />
  );
}

function Content({
  t,
  title,
  kicker,
  p,
  size,
  settle,
}: {
  t: number;
  title: string;
  kicker?: string;
  p: Palette;
  size: number;
  settle: number;
}) {
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const rise = (d: number) =>
    interpolate(t, [d, d + 26], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${1 + 0.02 * (1 - settle)})`,
      }}
    >
      {kicker ? (
        <div
          style={{
            fontFamily: mono,
            fontWeight: 400,
            fontSize: 19 * u,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: p.fg,
            marginBottom: size * 0.06,
            opacity: rise(0),
            transform: `translateY(${(1 - rise(0)) * 24 * u}px)`,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: display,
          fontWeight: 400,
          fontSize: size,
          lineHeight: 1.04,
          letterSpacing: "-0.05em",
          paddingRight: "0.06em",
          fontVariantNumeric: "tabular-nums",
          backgroundImage: [
            `radial-gradient(60% 70% at ${22 + 6 * Math.sin(t / 50)}% 18%, ${p.ink[0]} 0%, transparent 70%)`,
            `radial-gradient(70% 80% at 86% ${30 + 6 * Math.cos(t / 56)}%, ${p.ink[1]} 0%, transparent 72%)`,
            `radial-gradient(80% 70% at 50% 100%, ${p.ink[3]} 0%, transparent 75%)`,
            `linear-gradient(${p.ink[2]}, ${p.ink[2]})`,
          ].join(", "),
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          whiteSpace: "pre",
          opacity: rise(3),
          transform: `translateY(${(1 - rise(3)) * 40 * u}px)`,
        }}
      >
        {title}
      </div>
    </div>
  );
}

export function FrostedClear({
  title = "10×",
  kicker = "Faster renders",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: FrostedClearProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const p = THEMES[theme];
  const u = height / 720;

  const pw = width * 0.74;
  const ph = height * 0.72;
  const px = (width - pw) / 2;
  const py = (height - ph) / 2;
  const radius = 30 * u;
  const size = Math.min(
    290 * u,
    (pw * 0.78) / Math.max(textWidth(title, 1), 0.1),
  );

  const ox = pw * 0.5;
  const oy = ph * 0.55;
  const feather = 170 * u;
  const k = EASE_CLEAR(interpolate(t, [28, 92], [0, 1], CLAMP));
  const r = k * pw * 0.6;
  const settle = interpolate(t, [52, 96], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const hole =
    r > 0.5
      ? `radial-gradient(circle at ${ox}px ${oy}px, rgba(0,0,0,0) ${Math.max(0, r - feather)}px, #000 ${r + 1}px)`
      : "linear-gradient(#000, #000)";
  const front = `radial-gradient(circle at ${ox}px ${oy}px, rgba(0,0,0,0) ${Math.max(0, r - feather * 0.85)}px, #000 ${Math.max(0, r - feather * 0.5)}px, rgba(0,0,0,0) ${Math.max(0, r - feather * 0.1)}px)`;
  const inside = `radial-gradient(circle at ${ox}px ${oy}px, #000 ${Math.max(0, r - feather)}px, rgba(0,0,0,0) ${r}px)`;
  const glint = interpolate(k, [0.05, 0.2, 0.8, 1], [0, 1, 1, 0], CLAMP);
  const restAll = interpolate(t, [80, 100], [0, 1], CLAMP);

  const contentProps = { t, title, kicker, p, size, settle };
  const stroke = Math.max(1, 1.2 * u);
  const edge = (paint: string, mask: string, opacity: number) => (
    <svg
      width={pw}
      height={ph}
      style={{
        position: "absolute",
        left: px,
        top: py,
        overflow: "visible",
        opacity,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
      aria-hidden
    >
      <rect
        x={stroke / 2}
        y={stroke / 2}
        width={pw - stroke}
        height={ph - stroke}
        rx={radius}
        fill="none"
        stroke={paint}
        strokeWidth={stroke}
      />
    </svg>
  );

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <Ground t={t} p={p} accent={accent} />
      <div
        style={{
          position: "absolute",
          left: px,
          top: py,
          width: pw,
          height: ph,
          borderRadius: radius,
          boxShadow: `0 ${30 * u}px ${80 * u}px ${-30 * u}px ${p.shadow}`,
        }}
      />
      <Content {...contentProps} />
      <div
        style={{
          position: "absolute",
          left: px,
          top: py,
          width: pw,
          height: ph,
          borderRadius: radius,
          overflow: "hidden",
          WebkitMaskImage: hole,
          maskImage: hole,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -px,
            top: -py,
            width,
            height,
            background: p.bg,
            filter: `blur(${30 * u}px)`,
          }}
        >
          <Ground t={t} p={p} accent={accent} />
          <Content {...contentProps} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: p.frost }} />
        <Grain opacity={p.frostGrain} seed={4} />
      </div>
      <div
        style={{
          position: "absolute",
          left: px,
          top: py,
          width: pw,
          height: ph,
          borderRadius: radius,
          boxShadow: `inset 0 ${1.5 * u}px 0 ${p.sheen}`,
        }}
      />
      {edge(p.rest, "linear-gradient(#000, #000)", 0.45 + 0.55 * restAll)}
      {edge(p.rest, inside, 1 - restAll)}
      {edge(p.glint, front, glint)}
      <Grain opacity={p.grain} seed={9} />
    </AbsoluteFill>
  );
}
