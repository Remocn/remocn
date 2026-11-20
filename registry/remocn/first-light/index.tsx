"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});
const grotesk = loadSpaceGrotesk("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const mono = loadSpaceMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const R_W = 124.06;
const R_H = 134.26;
const R_SCALE = 0.76;
const R_GAP = 0.04;

export interface FirstLightProps {
  name?: string;
  tagline?: string;
  accent?: string;
  /** Color of the name and tagline; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for a name other than "remocn". Load it yourself; Space Grotesk by default. */
  fontFamily?: string;
  /** Replaces the R mark when `name` is "remocn". */
  logo?: React.ReactNode;
  /** Frames the name takes to climb through the horizon line. */
  rise?: number;
  /** Ruler ticks along the horizon line. */
  ticks?: boolean;
  /** Size of the name, line and tagline, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#000000",
    ink: "#FFFFFF",
    dim: "rgba(255,255,255,0.32)",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#000000",
    dim: "rgba(0,0,0,0.3)",
  },
} as const;

const PROBE_PX = 200;

const APPEAR_LEN = 12;
const CLIMB_AT = 10;
const CLIMB_LEN = 54;
const TAG_AT = 60;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_CLIMB = Easing.bezier(0.55, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

interface Metrics {
  text: number;
  cap: number;
  desc: number;
}

function measure(
  word: string,
  family: string,
  weight: number,
  track: number,
): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${family}"`,
    fontWeight: String(weight),
    fontSize: `${PROBE_PX}px`,
    letterSpacing: `${track}em`,
    lineHeight: "1",
  });
  probe.textContent = word;
  document.body.appendChild(probe);
  const text = probe.getBoundingClientRect().width / PROBE_PX - track;
  probe.remove();

  let cap = 0.72;
  let desc = 0.22;
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.font = `${weight} ${PROBE_PX}px "${family}"`;
    cap = ctx.measureText("H").actualBoundingBoxAscent / PROBE_PX;
    desc = Math.max(
      0,
      ctx.measureText(word).actualBoundingBoxDescent / PROBE_PX,
    );
  }
  return { text, cap, desc };
}

function useMetrics(word: string, brand: boolean, face: string) {
  const key = `${word}\u0001${brand ? 1 : 0}\u0001${face}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("first-light: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [w, b, f] = key.split("\u0001");
    const isBrand = b === "1";
    const family = isBrand ? manrope.fontFamily : f;
    const weight = isBrand ? 600 : 400;
    Promise.all([
      manrope.waitUntilDone(),
      grotesk.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`${weight} 100px "${family}"`),
      document.fonts.load(`400 100px "${mono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measure(w, family, weight, isBrand ? -0.025 : -0.035),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.m : null;
}

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

export function FirstLight({
  name = "remocn",
  tagline = "Every frame catches the light.",
  accent,
  ink,
  background,
  fontFamily = grotesk.fontFamily,
  logo,
  rise = CLIMB_LEN,
  ticks: showTicks = true,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: FirstLightProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const lineInk = accent ?? fg;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const isBrand = name.trim().toLowerCase() === "remocn";
  const word = isBrand ? "emocn" : name;
  const family = isBrand ? manrope.fontFamily : fontFamily;
  const weight = isBrand ? 600 : 400;
  const track = isBrand ? -0.025 : -0.035;
  const m = useMetrics(word, isBrand, fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const minDim = Math.min(W, H);
  const markEm = isBrand ? (R_SCALE * R_W) / R_H + R_GAP : 0;
  const nameEm = markEm + m.text;
  const marginX = W * (portrait ? 0.05 : 0.045);
  const F = Math.min(
    (W - marginX * 2) / nameEm,
    (H * (portrait ? 0.2 : 0.4)) / m.cap,
  );
  const nameW = nameEm * F;
  const capH = m.cap * F;
  const descH = m.desc * F;
  const tagFs = Math.max(minDim * 0.024, Math.min(minDim * 0.032, 24));
  const stroke = Math.max(1, minDim * 0.0018);

  const baseFinal = H / 2 + capH / 2 - H * 0.02;
  const sunLine0 = baseFinal + descH + F * 0.06;
  const baseStart = sunLine0 + F * 0.06 + capH + H * (portrait ? 0.1 : 0.03);
  const climb = baseStart - baseFinal;

  const dyAt = (tt: number) => {
    const appear = interpolate(tt, [0, APPEAR_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const k = interpolate(tt, [CLIMB_AT, CLIMB_AT + rise], [0, 1], {
      ...CLAMP,
      easing: EASE_CLIMB,
    });
    return climb * (1 - k) + (1 - appear) * F * 0.06;
  };
  const appear = interpolate(t, [0, APPEAR_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const dy = dyAt(t);
  const nameMoving =
    Math.abs(dyAt(t + speed) - dy) > 1e-3 ||
    Math.abs(dy - dyAt(t - speed)) > 1e-3;

  const set = interpolate(
    t,
    [CLIMB_AT + rise - 14, CLIMB_AT + rise + 22],
    [0, 1],
    { ...CLAMP, easing: Easing.bezier(0.45, 0, 0.55, 1) },
  );
  const sunLine = sunLine0 + set * F * 0.05;

  const x0 = W / 2 - nameW / 2;
  const markH = R_SCALE * F;
  const markW = (markH * R_W) / R_H;
  const textX = isBrand ? x0 + markW + R_GAP * F : W / 2;
  const ring = Math.max(1.2, F * 0.006);

  const nameShapes = (mode: "outline" | "solid") => (
    <g
      transform={`translate(0 ${dy.toFixed(3)})`}
      filter={mode === "outline" ? `url(#${uid}ring)` : undefined}
      fill={fg}
    >
      {isBrand && logo ? (
        <foreignObject
          x={x0}
          y={baseFinal - markH}
          width={markW}
          height={markH}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: fg,
            }}
          >
            {logo}
          </div>
        </foreignObject>
      ) : isBrand ? (
        <path
          d={REMOCN_R_PATH}
          transform={`translate(${x0.toFixed(3)} ${(baseFinal - markH).toFixed(3)}) scale(${(markH / R_H).toFixed(5)})`}
        />
      ) : null}
      <text
        x={textX}
        y={baseFinal}
        textAnchor={isBrand ? "start" : "middle"}
        fontFamily={family}
        fontWeight={weight}
        fontSize={F}
        letterSpacing={`${track}em`}
      >
        {word}
      </text>
    </g>
  );

  const lineIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tickCount = portrait ? 24 : 48;
  const tickGap = W / tickCount;
  const ticks = [];
  for (let i = 1; i < tickCount; i++) {
    const x = i * tickGap;
    if (!showTicks || x > W * lineIn) break;
    const major = i % 4 === 0;
    ticks.push(
      <line
        key={i}
        x1={x}
        x2={x}
        y1={sunLine}
        y2={sunLine + (major ? tagFs * 0.7 : tagFs * 0.32)}
        stroke={c.dim}
        strokeWidth={stroke}
      />,
    );
  }

  const tagP = interpolate(t, [TAG_AT, TAG_AT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          // The name climbs by an SVG attribute, which cannot carry the mark.
          style={{
            position: "absolute",
            inset: 0,
            transform: glide(nameMoving),
          }}
          aria-hidden
        >
          <defs>
            <filter
              id={`${uid}ring`}
              x="-5%"
              y="-30%"
              width="110%"
              height="160%"
            >
              <feMorphology
                in="SourceAlpha"
                operator="erode"
                radius={ring}
                result="core"
              />
              <feComposite in="SourceGraphic" in2="core" operator="out" />
            </filter>
            <clipPath id={`${uid}lit`} clipPathUnits="userSpaceOnUse">
              <rect x={0} y={-H} width={W} height={H + sunLine} />
            </clipPath>
            <clipPath id={`${uid}dark`} clipPathUnits="userSpaceOnUse">
              <rect x={0} y={sunLine} width={W} height={H * 2} />
            </clipPath>
          </defs>
          <g opacity={appear}>
            <g clipPath={`url(#${uid}dark)`} opacity={0.55}>
              {nameShapes("outline")}
            </g>
            <g clipPath={`url(#${uid}lit)`}>{nameShapes("solid")}</g>
          </g>
          <line
            x1={0}
            x2={W * lineIn}
            y1={sunLine}
            y2={sunLine}
            stroke={lineInk}
            strokeWidth={stroke}
          />
          {ticks}
        </svg>

        <div
          style={{
            position: "absolute",
            left: marginX,
            // Laid out where the line settles; the line's last drift is a
            // transform, since layout would click the tagline down a pixel at
            // a time.
            top: sunLine0 + F * 0.05 + tagFs * 1.6,
            transform: `translateY(${-(1 - set) * F * 0.05}px)${glide(midway(set))}`,
            whiteSpace: "pre",
            fontFamily: mono.fontFamily,
            fontWeight: 400,
            fontSize: tagFs,
            lineHeight: 1,
            color: fg,
            opacity: tagP,
          }}
        >
          {tagline}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
