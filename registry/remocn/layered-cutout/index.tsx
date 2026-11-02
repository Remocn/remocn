"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

/**
 * Beat sheet (30fps, speed 1):
 * 0–72     the cut sheets part in depth while the camera starts its push.
 * 8–140    the camera dollies through the cuts; the innermost sheet, cut
 *          from gradients.sh paper ("smear" on card stock, "swirl" on
 *          charcoal), ends up framing the core.
 * 76–120   the remocn logo and the tagline surface on the core sheet.
 * 140–170  hold.
 */

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark + "emocn" in Manrope 600. */
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

export interface LayeredCutoutProps {
  /** Small line under the logo. Pass "" to hide. */
  tagline?: string;
  /** Replaces the remocn logo on the core sheet. */
  logo?: React.ReactNode;
  /** Number of cut sheets in front of the core (4–6). */
  layers?: number;
  /** Which sheet (0 = front) is cut from gradient paper. Default: the innermost. */
  accentLayer?: number;
  /** Accepted for parity with the other drafts; the gradient paper is the accent here. */
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  /** Light = warm card stock; dark = charcoal stock. */
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  light: {
    bg: "#F5F4F0",
    // front to back, then the core
    papers: ["#EFECE5", "#E5E1D8", "#DAD5CA", "#CEC8BB", "#C3BCAE", "#B8B0A1"],
    core: "#F6F4EF",
    fg: "#141413",
    muted: "#6E6C67",
    shadow: [52, 44, 32] as const,
    shadowA: 0.34,
    lip: "rgba(255,255,255,0.85)",
    lipDark: "rgba(60,50,35,0.25)",
    light: "rgba(255,252,245,0.5)",
    vignette: "rgba(60,50,35,0.22)",
    grain: 0.05,
    // gradients.sh "smear" (light): #f2552c, #f7b23b, #e889b5, #2f6b3f
    paper: ["#F7B23B", "#F2552C", "#E889B5", "#2F6B3F"],
  },
  dark: {
    bg: "#0A0A0B",
    papers: ["#2B2B2F", "#252528", "#1F1F22", "#1A1A1D", "#161618", "#131315"],
    core: "#0F0F11",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    shadow: [0, 0, 0] as const,
    shadowA: 0.7,
    lip: "rgba(255,255,255,0.22)",
    lipDark: "rgba(0,0,0,0.4)",
    light: "rgba(255,255,255,0.07)",
    vignette: "rgba(0,0,0,0.55)",
    grain: 0.06,
    // gradients.sh "swirl": #ffe2c4, #ff9a4d, #d2456b, #3a1f6b
    paper: ["#FFE2C4", "#FF9A4D", "#D2456B", "#3A1F6B"],
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

/** Seeded hash in [0, 1). */
function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** A soft organic cut: a wobbly superellipse closed with Catmull-Rom curves. */
function holePath(R: number, aspect: number, seed: number, u: number) {
  const n = 56;
  const ph = [hash(seed) * 6.28, hash(seed + 1) * 6.28, hash(seed + 2) * 6.28];
  const amp = [0.014, 0.009, 0.004];
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob =
      1 +
      amp[0] * Math.sin(2 * a + ph[0]) +
      amp[1] * Math.sin(3 * a + ph[1]) +
      amp[2] * Math.sin(5 * a + ph[2]);
    // a touch of superellipse so the cut reads as a frame, not a blob
    const c = Math.cos(a);
    const s = Math.sin(a);
    const k = SQUIRCLE;
    const se = (Math.abs(c) ** k + Math.abs(s) ** k) ** (-1 / k);
    pts.push([c * se * R * aspect * wob * u, s * se * R * wob * u]);
  }
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return `${d}Z`;
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
          seed={13}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** Hole radius (u), aspect, centre offset (u) per sheet, front to back. */
const CUTS = [
  { R: 300, aspect: 1.62, ox: -6, oy: 4 },
  { R: 250, aspect: 1.58, ox: 5, oy: -3 },
  { R: 208, aspect: 1.54, ox: -4, oy: 4 },
  { R: 172, aspect: 1.5, ox: 3, oy: -2 },
  { R: 142, aspect: 1.46, ox: -2, oy: 2 },
  { R: 118, aspect: 1.42, ox: 1, oy: -1 },
];

const D0 = 1000;
const SQUIRCLE = 3.4;

/** One sheet of cut paper, drawn in screen space at its current depth. */
function Sheet({
  index,
  scale,
  x,
  y,
  rot,
  color,
  gradient,
  drift,
  sep,
  blur,
  p,
  u,
  paperId,
}: {
  index: number;
  scale: number;
  x: number;
  y: number;
  rot: number;
  color: string;
  /** Cut from gradient paper instead of `color`. */
  gradient: boolean;
  /** Slow drift of the gradient angle, in degrees. */
  drift: number;
  sep: number;
  blur: number;
  p: Palette;
  u: number;
  paperId: string;
}) {
  const { width, height } = useVideoConfig();
  const cut = CUTS[index];
  const hole = holePath(cut.R, cut.aspect, index * 7 + 3, u);
  const X = (width / 2 + Math.abs(x) + 80 * u) / scale;
  const Y = (height / 2 + Math.abs(y) + 80 * u) / scale;
  const outer = `M${-X},${-Y}H${X}V${Y}H${-X}Z`;
  const lipId = `${paperId}lip${index}`;
  const fillId = `${paperId}fill${index}`;
  // the gradient runs corner to corner across the cut, slowly turning
  const ga = ((150 + drift) * Math.PI) / 180;
  const gr = cut.R * u * cut.aspect * 1.7;
  // the cast shadow grows as the sheets separate and come closer to camera
  const dy = (2 + 13 * sep) * u * Math.sqrt(scale);
  const sb = (3 + 20 * sep) * u * Math.sqrt(scale);
  const [r, g, b] = p.shadow;
  const filters = [
    `drop-shadow(0 ${dy}px ${sb}px rgba(${r},${g},${b},${p.shadowA}))`,
    `drop-shadow(0 ${dy * 0.25}px ${sb * 0.2}px rgba(${r},${g},${b},${p.shadowA * 0.6}))`,
  ];
  if (blur > 0.2) filters.push(`blur(${blur}px)`);
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        filter: filters.join(" "),
      }}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={lipId}
          x1="0"
          y1={-cut.R * u}
          x2="0"
          y2={cut.R * u}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={p.lipDark} />
          <stop offset="0.45" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor={p.lip} />
        </linearGradient>
        <linearGradient
          id={fillId}
          gradientUnits="userSpaceOnUse"
          x1={-Math.cos(ga) * gr}
          y1={-Math.sin(ga) * gr}
          x2={Math.cos(ga) * gr}
          y2={Math.sin(ga) * gr}
        >
          <stop offset="0.08" stopColor={p.paper[0]} />
          <stop offset="0.42" stopColor={p.paper[1]} />
          <stop offset="0.68" stopColor={p.paper[2]} />
          <stop offset="1" stopColor={p.paper[3]} />
        </linearGradient>
      </defs>
      <g
        transform={`translate(${width / 2 + x} ${height / 2 + y}) scale(${scale}) rotate(${rot}) translate(${cut.ox * u} ${cut.oy * u})`}
      >
        <path
          d={`${outer} ${hole}`}
          fillRule="evenodd"
          fill={gradient ? `url(#${fillId})` : color}
          filter={`url(#${paperId})`}
        />
        {/* the cut edge: lit lip below, shaded lip above */}
        <path
          d={hole}
          fill="none"
          stroke={`url(#${lipId})`}
          strokeWidth={(1.8 * u) / scale}
        />
      </g>
    </svg>
  );
}

