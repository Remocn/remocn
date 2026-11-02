"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: geist } = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface MoireRevealProps {
  value?: string;
  shape?: "text" | "mark";
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const TURN_END = 86;
const START_ANGLE = 11;
const DRIFT = 3;
const LOCK_AT = 100;
const LOCK_END = 114;
const CAPTION_AT = 110;

const TURN = Easing.bezier(0.3, 0.15, 0.25, 1);
const LOCK = Easing.bezier(0.5, 0, 0.1, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    line: "#D9D8DD",
    lineAlpha: 0.72,
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.14)",
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    line: "#2A2A2E",
    lineAlpha: 0.8,
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    grain: 0.035,
  },
} as const;

/** gradients.sh "beam" palette, re-stopped per stage so every stop reads on the ground. */
const BEAM = {
  dark: ["#F4F7FF", "#8FB4FF", "#3D5BFF", "#4B3FD6"],
  light: ["#1A1660", "#3D5BFF", "#5A72FF", "#7F95FF"],
} as const;

/** The remocn.dev "R" mark (viewBox 124.06 × 134.26). */
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Advance widths (em) for Geist 500 (proportional figures), -0.035em tracking. */
function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.24;
    else if ("ijlI.,:;'!|".includes(ch)) w += 0.25;
    else if ("ftr".includes(ch)) w += 0.36;
    else if ("mwMW%".includes(ch)) w += 0.82;
    else if (ch === "1") w += 0.42;
    else if (ch >= "0" && ch <= "9") w += 0.6;
    else if (ch >= "A" && ch <= "Z") w += 0.64;
    else w += 0.56;
    w -= 0.035;
  }
  return Math.max(w, 0.5);
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
          seed={4}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Lines({
  pitch,
  weight,
  span,
  phase,
  fill,
}: {
  pitch: number;
  weight: number;
  span: number;
  phase: number;
  fill: string;
}) {
  const count = Math.ceil(span / pitch) + 4;
  const first = -Math.ceil(count / 2);
  const rows = [];
  for (let k = 0; k < count; k++) {
    const y = (first + k) * pitch + phase - weight / 2;
    rows.push(
      <rect
        key={k}
        x={-span / 2}
        y={y}
        width={span}
        height={weight}
        fill={fill}
      />,
    );
  }
  return <>{rows}</>;
}

