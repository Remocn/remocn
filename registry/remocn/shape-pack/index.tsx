"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
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
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
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

// gradients.sh "grain" palette: the stat block that locks the poster.
const GRAIN = ["#ffd8b4", "#e0703b", "#8a2c1d", "#2b1015"] as const;
const GRAIN_BG = "#070505";

export interface ShapePackProps {
  value?: number;
  decimals?: number;
  suffix?: string;
  label?: string;
  logo?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

interface Block {
  key: string;
  c: number;
  r: number;
  w: number;
  h: number;
  tone: number;
  at: number;
}

const COLS = 12;
const ROWS = 8;
const FALL = 14;
const ACCENT_FALL = 11;

const BLOCKS: Block[] = [
  { key: "b1", c: 0, r: 5, w: 4, h: 3, tone: 1, at: 8 },
  { key: "b2", c: 4, r: 5, w: 3, h: 3, tone: 2, at: 13 },
  { key: "g", c: 9, r: 4, w: 3, h: 4, tone: 3, at: 18 },
  { key: "h", c: 7, r: 5, w: 2, h: 3, tone: 4, at: 23 },
  { key: "a", c: 0, r: 0, w: 4, h: 5, tone: 0, at: 29 },
  { key: "e", c: 4, r: 3, w: 3, h: 2, tone: 5, at: 35 },
  { key: "d", c: 9, r: 0, w: 3, h: 4, tone: 6, at: 41 },
  { key: "f", c: 7, r: 3, w: 2, h: 2, tone: 1, at: 47 },
];
const SLOT = { c: 4, r: 0, w: 5, h: 3, at: 62 };
const LOCK = SLOT.at + ACCENT_FALL;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.045)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    guide: "rgba(255,255,255,0.09)",
    tones: [
      "#E9E8E4",
      "#26262A",
      "#36363B",
      "#2E2E33",
      "#4A4A50",
      "#5C5C62",
      "#7C7B81",
    ],
    onTone: "#121214",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.85)",
    fg: "#121214",
    muted: "#6E6C67",
    guide: "rgba(18,18,20,0.1)",
    tones: [
      "#141416",
      "#E4E2DC",
      "#D3D1CA",
      "#DCDAD3",
      "#BEBCB5",
      "#ABA9A2",
      "#8F8D87",
    ],
    onTone: "#F3F2EF",
    grain: 0.045,
  },
} as const;

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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function drop(t: number, at: number, fall: number, from: number, to: number) {
  const local = t - at;
  if (local <= 0) return { y: from, landed: false, since: local };
  if (local < fall) {
    const k = local / fall;
    return { y: from + (to - from) * k * k, landed: false, since: local };
  }
  return { y: to, landed: true, since: local - fall };
}

