"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { getLength, getPointAtLength } from "@remotion/paths";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serifItalic } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_W = 124.06;
const R_H = 134.26;

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
        viewBox={`0 0 ${R_W} ${R_H}`}
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

/** The R outline as a polygon, for point-in-mark tests. */
const R_POLY: [number, number][] = (() => {
  const len = getLength(REMOCN_R_PATH);
  const n = 360;
  return Array.from({ length: n }, (_, i) => {
    const pt = getPointAtLength(REMOCN_R_PATH, (i / n) * len);
    return [pt?.x ?? 0, pt?.y ?? 0] as [number, number];
  });
})();

export interface BokehTitleProps {
  title?: string;
  subtitle?: string;
  /** What the lights resolve into during the rack focus. */
  pattern?: "mark" | "grid";
  /** Aperture shape of the out-of-focus lights. */
  shape?: "circle" | "hexagon";
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  /** Dark = night lights; light = soft daylight bokeh. */
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const T_FOCUS_IN = [34, 66] as const;
const T_FOCUS_OUT = [90, 120] as const;
const T_TITLE = 106;
const AMBIENT = 24;

// gradients.sh "halo" palette: bg #030306, [#fff4ec, #ffb36b, #e2457a, #3d4dff].
// It colours the lights: cream and amber out of focus, and a gradient across the R in focus.
const HALO = ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"] as const;

const PALETTES = {
  dark: {
    bg: "radial-gradient(ellipse 90% 80% at 50% 45%, #0f0c12 0%, #030306 72%)",
    fg: "#F6F1EC",
    muted: "#9A938E",
    lights: ["#fff4ec", "#ffe3cc", "#ffb36b", "#fff4ec", "#f2b9c9"],
    blend: "screen" as const,
    base: 0.2,
    titleVeil: "rgba(3,3,6,0.6)",
    grain: 0.06,
  },
  light: {
    bg: "radial-gradient(ellipse 90% 80% at 50% 40%, #F7F2EC 0%, #EADFD3 100%)",
    fg: "#16131A",
    muted: "#6E6660",
    lights: ["#FFFFFF", "#FFF4EC", "#FFE0C2", "#FFFFFF", "#F8D3DE"],
    blend: "normal" as const,
    base: 0.42,
    titleVeil: "rgba(247,242,236,0.62)",
    grain: 0.045,
  },
} as const;

type Palette = (typeof PALETTES)[keyof typeof PALETTES];

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Even-odd point-in-polygon test against the R outline (R units). */
function inMark(x: number, y: number) {
  let inside = false;
  for (let i = 0, j = R_POLY.length - 1; i < R_POLY.length; j = i++) {
    const [xi, yi] = R_POLY[i];
    const [xj, yj] = R_POLY[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

interface Target {
  x: number;
  y: number;
  /** Position along the pattern's gradient, 0..1. */
  g: number;
}

/**
 * Pattern targets in a normalised space centred on 0, plus the size of one
 * unit (as a share of the frame height) and the in-focus dot diameter in units.
 */
function buildTargets(pattern: "mark" | "grid") {
  const out: Target[] = [];
  if (pattern === "grid") {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 11; c++) {
        out.push({ x: (c - 5) * 3.4, y: (r - 2.5) * 3.4, g: c / 10 });
      }
    }
    return { targets: out, unit: 0.46 / 31, dot: 1.05 };
  }
  // a hex-packed dot screen clipped by the real R
  const step = 6.6;
  const rowH = step * 0.866;
  let row = 0;
  for (let y = rowH / 2; y < R_H; y += rowH, row++) {
    for (let x = (row % 2) * (step / 2) + step / 2; x < R_W; x += step) {
      if (inMark(x, y)) {
        out.push({
          x: x - R_W / 2,
          y: y - R_H / 2,
          g: Math.min(1, Math.max(0, (x / R_W) * 0.55 + (y / R_H) * 0.45)),
        });
      }
    }
  }
  return { targets: out, unit: 0.5 / R_H, dot: step * 0.74 };
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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const HEX =
  "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)";

/** One out-of-focus light: a disc with a faintly brighter rim, softened by blur. */
function Light({
  x,
  y,
  size,
  blur,
  color,
  opacity,
  blend,
  shape,
  rim,
}: {
  x: number;
  y: number;
  size: number;
  blur: number;
  color: string;
  opacity: number;
  blend: React.CSSProperties["mixBlendMode"];
  shape: "circle" | "hexagon";
  rim: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity,
        mixBlendMode: blend,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: shape === "circle" ? "50%" : undefined,
          clipPath: shape === "hexagon" ? HEX : undefined,
          background: `radial-gradient(circle closest-side, ${color} 0%, ${color} 78%, ${color} 100%)`,
          boxShadow:
            shape === "circle" && rim > 0
              ? `inset 0 0 0 ${Math.max(1, size * 0.035)}px rgba(255,255,255,${rim})`
              : undefined,
        }}
      />
    </div>
  );
}

export function BokehTitle({
  title = "Launch films, made in code",
  subtitle = "remocn · Spring release",
  pattern = "mark",
  shape = "circle",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: BokehTitleProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p: Palette = PALETTES[theme];

  const built = buildTargets(pattern);
  const targets = built.targets;
  const unit = height * built.unit;
  // more lights in the pattern -> each defocused disc a little smaller
  const crowd = Math.min(1, Math.sqrt(80 / targets.length));

  // focus pull: 0 = lights defocused, 1 = pattern plane sharp
  const focus =
    interpolate(t, T_FOCUS_IN, [0, 1], { ...CLAMP, easing: EASE_IO }) -
    interpolate(t, T_FOCUS_OUT, [0, 1], { ...CLAMP, easing: EASE_IO });
  // lens breathing: the frame scales a hair with the focus throw
  const breathe = 1 + focus * 0.025;
  const drift = interpolate(t, [0, 200], [0, 1], { ...CLAMP, easing: EASE_IO });
  const open = interpolate(t, [0, 14], [0.55, 1], CLAMP);

  const titleP = interpolate(t, [T_TITLE, T_TITLE + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const subP = interpolate(t, [T_TITLE + 18, T_TITLE + 46], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const behindTitle = 1 - titleP * 0.35;
  const titleSize = Math.min(104 * u, width * 0.085);
  // keep a one-line title on one line while tracking wide, so it never reflows
  const fitsOneLine = title.length * titleSize * 0.36 < width * 0.84;
  // the last word is set in the italic: the editorial accent of the line
  const words = title.trim().split(/\s+/);
  const lead = words.slice(0, -1).join(" ");
  const last = words[words.length - 1] ?? "";
  const [subLead, ...subRest] = subtitle.split(" · ");
  const subIsBrand = subLead.trim().toLowerCase() === "remocn";

  const lights: React.ReactNode[] = [];

  // pattern lights: they live on the focal plane
  for (const [i, tg] of targets.entries()) {
    const d = hash(i * 3 + 1); // 0 near … 1 far
    const tx = width / 2 + tg.x * unit;
    const ty = height / 2 + tg.y * unit;
    const sx = tx + (hash(i * 5 + 2) - 0.5) * width * 0.78;
    const sy = ty + (hash(i * 7 + 3) - 0.5) * height * 0.8;
    const par = (0.4 + (1 - d) * 0.6) * u;
    const dx = (-60 * drift + Math.sin(t / 50 + i) * 6) * par;
    const dy = (-14 * drift + Math.cos(t / 60 + i * 1.7) * 4) * par;
    // lights gather first, then sharpen: reads as a focus pull, not a swarm
    const ease = 1 - (1 - focus) ** 2.4;
    const sharp = focus ** 1.7;
    const x = sx + (tx - sx) * ease + dx * (1 - ease);
    const y = sy + (ty - sy) * ease + dy * (1 - ease);
    const big = (22 + (1 - d) ** 2 * 96) * u * crowd;
    const small = unit * built.dot;
    const size = big + (small - big) * sharp;
    const blur = (big * 0.075 + 2 * u) * (1 - sharp) ** 1.2;
    const focusColor = interpolateColors(
      tg.g,
      [0, 0.5, 1],
      [HALO[1], HALO[2], HALO[3]],
    );
    const color = interpolateColors(
      sharp,
      [0.35, 0.95],
      [p.lights[Math.floor(hash(i * 11) * p.lights.length)], focusColor],
    );
    const op = (p.base + (1 - d) * 0.14) * (1 - sharp) + 0.95 * sharp;
    lights.push(
      <Light
        key={`p${i}`}
        x={x}
        y={y}
        size={size}
        blur={blur}
        color={color}
        opacity={op * open * behindTitle}
        blend={sharp > 0.5 ? "normal" : p.blend}
        shape={shape}
        rim={theme === "dark" ? 0.12 * (1 - focus) : 0}
      />,
    );
  }

  // ambient lights in front of the focal plane: they bloom wider as focus racks back
  const ambient: React.ReactNode[] = [];
  for (let i = 0; i < AMBIENT; i++) {
    const d = hash(i * 13 + 400);
    const near = 1 - d;
    const x0 = hash(i * 17 + 401) * width * 1.1 - width * 0.05;
    const y0 = hash(i * 19 + 402) * height * 1.1 - height * 0.05;
    const par = (0.6 + near * 1.4) * u;
    const x = x0 - 90 * drift * par + Math.sin(t / 70 + i * 2.1) * 5 * par;
    const y = y0 - 20 * drift * par;
    const size = (40 + near ** 1.6 * 190) * u * (1 + focus * 0.18);
    const blur = (size * 0.06 + 3 * u) * (1 + focus * 0.6);
    const tint = hash(i * 23 + 403) < 0.08;
    const color = tint
      ? accent
      : p.lights[Math.floor(hash(i * 29 + 404) * p.lights.length)];
    const op =
      (tint ? 0.12 : (0.07 + near * 0.13) * (theme === "light" ? 2.6 : 1)) *
      (1 - focus * 0.35) *
      open *
      behindTitle;
    ambient.push(
      <Light
        key={`a${i}`}
        x={x}
        y={y}
        size={size}
        blur={blur}
        color={color}
        opacity={op}
        blend={p.blend}
        shape={shape}
        rim={theme === "dark" ? 0.08 : 0}
      />,
    );
  }

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${breathe})`,
          transformOrigin: "50% 50%",
        }}
      >
        {lights}
        {ambient}
      </AbsoluteFill>

      {/* a soft pool of shade behind the type keeps it crisp over the lights */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 46% 26% at 50% 50%, ${p.titleVeil}, transparent 80%)`,
          opacity: titleP,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 22 * u,
          padding: `0 ${width * 0.1}px`,
        }}
      >
        <div
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: titleSize,
            lineHeight: 1,
            letterSpacing: `${0.08 - titleP * 0.095}em`,
            color: p.fg,
            textAlign: "center",
            textWrap: "balance",
            whiteSpace: fitsOneLine ? "nowrap" : "normal",
            maxWidth: fitsOneLine ? undefined : width * 0.84,
            opacity: titleP,
            filter:
              titleP < 0.98 ? `blur(${(1 - titleP) * 10 * u}px)` : undefined,
            transform: `scale(${1.04 - titleP * 0.04})`,
          }}
        >
          {lead ? `${lead} ` : ""}
          <span style={{ fontFamily: serifItalic, fontStyle: "italic" }}>
            {last}
          </span>
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14 * u,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 21 * u,
              letterSpacing: "-0.005em",
              color: p.muted,
              opacity: subP,
              transform: `translateY(${(1 - subP) * 10 * u}px)`,
            }}
          >
            {subIsBrand ? (
              <>
                <RemocnLogo fontSize={24 * u} color={p.fg} />
                {subRest.length ? (
                  <>
                    <div
                      style={{
                        width: Math.max(1, u),
                        height: 18 * u,
                        background: p.muted,
                        opacity: 0.5,
                      }}
                    />
                    <span>{subRest.join(" · ")}</span>
                  </>
                ) : null}
              </>
            ) : (
              <span>{subtitle}</span>
            )}
          </div>
        ) : null}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)"
              : "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(120,105,85,0.12) 100%)",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