export function LayeredCutout({
  tagline = "Launch films, cut from components.",
  logo,
  layers = 5,
  accentLayer,
  speed = 1,
  theme = "light",
}: LayeredCutoutProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p = THEMES[theme];
  const paperId = `paper${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const n = Math.max(3, Math.min(6, Math.round(layers)));
  const gradientLayer = accentLayer ?? n - 1;

  // sheets part in depth, then the camera dollies through the cuts
  const part = interpolate(t, [0, 72], [0, 1], { ...CLAMP, easing: EASE_IO });
  const gap = 18 + 182 * part;
  const push = interpolate(t, [8, 140], [0, 1], { ...CLAMP, easing: EASE_IO });
  // land with the core at ~1.25x and the last two cuts framing it
  const coreDepth = n * 200;
  const camZ = push * (D0 + coreDepth - D0 / 1.25);
  const camX = interpolate(push, [0, 1], [46 * u, 0]);
  const camY = interpolate(push, [0, 1], [-22 * u, 0]);

  const depthOf = (i: number) => D0 + i * gap - camZ;
  const coreDist = depthOf(n);
  const coreScale = D0 / coreDist;

  const sheets: React.ReactNode[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dist = depthOf(i);
    if (dist < 70) continue;
    const s = D0 / dist;
    const cut = CUTS[i];
    // skip sheets whose cut already swallows the whole frame
    const hx = cut.R * cut.aspect * u * s * 0.97;
    const hy = cut.R * u * s * 0.97;
    const cxo = width / 2 + camX * s + Math.abs(cut.ox * u * s);
    const cyo = height / 2 + Math.abs(camY * s) + Math.abs(cut.oy * u * s);
    if ((cxo / hx) ** SQUIRCLE + (cyo / hy) ** SQUIRCLE < 1) continue;
    const blur = Math.max(0, Math.min(7, (s - coreScale) * 1.4)) * u;
    sheets.push(
      <Sheet
        key={i}
        index={i}
        scale={s}
        x={-camX * s}
        y={-camY * s}
        rot={(i % 2 ? 1 : -1) * (0.5 + i * 0.25) * push * 1.4}
        color={p.papers[i]}
        gradient={i === gradientLayer}
        drift={Math.sin(t / 45) * 6}
        sep={part}
        blur={blur}
        p={p}
        u={u}
        paperId={paperId}
      />,
    );
  }

  const reveal = interpolate(t, [76, 104], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tag = interpolate(t, [98, 120], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: p.core, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter
            id={paperId}
            x="0"
            y="0"
            width="1"
            height="1"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves={3}
              seed={21}
              result="tooth"
            />
            <feDiffuseLighting
              in="tooth"
              surfaceScale={1.2}
              lightingColor="#FFFFFF"
              result="lit"
            >
              <feDistantLight azimuth={235} elevation={58} />
            </feDiffuseLighting>
            <feComposite
              in="SourceGraphic"
              in2="lit"
              operator="arithmetic"
              k1={0.16}
              k2={0.88}
              result="paper"
            />
            <feComposite in="paper" in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* the core sheet, lit from above, carrying the name */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${46 * coreScale}% ${52 * coreScale}% at ${50 - (camX / width) * 100 * coreScale}% ${44 - (camY / height) * 100 * coreScale}%, ${p.light}, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width / 2 - camX * coreScale,
          top: height / 2 - camY * coreScale,
          transform: `translate(-50%, -50%) scale(${coreScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16 * u,
        }}
      >
        <div
          style={{
            opacity: reveal,
            filter: `blur(${(1 - reveal) * 6 * u}px)`,
            transform: `scale(${0.96 + 0.04 * reveal})`,
          }}
        >
          {logo ?? <RemocnLogo fontSize={76 * u} color={p.fg} />}
        </div>
        {tagline ? (
          <div
            style={{
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 20 * u,
              letterSpacing: "-0.005em",
              color: p.muted,
              opacity: tag,
              transform: `translateY(${(1 - tag) * 8 * u}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {tagline}
          </div>
        ) : null}
      </div>

      {sheets}

      {/* key light from above-left and a soft vignette over the whole stack */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 32% 18%, ${p.light}, transparent 70%), radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, ${p.vignette} 100%)`,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
