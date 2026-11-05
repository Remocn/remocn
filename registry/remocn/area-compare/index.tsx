"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadDisplay } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  theme?: "dark" | "light";
  speed?: number;
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

const T_IN = 0;
const T_SHRINK = 38;
const SHRINK_LEN = 40;
const T_LAND = T_SHRINK + SHRINK_LEN;

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
  size,
  color,
}: {
  text: string;
  t: number;
  size: number;
  color: string;
}) {
  const chars = Array.from(text);
  return (
    <div
      style={{
        display: "flex",
        whiteSpace: "pre",
        fontFamily: display,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
        color,
      }}
    >
      {chars.map((ch, i) => {
        const p = interpolate(t, [i * 3, i * 3 + 22], [0, 1], {
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

export function AreaCompare({
  label = "Bundle size",
  before = "Before",
  after = "remocn",
  beforeValue = 1200,
  afterValue = 84,
  unit = "KB",
  verdict = "smaller",
  shape = "circle",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: AreaCompareProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];

  const big = Math.max(beforeValue, afterValue, 0.0001);
  const small = Math.max(Math.min(beforeValue, afterValue), 0.0001);
  const ratio = big / small;
  const square = shape === "square";

  const R0 = height * (square ? 0.33 : 0.36);
  const Rf = R0 * Math.sqrt(small / big);

  const enter = interpolate(t, [T_IN - 8, T_IN + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const s = interpolate(t, [T_SHRINK, T_LAND], [0, 1], {
    ...CLAMP,
    easing: EASE_SHRINK,
  });
  const sLin = interpolate(t, [T_SHRINK, T_LAND], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const r = R0 + (Rf - R0) * s;
  const value = beforeValue + (afterValue - beforeValue) * sLin;

  const glide = interpolate(t, [T_SHRINK + 6, T_LAND + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const margin = width * 0.085;
  const gxEnd = margin + R0 + 14 * u;
  const gx = width / 2 + (gxEnd - width / 2) * glide;
  const gy = height / 2 + 6 * u;
  const bottom = gy + R0;
  const cy = bottom - r;

  const ghostIn = interpolate(t, [T_SHRINK, T_SHRINK + 10], [0, 1], CLAMP);
  const tagIn = interpolate(t, [T_SHRINK + 14, T_SHRINK + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tint = interpolate(s, [0.2, 0.62], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const meshDrift = interpolate(t, [0, T_LAND + 90], [0, 1.4], CLAMP);
  const onFill = interpolateColors(
    interpolate(tint, [0.38, 0.58], [0, 1], CLAMP),
    [0, 1],
    [p.onFill, "#FFFFFF"],
  );

  const valueSize = Math.max(30 * u, 104 * u * (r / R0));
  const fitsInside = Rf * 2 >= 118 * u;
  const insideAlpha = fitsInside
    ? 1
    : interpolate(s, [0.55, 0.8], [1, 0], CLAMP);
  const eyebrowAlpha = interpolate(t, [T_SHRINK - 2, T_SHRINK + 10], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const afterTagIn = interpolate(t, [T_LAND - 4, T_LAND + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const outsideIn = fitsInside
    ? 0
    : interpolate(t, [T_LAND - 6, T_LAND + 12], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });

  const heroT = t - (T_LAND + 2);
  const heroSize = Math.min(250 * u, width * 0.19);
  const textX = gxEnd + R0 + width * 0.07;
  const textW = width - margin - textX;
  const lineIn = interpolate(heroT, [10, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const eyeIn = interpolate(heroT, [-4, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const breathe = interpolate(t, [0, T_LAND + 90], [1.025, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
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
  const enterScale = 0.96 + 0.04 * enter;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at ${(gx / width) * 100}% 40%, ${p.stage}, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${breathe})`,
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
            left: body.x,
            top: body.y,
            width: body.w,
            height: body.h,
            borderRadius: body.rx,
            overflow: "hidden",
            opacity: enter,
            transform: `scale(${enterScale})`,
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
            left: gx,
            top: gy - R0 + 34 * u,
            transform: "translateX(-50%)",
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
              color: p.fg,
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
            left: gx,
            top: cy,
            transform: `translate(-50%, -50%) scale(${enterScale})`,
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
              marginBottom: 6 * u * eyebrowAlpha,
              height: 28 * u * eyebrowAlpha,
              overflow: "hidden",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: display,
              fontWeight: 400,
              fontSize: valueSize * 1.12,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              color: onFill,
            }}
          >
            {formatValue(value, unit)}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: gx,
            top: bottom - Rf * 2 - 14 * u,
            transform: `translate(-50%, -100%) translateY(${(1 - afterTagIn) * 6 * u}px)`,
            fontFamily: sans,
            fontSize: 18 * u,
            fontWeight: 500,
            color: p.fg,
            opacity: afterTagIn * (fitsInside ? 1 : 0),
            whiteSpace: "nowrap",
          }}
        >
          {isBrand(after) ? (
            <RemocnLogo fontSize={22 * u} color={p.fg} />
          ) : (
            after
          )}
        </div>

        <div
          style={{
            position: "absolute",
            left: gx + Rf + 16 * u,
            top: bottom - Rf,
            transform: `translateY(-50%) translateX(${(1 - outsideIn) * -6 * u}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 2 * u,
            opacity: outsideIn,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: display,
              fontWeight: 400,
              fontSize: 34 * u,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              color: p.fg,
            }}
          >
            {formatValue(afterValue, unit)}
          </span>
          {isBrand(after) ? (
            <RemocnLogo fontSize={20 * u} color={p.fg} />
          ) : (
            <span
              style={{
                fontFamily: sans,
                fontSize: 18 * u,
                fontWeight: 500,
                color: p.fg,
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
              size={heroSize}
              color={p.fg}
            />
          </div>
          <span
            style={{
              fontFamily: display,
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

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 60%, ${p.bg} 100%)`,
          opacity: 0.55,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
