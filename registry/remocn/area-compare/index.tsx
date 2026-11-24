"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadDisplay } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { type ReactNode, useId } from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type AreaCompareElementId, areaCompareTimeline } from "./timeline";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
loadDisplay("italic", { weights: ["400"], subsets: ["latin"] });
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

// gradients.sh "mesh" palette, laid flat: a diagonal ramp with two drifting
// blobs, so the shape reads as a printed swatch rather than a lit sphere.
const MESH = ["#ECDCF2", "#8796EE", "#2E45B7", "#0E1645"];

function meshFill(accent: string, drift: number) {
  const ax = 18 + Math.sin(drift * 1.3) * 6;
  const bx = 82 + Math.cos(drift * 1.1) * 6;
  return [
    `radial-gradient(70% 60% at ${ax}% 16%, color-mix(in oklab, ${MESH[0]} 55%, transparent) 0%, transparent 70%)`,
    `radial-gradient(80% 70% at ${bx}% 92%, ${MESH[3]} 0%, transparent 72%)`,
    `linear-gradient(${150 + drift * 6}deg, ${MESH[1]} 0%, ${accent} 44%, ${MESH[2]} 74%, ${MESH[3]} 100%)`,
  ].join(", ");
}

export interface AreaCompareProps {
  label?: string;
  before?: string;
  after?: string;
  beforeValue?: number;
  afterValue?: number;
  unit?: string;
  verdict?: string;
  shape?: "circle" | "square";
  accent?: string;
  /** Frames the shape takes to shrink to the new value. */
  shrink?: number;
  /** Text color of the values and multiplier; overrides the theme. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the values, multiplier and verdict. Load it yourself; Instrument Serif by default. */
  fontFamily?: string;
  /** Replaces the remocn mark shown when `after` is "remocn". */
  logo?: ReactNode;
  /** Size of the shapes and copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Film grain over the scene. */
  grain?: boolean;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the fade-in, the shrink, the glide, the
   * landing, the ratio and the drift, by the ids in `./timeline`. Frames on
   * the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<AreaCompareElementId>;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SHRINK = Easing.bezier(0.7, 0, 0.22, 1.04);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    faint: "#5A595F",
    hair: "rgba(255,255,255,0.28)",
    fillTop: "#3A393F",
    fillBottom: "#2A292E",
    onFill: "#F3F2EF",
    stage: "rgba(255,255,255,0.05)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    faint: "#A3A099",
    hair: "rgba(18,18,20,0.3)",
    fillTop: "#DEDCD6",
    fillBottom: "#CFCDC6",
    onFill: "#121214",
    stage: "rgba(255,255,255,0.7)",
    grain: 0.045,
  },
} as const;

