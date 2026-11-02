"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

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

/** gradients.sh "limb" palette; the deep stop takes the accent. */
const LIMB = ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"] as const;

export interface VennMergeProps {
  sets?: string[];
  center?: string;
  caption?: string;
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
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    ring: "rgba(243,242,239,0.62)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    ring: "rgba(18,18,20,0.6)",
    grain: 0.045,
  },
} as const;

const DRAW = [0, 24];
const SLIDE = [26, 66];
const FILL = [62, 84];
const BRAND = 74;
const CAPTION = 96;

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

export function VennMerge({
  sets = ["Design", "Code"],
  center = "remocn",
  caption = "Motion design, written as code.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: VennMergeProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const list = (sets.length ? sets : ["Design", "Code"]).slice(0, 3);
  const n = list.length;
  const three = n === 3;

  const R = height * (three ? 0.25 : 0.34);
  const cx = width / 2;
  const cy =
    height * (caption ? 0.45 : 0.5) +
    (three ? (R * 0.92) / Math.sqrt(3) / 4 : 0);
  const ring = Math.max(1.5, 2 * u);

  const slide = interpolate(t, [SLIDE[0], SLIDE[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const draw = interpolate(t, [DRAW[0], DRAW[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const fill = interpolate(t, [FILL[0], FILL[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const brand = interpolate(t, [BRAND, BRAND + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const capIn = interpolate(t, [CAPTION, CAPTION + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, CAPTION + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = 0.965 + 0.035 * push;

  const finalSep = three ? R * 0.92 : R * 0.52;
  const startSep = three ? R * 1.15 : R * 2.24;
  const sep = startSep + (finalSep - startSep) * slide;

  const dirs = three
    ? [
        { x: -Math.sqrt(3) / 2, y: 0.5 },
        { x: Math.sqrt(3) / 2, y: 0.5 },
        { x: 0, y: -1 },
      ]
    : [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];
  const reach = three ? sep / Math.sqrt(3) : sep / 2;
  const centers = dirs.map((d) => ({
    x: cx + d.x * reach,
    y: cy + d.y * reach,
  }));

  const labelSize = (three ? 36 : 42) * u;
  const labels = list.map((name, i) => {
    const c = centers[i];
    const d = dirs[i];
    let off = 0;
    if (three) {
      off = R * 0.42 * slide;
    } else {
      const crescent = Math.min(2 * R, sep);
      off = R - crescent / 2;
    }
    return {
      name,
      x: c.x + d.x * off,
      y: c.y + d.y * off,
      a: interpolate(t, [DRAW[0] + 4 + i * 3, DRAW[0] + 20 + i * 3], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      }),
    };
  });

  const regionW = three
    ? 2 * (R - finalSep / Math.sqrt(3)) * 0.95
    : (2 * R - finalSep) * 0.86;
  const isLogo = center.trim().toLowerCase() === "remocn";
  const brandSize = Math.min(
    84 * u,
    (regionW * 0.8) / (isLogo ? 3.75 : Math.max(center.length, 3) * 0.56),
  );
  const glowX =
    R * interpolate(t, [FILL[0], CAPTION + 60], [-0.12, 0.12], CLAMP);
  const brandY = cy;

  const circ = 2 * Math.PI * R;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            {centers.map((c, i) => (
              <clipPath id={`${uid}c${i}`} key={list[i]}>
                <circle cx={c.x} cy={c.y} r={R} />
              </clipPath>
            ))}
            <radialGradient
              id={`${uid}g`}
              gradientUnits="userSpaceOnUse"
              cx={cx + glowX}
              cy={cy + R * 0.95}
              r={R * 1.75}
            >
              <stop offset={0} stopColor={LIMB[0]} />
              <stop offset={0.2} stopColor={LIMB[1]} />
              <stop offset={0.5} stopColor={accent} />
              <stop offset={0.74} stopColor={LIMB[2]} />
              <stop offset={1} stopColor={LIMB[3]} />
            </radialGradient>
            <radialGradient
              id={`${uid}h`}
              gradientUnits="userSpaceOnUse"
              cx={cx - glowX * 1.4}
              cy={cy - R * 0.55}
              r={R * 0.75}
            >
              <stop offset={0} stopColor={LIMB[1]} stopOpacity={0.55} />
              <stop offset={1} stopColor={LIMB[1]} stopOpacity={0} />
            </radialGradient>
          </defs>
          {centers.map((c, i) => (
            <circle
              key={list[i]}
              cx={c.x}
              cy={c.y}
              r={R}
              fill="none"
              stroke={p.ring}
              strokeWidth={ring}
              strokeDasharray={`${circ * draw} ${circ}`}
              transform={`rotate(${i === 0 ? 180 : three && i === 2 ? -90 : 0} ${c.x} ${c.y})`}
            />
          ))}
          {fill > 0 ? (
            <g clipPath={`url(#${uid}c0)`}>
              <g clipPath={`url(#${uid}c1)`}>
                <g clipPath={three ? `url(#${uid}c2)` : undefined}>
                  <rect
                    x={cx - R * 2}
                    y={cy + R - 2 * R * fill}
                    width={R * 4}
                    height={2 * R * fill}
                    fill={`url(#${uid}g)`}
                  />
                  <rect
                    x={cx - R * 2}
                    y={cy + R - 2 * R * fill}
                    width={R * 4}
                    height={2 * R * fill}
                    fill={`url(#${uid}h)`}
                  />
                </g>
              </g>
            </g>
          ) : null}
        </svg>

        {labels.map((l) => (
          <div
            key={l.name}
            style={{
              position: "absolute",
              left: l.x,
              top: l.y,
              transform: `translate(-50%, -50%) translateY(${(1 - l.a) * 8 * u}px)`,
              fontFamily: serif,
              fontWeight: 400,
              fontSize: labelSize,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              color: p.fg,
              opacity: l.a,
              whiteSpace: "nowrap",
            }}
          >
            {l.name}
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            left: cx,
            top: brandY,
            transform: `translate(-50%, -50%) translateY(${(1 - brand) * 18 * u}px) scale(${1.06 - 0.06 * brand})`,
            whiteSpace: "nowrap",
            opacity: brand,
            filter: brand < 0.99 ? `blur(${(1 - brand) * 8 * u}px)` : undefined,
          }}
        >
          {isLogo ? (
            <RemocnLogo fontSize={brandSize} color="#FFFFFF" />
          ) : (
            <div
              style={{
                fontFamily: manrope.fontFamily,
                fontWeight: 500,
                fontSize: brandSize,
                lineHeight: 1,
                letterSpacing: "-0.035em",
                color: "#FFFFFF",
              }}
            >
              {center}
            </div>
          )}
        </div>

        {caption ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: cy + (three ? finalSep / Math.sqrt(3) / 2 : 0) + R + 34 * u,
              textAlign: "center",
              fontFamily: manrope.fontFamily,
              fontWeight: 400,
              fontSize: 24 * u,
              letterSpacing: "-0.01em",
              color: p.muted,
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 10 * u}px)`,
              textWrap: "balance",
            }}
          >
            {caption}
          </div>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.55,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