export function MoireReveal({
  value = "10×",
  shape = "text",
  caption = "faster first frame on remocn render",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: MoireRevealProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = THEMES[theme];
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `mc${raw}`;
  const maskId = `mm${raw}`;
  const gradId = `mg${raw}`;
  const beam = BEAM[theme];

  const pitch = 7 * u;
  const weight = Math.max(1, 1.25 * u);
  const span = Math.hypot(W, H) + 8 * pitch;
  const cx = W / 2;
  const cy = H * 0.43;

  const turn = TURN(interpolate(t, [0, TURN_END], [0, 1], CLAMP));
  const angle = START_ANGLE * (1 - turn);
  const phase = DRIFT * pitch * turn;
  const detune = TURN(interpolate(t, [32, TURN_END - 4], [0, 1], CLAMP));
  const inner = pitch * (1 + 0.1 * detune);
  const lock = LOCK(interpolate(t, [LOCK_AT, LOCK_END], [0, 1], CLAMP));
  const locked = t >= LOCK_AT;
  const innerWeight = weight + (inner * 0.66 - weight) * lock;
  const fieldDim = interpolate(
    t,
    [LOCK_AT + 4, LOCK_END + 10],
    [1, theme === "dark" ? 0.34 : 0.3],
    CLAMP,
  );

  const capIn = SETTLE(
    interpolate(t, [CAPTION_AT, CAPTION_AT + 20], [0, 1], CLAMP),
  );
  const capSize = Math.max(15, 22 * u);

  let shapeNode: React.ReactNode;
  let shapeTop: number;
  let shapeBottom: number;
  let shapeW: number;
  if (shape === "mark") {
    const hgt = 0.5 * H;
    const k = hgt / 134.26;
    shapeW = 124.06 * k;
    shapeTop = cy - hgt / 2;
    shapeBottom = cy + hgt / 2;
    shapeNode = (
      <path
        d={REMOCN_R_PATH}
        transform={`translate(${cx - shapeW / 2} ${shapeTop}) scale(${k})`}
      />
    );
  } else {
    const size = Math.min(480 * u, (0.74 * W) / widthEm(value));
    const baseline = cy + 0.36 * size;
    shapeW = widthEm(value) * size;
    shapeTop = baseline - 0.72 * size;
    shapeBottom = baseline;
    shapeNode = (
      <text
        x={cx}
        y={baseline}
        textAnchor="middle"
        fontFamily={geist}
        fontWeight={500}
        fontSize={size}
        letterSpacing={`${-0.035 * size}px`}
      >
        {value}
      </text>
    );
  }

  // The beam gradient runs diagonally across the hero shape; its axis
  // drifts a few degrees over the shot, never more. Coordinates live in the
  // line group's space (translated to the centre; the angle is 0 once locked).
  const drift = interpolate(t, [0, 150], [-6, 6]);
  const gAng = ((128 + drift) * Math.PI) / 180;
  const gLen = Math.hypot(shapeW, shapeBottom - shapeTop) / 2;
  const gcy = (shapeTop + shapeBottom) / 2;
  const gx = Math.cos(gAng) * gLen;
  const gy = Math.sin(gAng) * gLen;

  const rot = `translate(${cx} ${cy}) rotate(${angle})`;
  const flat = `translate(${cx} ${cy})`;
  const capTop = Math.min(shapeBottom + 70 * u, H * 0.84 - capSize);
  const capW = caption ? Math.min(0.8 * W, caption.length * capSize * 0.56) : 0;
  const plateW = capW + 68 * u;
  const plateH = capSize + 28 * u;

  return (
    <AbsoluteFill style={{ background: stage.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>{shapeNode}</clipPath>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x={0} y={0} width={W} height={H} fill="#fff" />
            <g fill="#000">{shapeNode}</g>
          </mask>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={-gx}
            y1={gcy - cy - gy}
            x2={gx}
            y2={gcy - cy + gy}
          >
            <stop offset="0" stopColor={beam[0]} />
            <stop offset="0.34" stopColor={beam[1]} />
            <stop offset="0.68" stopColor={beam[2]} />
            <stop offset="1" stopColor={beam[3]} />
          </linearGradient>
        </defs>
        <g opacity={fieldDim * stage.lineAlpha}>
          <g transform={flat}>
            <Lines
              pitch={pitch}
              weight={weight}
              span={span}
              phase={0}
              fill={stage.line}
            />
          </g>
          <g mask={`url(#${maskId})`}>
            <g transform={rot}>
              <Lines
                pitch={pitch}
                weight={weight}
                span={span}
                phase={phase}
                fill={stage.line}
              />
            </g>
          </g>
        </g>
        <g clipPath={`url(#${clipId})`}>
          {locked ? (
            <rect
              x={0}
              y={0}
              width={W}
              height={H}
              fill={stage.bg}
              opacity={lock}
            />
          ) : null}
          <g opacity={locked ? 1 : fieldDim * stage.lineAlpha}>
            <g transform={rot}>
              <Lines
                pitch={inner}
                weight={innerWeight}
                span={span}
                phase={(phase * inner) / pitch}
                fill={stage.line}
              />
            </g>
            {locked ? (
              <g transform={rot} opacity={lock}>
                <Lines
                  pitch={inner}
                  weight={innerWeight}
                  span={span}
                  phase={(phase * inner) / pitch}
                  fill={`url(#${gradId})`}
                />
              </g>
            ) : null}
          </g>
        </g>
      </svg>
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: cx - plateW / 2,
            top: capTop - 13 * u,
            width: plateW,
            height: plateH,
            background: stage.bg,
            boxShadow: `inset 0 0 0 ${Math.max(1, u)}px ${stage.hair}`,
            borderRadius: plateH / 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: geist,
            fontWeight: 400,
            fontSize: capSize,
            letterSpacing: "-0.015em",
            whiteSpace: "nowrap",
            color: stage.fg,
            opacity: capIn,
            transform: `translateY(${(1 - capIn) * 12 * u}px)`,
          }}
        >
          <span
            style={{
              width: 8 * u,
              height: 8 * u,
              borderRadius: "50%",
              background: accent,
              marginRight: 12 * u,
              flexShrink: 0,
            }}
          />
          {caption}
        </div>
      ) : null}
      <Grain opacity={stage.grain} />
    </AbsoluteFill>
  );
}