function groupThousands(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatValue(v: number, unit: string) {
  if (unit === "KB" && v >= 1000) return `${(v / 1000).toFixed(1)} MB`;
  if (unit === "MB" && v >= 1000) return `${(v / 1000).toFixed(1)} GB`;
  if (v < 10 && Math.abs(v - Math.round(v)) > 0.01) {
    return `${v.toFixed(1)} ${unit}`.trim();
  }
  return `${groupThousands(v)} ${unit}`.trim();
}

function formatRatio(r: number) {
  if (r >= 10) return `${Math.round(r)}×`;
  const s = r.toFixed(1);
  return `${s.endsWith(".0") ? s.slice(0, -2) : s}×`;
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
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

function Hero({
  text,
  t,
  stagger,
  rise,
  size,
  color,
  fontFamily,
}: {
  text: string;
  t: number;
  stagger: number;
  rise: number;
  size: number;
  color: string;
  fontFamily: string;
}) {
  const chars = Array.from(text);
  return (
    <div
      style={{
        display: "flex",
        whiteSpace: "pre",
        fontFamily,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
        color,
      }}
    >
      {chars.map((ch, i) => {
        const at = i * stagger;
        const p = interpolate(t, [at, at + rise], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: size * 0.06,
              marginBottom: -size * 0.06,
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 0.7 * size}px)`,
                opacity: interpolate(p, [0, 0.4], [0, 1], CLAMP),
              }}
            >
              {ch}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function AreaCompare(props: AreaCompareProps) {
  const {
    label = "Bundle size",
    before = "Before",
    after = "remocn",
    beforeValue = 1200,
    afterValue = 84,
    unit = "KB",
    verdict = "smaller",
    shape = "circle",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = display,
    logo,
    scale = 1,
    delay = 0,
    grain = true,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const tilt = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    areaCompareTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const enterEl = tl.get("enter");
  const driftEl = tl.get("drift");
  const shrinkEl = tl.get("shrink");
  const glideEl = tl.get("glide");
  const land = tl.get("land");
  const ratioEl = tl.get("ratio");
  const T_SHRINK = shrinkEl.start;
  const T_LAND = land.start;
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const stage = background ?? p.bg;

  const big = Math.max(beforeValue, afterValue, 0.0001);
  const small = Math.max(Math.min(beforeValue, afterValue), 0.0001);
  const ratio = big / small;
  const square = shape === "square";

  const R0 = height * (square ? 0.33 : 0.36);
  const Rf = R0 * Math.sqrt(small / big);

  const enter = interpolate(t, [enterEl.start, enterEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const s = interpolate(t, [shrinkEl.start, shrinkEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_SHRINK,
  });
  const sLin = interpolate(t, [shrinkEl.start, shrinkEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const r = R0 + (Rf - R0) * s;
  const value = beforeValue + (afterValue - beforeValue) * sLin;

  const glide = interpolate(t, [glideEl.start, glideEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const margin = width * 0.085;
  const gxEnd = margin + R0 + 14 * u;
  const gx = width / 2 + (gxEnd - width / 2) * glide;
  const gy = height / 2 + 6 * u;
  const bottom = gy + R0;
  const cy = bottom - r;

  const ghostIn = interpolate(
    t,
    [T_SHRINK, T_SHRINK + shrinkEl.beat("ghost")],
    [0, 1],
    CLAMP,
  );
  const tagIn = interpolate(
    t,
    [T_SHRINK + shrinkEl.beat("tagAt"), T_SHRINK + shrinkEl.beat("tag")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const tint = interpolate(s, [0.2, 0.62], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const meshDrift = interpolate(
    t,
    [driftEl.start, driftEl.end],
    [0, 1.4],
    CLAMP,
  );
  const onFill = interpolateColors(
    interpolate(tint, [0.38, 0.58], [0, 1], CLAMP),
    [0, 1],
    [p.onFill, "#FFFFFF"],
  );

  const valueSize = Math.max(30 * u, 104 * u * (r / R0));
  const valueEnd = Math.max(30 * u, 104 * u * (Rf / R0));
  const fitsInside = Rf * 2 >= 118 * u;
  const insideAlpha = fitsInside
    ? 1
    : interpolate(s, [0.55, 0.8], [1, 0], CLAMP);
  const eyebrowAlpha = interpolate(
    t,
    [
      T_SHRINK + shrinkEl.beat("eyebrowAt"),
      T_SHRINK + shrinkEl.beat("eyebrow"),
    ],
    [1, 0],
    {
      ...CLAMP,
      easing: EASE_IO,
    },
  );
  // While the shape shrinks, the value's font size eases and the label above
  // it folds away, which moves the value's baseline by layout, pixel by
  // pixel. For those frames the block is laid out once at its landed size
  // and the value scales and rides by transform; at rest it is plain layout.
  const folding = (s > 0 && s < 1) || (eyebrowAlpha > 0 && eyebrowAlpha < 1);
  const valueK = valueSize / valueEnd;
  const fold = 17 * u * eyebrowAlpha;
  const afterTagIn = interpolate(
    t,
    [T_LAND + land.beat("tagAt"), T_LAND + land.beat("tag")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const outsideIn = fitsInside
    ? 0
    : interpolate(
        t,
        [T_LAND + land.beat("outsideAt"), T_LAND + land.beat("outside")],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_OUT,
        },
      );

  const heroT = t - ratioEl.start;
  const heroSize = Math.min(250 * u, width * 0.19);
  const textX = gxEnd + R0 + width * 0.07;
  const textW = width - margin - textX;
  const lineIn = interpolate(
    heroT,
    [ratioEl.beat("verdictAt"), ratioEl.beat("verdict")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const eyeIn = interpolate(
    heroT,
    [ratioEl.beat("labelAt"), ratioEl.beat("label")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const breatheAt = (at: number) =>
    interpolate(at, [driftEl.start, driftEl.end], [1.025, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  const breathe = breatheAt(t);
  const breatheStep = (at: number) =>
    Math.abs(breatheAt(at) - breatheAt(at - speed));
  const breathing = Math.max(breatheStep(t), breatheStep(t + speed)) > 0;
  // Layout rounds a box and a baseline to whole pixels, so the shape and its
  // labels are laid out where they land and ride there by transform:
  // `slide` is the glide across, `drop` how far the shrinking shape's
  // centre still sits above its landed one. Both are exactly 0 at rest.
  const slide = (width / 2 - gxEnd) * (1 - glide);
  const drop = (R0 - Rf) * (1 - s);
  const shift = (dx: number, dy = 0) =>
    Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3
      ? ""
      : `translate(${dx}px, ${dy}px) `;
  const cornerR = (side: number) => side * 0.1;

  const shapePath = (cx: number, ccy: number, rad: number) =>
    square
      ? {
          x: cx - rad,
          y: ccy - rad,
          w: rad * 2,
          h: rad * 2,
          rx: cornerR(rad * 2),
        }
      : { x: cx - rad, y: ccy - rad, w: rad * 2, h: rad * 2, rx: rad };

  const ghost = shapePath(gx, gy, R0);
  const body = shapePath(gx, cy, r);
  const landed = shapePath(gxEnd, bottom - Rf, Rf);
  const enterScale = 0.96 + 0.04 * enter;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at ${(gx / width) * 100}% 40%, ${p.stage}, transparent 75%)`,
        }}
      />
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${breathe})${tilt(breathing)}`,
            transformOrigin: "50% 50%",
          }}
        >
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
            aria-hidden
          >
            <rect
              x={ghost.x}
              y={ghost.y}
              width={ghost.w}
              height={ghost.h}
              rx={ghost.rx}
              fill="none"
              stroke={p.hair}
              strokeWidth={Math.max(1, 1.25 * u)}
              opacity={ghostIn}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: landed.x,
              top: landed.y,
              width: body.w,
              height: body.h,
              borderRadius: body.rx,
              overflow: "hidden",
              opacity: enter,
              transform: `${shift(slide - drop, -2 * drop)}scale(${enterScale})`,
              transformOrigin: `${gx - body.x}px ${bottom - body.y}px`,
              background: `linear-gradient(180deg, ${p.fillTop}, ${p.fillBottom})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: tint,
                background: meshFill(accent, meshDrift),
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: gxEnd,
              top: gy - R0 + 34 * u,
              transform: `${shift(slide)}translateX(-50%)`,
              display: "flex",
              alignItems: "baseline",
              gap: 10 * u,
              whiteSpace: "nowrap",
              fontFamily: sans,
              fontSize: 18 * u,
              fontWeight: 500,
              color: p.muted,
              opacity: tagIn,
            }}
          >
            <span>{before}</span>
            <span style={{ color: p.faint }}>·</span>
            <span
              style={{
                color: fg,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatValue(beforeValue, unit)}
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              left: gxEnd,
              top: bottom - Rf,
              transform: `${shift(slide, -drop)}translate(-50%, -50%) scale(${enterScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: enter * insideAlpha,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: sans,
                fontSize: 22 * u,
                fontWeight: 500,
                color: p.muted,
                opacity: eyebrowAlpha,
                marginBottom: folding ? undefined : 6 * u * eyebrowAlpha,
                height: 28 * u * eyebrowAlpha,
                overflow: "hidden",
                ...(folding
                  ? {
                      position: "absolute" as const,
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, ${-fold - 0.56 * valueSize}px)`,
                    }
                  : null),
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily,
                fontWeight: 400,
                fontSize: (folding ? valueEnd : valueSize) * 1.12,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                color: onFill,
                transform: folding
                  ? `translateY(${fold}px) scale(${valueK})`
                  : undefined,
              }}
            >
              {formatValue(value, unit)}
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              left: gxEnd,
              top: bottom - Rf * 2 - 14 * u,
              transform: `${shift(slide)}translate(-50%, -100%) translateY(${(1 - afterTagIn) * 6 * u}px)`,
              fontFamily: sans,
              fontSize: 18 * u,
              fontWeight: 500,
              color: fg,
              opacity: afterTagIn * (fitsInside ? 1 : 0),
              whiteSpace: "nowrap",
            }}
          >
            {isBrand(after)
              ? (logo ?? <RemocnLogo fontSize={22 * u} color={fg} />)
              : after}
          </div>

          <div
            style={{
              position: "absolute",
              left: gxEnd + Rf + 16 * u,
              top: bottom - Rf,
              transform: `${shift(slide)}translateY(-50%) translateX(${(1 - outsideIn) * -6 * u}px)`,
              display: "flex",
              flexDirection: "column",
              gap: 2 * u,
              opacity: outsideIn,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily,
                fontWeight: 400,
                fontSize: 34 * u,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                color: fg,
              }}
            >
              {formatValue(afterValue, unit)}
            </span>
            {isBrand(after) ? (
              (logo ?? <RemocnLogo fontSize={20 * u} color={fg} />)
            ) : (
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 18 * u,
                  fontWeight: 500,
                  color: fg,
                }}
              >
                {after}
              </span>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              left: textX,
              top: gy,
              width: textW,
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontFamily: sans,
                fontSize: 22 * u,
                fontWeight: 500,
                color: p.muted,
                opacity: eyeIn,
                transform: `translateY(${(1 - eyeIn) * 8 * u}px)`,
                marginBottom: 18 * u,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
            <div style={{ marginLeft: -heroSize * 0.05 }}>
              <Hero
                text={formatRatio(ratio)}
                t={heroT}
                stagger={ratioEl.beat("stagger")}
                rise={ratioEl.beat("rise")}
                size={heroSize}
                color={fg}
                fontFamily={fontFamily}
              />
            </div>
            <span
              style={{
                fontFamily,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 88 * u,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: p.muted,
                opacity: lineIn,
                transform: `translateY(${(1 - lineIn) * 14 * u}px)`,
                filter:
                  lineIn < 0.98 ? `blur(${(1 - lineIn) * 6 * u}px)` : undefined,
                whiteSpace: "nowrap",
              }}
            >
              {verdict}
            </span>
          </div>
        </AbsoluteFill>
      </ScaleLayer>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 60%, ${stage} 100%)`,
          opacity: 0.55,
        }}
      />
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