export function ShapePack({
  value = 3.2,
  decimals = 1,
  suffix = "×",
  label = "faster renders",
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ShapePackProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  const g = 10 * u;
  const posterH = H * 0.74;
  const cell = (posterH - g * (ROWS - 1)) / ROWS;
  const posterW = cell * COLS + g * (COLS - 1);
  const px = (W - posterW) / 2;
  const py = (H - posterH) / 2;
  const X = (col: number) => px + col * (cell + g);
  const Y = (row: number) => py + row * (cell + g);
  const span = (n: number) => n * cell + (n - 1) * g;

  const guideIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const guideOut = interpolate(t, [LOCK, LOCK + 18], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const guideFlash = interpolate(
    t,
    [LOCK, LOCK + 2, LOCK + 10],
    [0, 1, 0],
    CLAMP,
  );

  const impact = (s: number, amp: number) =>
    s < 0 ? 0 : amp * Math.sin((Math.PI * s) / 5) * Math.exp(-s / 3.2);

  const accentDrop = drop(
    t,
    SLOT.at,
    ACCENT_FALL,
    -span(SLOT.h) - 40 * u,
    Y(SLOT.r),
  );
  const shake = impact(accentDrop.landed ? accentDrop.since : -1, 3.5 * u);
  const flash = accentDrop.landed ? Math.exp(-accentDrop.since / 4) : 0;

  const count = interpolate(t, [LOCK + 4, LOCK + 30], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const statIn = interpolate(t, [LOCK + 2, LOCK + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelIn = interpolate(t, [LOCK + 10, LOCK + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [LOCK, LOCK + 70], [1, 1.018], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const gid = `sp${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // Grain palette: a peach key light top-left, falling through ember into a
  // deep wine bottom-right. The key drifts a few % across the shot.
  const kx = 18 + Math.sin(t / 38) * 4;
  const ky = 20 + Math.cos(t / 46) * 3;
  const ang = 158 + Math.sin(t / 55) * 4;
  const panel = [
    `radial-gradient(60% 45% at ${kx}% ${ky}%, ${GRAIN[0]} 0%, transparent 60%)`,
    `linear-gradient(${ang}deg, ${GRAIN[0]} 0%, ${GRAIN[1]} 24%, ${GRAIN[2]} 48%, ${GRAIN[3]} 70%, transparent 85%)`,
    GRAIN_BG,
  ].join(", ");
  const shown = (value * (0.3 + 0.7 * count)).toFixed(decimals);
  const statH = span(SLOT.h);
  const statW = span(SLOT.w);
  const pad = 20 * u;
  const numF = Math.min(
    statH * 0.6,
    (statW - pad * 2) / Math.max(1.4, (shown.length + suffix.length) * 0.58),
  );

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 40% 30%, ${c.key}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translateY(${shake}px) scale(${push})`,
          transformOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: guideIn * guideOut,
          }}
        >
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            return (
              <div
                key={`m${col}-${row}`}
                style={{
                  position: "absolute",
                  left: X(col),
                  top: Y(row),
                  width: cell,
                  height: cell,
                  boxSizing: "border-box",
                  border: `${Math.max(1, u)}px solid ${guideFlash > 0.01 ? accent : c.guide}`,
                  opacity: guideFlash > 0.01 ? 0.35 + guideFlash * 0.4 : 1,
                }}
              />
            );
          })}
        </div>

        {BLOCKS.map((b) => {
          const h = span(b.h);
          const d = drop(t, b.at, FALL, -h - 40 * u, Y(b.r));
          const hop = d.landed ? -impact(d.since, 2.5 * u) : 0;
          const fill = c.tones[b.tone];
          return (
            <div
              key={b.key}
              style={{
                position: "absolute",
                left: X(b.c),
                top: d.y + hop,
                width: span(b.w),
                height: h,
                background: fill,
                borderRadius: 2 * u,
              }}
            >
              {b.key === "a" ? (
                <div
                  style={{
                    position: "absolute",
                    left: pad,
                    bottom: pad,
                  }}
                >
                  {logo ?? <RemocnLogo fontSize={30 * u} color={c.onTone} />}
                </div>
              ) : null}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: X(SLOT.c),
            top: accentDrop.y,
            width: statW,
            height: statH,
            background: panel,
            borderRadius: 2 * u,
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.22,
              mixBlendMode: "overlay",
            }}
            aria-hidden
          >
            <filter id={`${gid}n`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.75"
                numOctaves={2}
                seed={9}
                stitchTiles="stitch"
              />
              <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${gid}n)`} />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#FFFFFF",
              opacity: flash * 0.3,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: pad,
              top: pad - 2 * u,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 20 * u,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: "rgba(43,16,21,0.82)",
              opacity: labelIn,
              transform: `translateY(${(1 - labelIn) * 6 * u}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
          <div
            style={{
              position: "absolute",
              left: pad - 0.04 * numF,
              bottom: pad - 0.18 * numF,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: numF,
              lineHeight: 1,
              letterSpacing: "-0.028em",
              fontVariantNumeric: "tabular-nums",
              color: "#FFF4EC",
              whiteSpace: "nowrap",
              opacity: statIn,
              transform: `translateY(${(1 - statIn) * 14 * u}px)`,
            }}
          >
            {shown}
            <span style={{ fontWeight: 300, marginLeft: "0.02em" }}>
              {suffix}
            </span>
          </div>
        </div>
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
