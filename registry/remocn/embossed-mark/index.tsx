"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Brand face: the remocn.dev logo is the R mark + "emocn" in Manrope 600.
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_W = 124.06;
const R_H = 134.26;

// gradients.sh "silk" palette: bg #030308, [#3b3fd8, #f3d6c0, #8a7bff].
// Used once, as the foil pressed into the debossed R. The sheen band follows
// the raking light.
const SILK = ["#3b3fd8", "#f3d6c0", "#8a7bff"] as const;

export interface EmbossedMarkProps {
  /** Custom mark to deboss instead of the remocn R (square slot, black fill). */
  logo?: React.ReactNode;
  /** Letters printed after the mark. With the default R this completes "Remocn". */
  name?: string;
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

const THEMES = {
  dark: {
    paper: "#212124",
    floor: "#1F1F22",
    ink: "#E8E5DE",
    shadow: "#000000",
    shadowA: 0.85,
    hi: "#FFFFFF",
    hiA: 0.32,
    pool: "rgba(255,255,255,0.1)",
    falloff: "rgba(0,0,0,0.5)",
    tooth: 0.55,
    foil: 0.94,
    grain: 0.07,
  },
  light: {
    paper: "#EBE7DF",
    floor: "#E7E3DA",
    ink: "#1C1B19",
    shadow: "#3C3020",
    shadowA: 0.5,
    hi: "#FFFFFF",
    hiA: 0.95,
    pool: "rgba(255,253,248,0.55)",
    falloff: "rgba(60,48,30,0.16)",
    tooth: 0.6,
    foil: 0.96,
    grain: 0.05,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function ReliefFilter({
  id,
  p,
  lx,
  ly,
  depth,
  blur,
  base,
}: {
  id: string;
  p: Palette;
  lx: number;
  ly: number;
  depth: number;
  blur: number;
  base: "floor" | "source";
}) {
  return (
    <filter
      id={id}
      x="-20%"
      y="-20%"
      width="140%"
      height="140%"
      colorInterpolationFilters="sRGB"
    >
      {base === "floor" ? (
        <>
          <feFlood floodColor={p.floor} result="fc" />
          <feComposite in="fc" in2="SourceAlpha" operator="in" result="base" />
        </>
      ) : (
        <feOffset in="SourceGraphic" dx={0} dy={0} result="base" />
      )}
      <feComponentTransfer in="SourceAlpha" result="inv">
        <feFuncA type="table" tableValues="1 0" />
      </feComponentTransfer>
      <feOffset in="inv" dx={-lx * depth} dy={-ly * depth} result="invS" />
      <feGaussianBlur in="invS" stdDeviation={blur} result="invSB" />
      <feFlood floodColor={p.shadow} floodOpacity={p.shadowA} />
      <feComposite in2="invSB" operator="in" result="sh0" />
      <feComposite in="sh0" in2="SourceAlpha" operator="in" result="sh" />
      <feOffset
        in="inv"
        dx={lx * depth * 0.8}
        dy={ly * depth * 0.8}
        result="invH"
      />
      <feGaussianBlur in="invH" stdDeviation={blur * 0.6} result="invHB" />
      <feFlood floodColor={p.hi} floodOpacity={p.hiA} />
      <feComposite in2="invHB" operator="in" result="hi0" />
      <feComposite in="hi0" in2="SourceAlpha" operator="in" result="hi" />
      <feMerge>
        <feMergeNode in="base" />
        <feMergeNode in="sh" />
        <feMergeNode in="hi" />
      </feMerge>
    </filter>
  );
}

export function EmbossedMark({
  logo,
  name = "emocn",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: EmbossedMarkProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const p = THEMES[theme];
  const u = height / 720;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const debId = `deb${uid}`;
  const pressId = `press${uid}`;
  const toothId = `tooth${uid}`;
  const foilId = `foil${uid}`;

  // Logo geometry from remocn.dev: the R is 0.76em tall and sits on the
  // baseline of "emocn"; the letters start 0.04em after it.
  const fontSize = 214 * u;
  const markH = fontSize * 0.76;
  const markW = logo ? markH : (markH * R_W) / R_H;

  const sweep = EASE_IO(interpolate(t, [0, 112], [0, 1], CLAMP));
  const az = (196 + 104 * sweep) * (Math.PI / 180);
  const lx = Math.cos(az);
  const ly = Math.sin(az);
  const elev = interpolate(sweep, [0, 1], [10, 34]);
  const depth = interpolate(elev, [10, 34], [7.5, 3.6]) * u;
  const blur = interpolate(elev, [10, 34], [2.6, 1.8]) * u;

  // Camera: starts centred on the mark, eases out to centre the lockup.
  // translateX(%) resolves against the lockup's own width, so no text
  // measuring is needed.
  const cam = EASE_IO(interpolate(t, [56, 100], [0, 1], CLAMP));
  const zoom = 1 + 0.1 * (1 - cam);
  const camX = `calc(${(1 - cam) * 50}% - ${((1 - cam) * markW) / 2}px)`;

  const foil = interpolate(t, [66, 84], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const sheen = 0.18 + 0.5 * sweep;
  const letters = [...name];
  const letterIn = (i: number) =>
    interpolate(t, [80 + i * 3, 90 + i * 3], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const poolX = 50 + lx * 46;
  const poolY = 50 + ly * 70;
  const huge = {
    position: "absolute",
    left: -width * 1.5,
    top: -height * 1.5,
    width: width * 4,
    height: height * 4,
  } as const;

  return (
    <AbsoluteFill style={{ background: p.paper, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <ReliefFilter
            id={debId}
            p={p}
            lx={lx}
            ly={ly}
            depth={depth}
            blur={blur}
            base="floor"
          />
          <ReliefFilter
            id={pressId}
            p={p}
            lx={lx}
            ly={ly}
            depth={depth * 0.32}
            blur={blur * 0.45}
            base="source"
          />
          <filter id={toothId} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.55 0.75"
              numOctaves={3}
              seed={5}
              result="n"
            />
            <feDiffuseLighting
              in="n"
              surfaceScale={1.6}
              diffuseConstant={1}
              lightingColor="#FFFFFF"
            >
              <feDistantLight azimuth={(az * 180) / Math.PI} elevation={elev} />
            </feDiffuseLighting>
          </filter>
          <linearGradient
            id={foilId}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
            gradientTransform={`rotate(${-18 + 30 * sweep} 0.5 0.5)`}
          >
            <stop offset="0" stopColor={accent} />
            <stop offset={Math.max(0, sheen - 0.2)} stopColor={SILK[2]} />
            <stop offset={sheen} stopColor={SILK[1]} />
            <stop offset={Math.min(1, sheen + 0.22)} stopColor={SILK[2]} />
            <stop offset="1" stopColor={SILK[0]} />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "baseline",
            fontFamily: manrope.fontFamily,
            fontWeight: 600,
            fontSize,
            lineHeight: 1,
            letterSpacing: "-0.025em",
            color: p.ink,
            transformOrigin: `${markW / 2}px 50%`,
            transform: `translateX(${camX}) scale(${zoom})`,
          }}
        >
          <div style={{ ...huge, background: p.paper }} />
          <div
            style={{
              position: "relative",
              flex: "none",
              width: markW,
              height: markH,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                filter: `url(#${debId})`,
              }}
            >
              {logo ?? (
                <svg
                  width={markW}
                  height={markH}
                  viewBox={`0 0 ${R_W} ${R_H}`}
                  style={{ display: "block" }}
                  aria-hidden
                >
                  <path d={REMOCN_R_PATH} fill="#000" />
                </svg>
              )}
            </div>
            {logo ? null : (
              <svg
                width={markW}
                height={markH}
                viewBox={`0 0 ${R_W} ${R_H}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "block",
                  overflow: "visible",
                  filter: `url(#${pressId})`,
                  opacity: foil * p.foil,
                }}
                aria-hidden
              >
                <path d={REMOCN_R_PATH} fill={`url(#${foilId})`} />
              </svg>
            )}
          </div>
          <div
            style={{
              position: "relative",
              marginLeft: "0.04em",
              whiteSpace: "pre",
              filter: `url(#${pressId})`,
            }}
          >
            {letters.map((ch, i) => (
              <span key={`${ch}${i}`} style={{ opacity: letterIn(i) }}>
                {ch}
              </span>
            ))}
          </div>
          <svg
            style={{
              ...huge,
              opacity: p.tooth,
              mixBlendMode: "soft-light",
              pointerEvents: "none",
            }}
            aria-hidden
          >
            <rect width="100%" height="100%" filter={`url(#${toothId})`} />
          </svg>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 110% at ${poolX}% ${poolY}%, ${p.pool}, rgba(0,0,0,0) 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 90% 120% at ${poolX}% ${poolY}%, rgba(0,0,0,0) 45%, ${p.falloff} 100%)`,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
