"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/Fraunces";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: serif } = loadSerif("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

export interface HalftoneCutProps {
  from?: string;
  to?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const T0 = 8;
const SPREAD = 34;
const SHRINK_LEN = 14;
const LAG = 12;
const GROW_LEN = 18;
const INK_LEAD = 6;
const INK_OUT = 10;
const INK_LAG = 8;
const INK_IN = 14;
const END = T0 + SPREAD + LAG + INK_LAG + INK_IN;

const SHRINK = Easing.bezier(0.45, 0, 0.6, 1);
const GROW = Easing.bezier(0.3, 0, 0.2, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

type Blob = {
  c: string;
  x: number;
  y: number;
  w: number;
  h: number;
  a: number;
};

/** gradients.sh palettes: "grain" (dark) and "smear" (light). */
const STAGES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    base: "#F5F4F0",
    tint: 0.16,
    ground: "#070505",
    toFg: "#FFF4EA",
    sweep: ["#ffd8b4", "#e0703b", "#8a2c1d", "#2b1015"],
    blobs: [{ c: "#ffd8b4", x: 18, y: 20, w: 60, h: 45, a: 0.85 }] as Blob[],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    base: "#121214",
    tint: 0.07,
    ground: "#efe8dc",
    toFg: "#17120E",
    sweep: [] as string[],
    blobs: [
      { c: "#f7b23b", x: 20, y: 82, w: 62, h: 70, a: 0.85 },
      { c: "#f2552c", x: 82, y: 22, w: 56, h: 66, a: 0.78 },
      { c: "#e889b5", x: 10, y: 10, w: 52, h: 60, a: 0.8 },
      { c: "#2f6b3f", x: 100, y: 104, w: 30, h: 34, a: 0.28 },
    ] as Blob[],
  },
};

/** Fraunces advances (opsz 144), ASCII 32–126, per 1000 em: roman 500, italic 400. */
const ROMAN = [
  162, 227, 276, 560, 518, 594, 882, 140, 308, 306, 568, 455, 190, 239, 187,
  328, 602, 363, 542, 502, 554, 520, 558, 470, 530, 562, 177, 188, 432, 455,
  432, 489, 740, 613, 632, 635, 707, 584, 530, 688, 742, 326, 374, 682, 546,
  801, 670, 731, 610, 740, 650, 560, 609, 658, 598, 904, 634, 601, 562, 300,
  317, 300, 298, 344, 221, 444, 494, 411, 498, 427, 268, 480, 508, 230, 230,
  494, 236, 784, 508, 490, 510, 494, 375, 383, 290, 508, 434, 672, 446, 452,
  402, 340, 222, 340, 482,
];
const ITALIC = [
  156, 278, 252, 548, 480, 572, 598, 128, 309, 308, 537, 455, 179, 263, 180,
  388, 618, 384, 530, 498, 510, 506, 552, 428, 506, 548, 246, 249, 432, 455,
  432, 391, 723, 551, 596, 596, 670, 574, 540, 648, 705, 335, 323, 638, 500,
  773, 600, 686, 593, 688, 613, 521, 514, 606, 534, 851, 576, 520, 548, 324,
  372, 324, 298, 350, 172, 459, 463, 383, 457, 385, 246, 428, 476, 246, 218,
  470, 230, 713, 482, 438, 448, 437, 365, 356, 268, 481, 448, 658, 468, 406,
  406, 330, 222, 327, 482,
];
const TRACK = -0.025;

function widthEm(text: string, table: number[]) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c < 127 ? table[c - 32] : 520) / 1000 + TRACK;
  }
  return Math.max(w - TRACK, 0.5);
}

/** CSS linear-gradient angle → SVG userSpace endpoints. */
function cssLine(W: number, H: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
  return {
    x1: W / 2 - dx * half,
    y1: H / 2 - dy * half,
    x2: W / 2 + dx * half,
    y2: H / 2 + dy * half,
  };
}

function Ground({
  id,
  W,
  H,
  stage,
  k,
}: {
  id: string;
  W: number;
  H: number;
  stage: (typeof STAGES)["dark"];
  k: number;
}) {
  const line = cssLine(W, H, 150 - 6 * k);
  const n = stage.sweep.length;
  return (
    <g>
      <defs>
        {n > 0 ? (
          <linearGradient
            id={`${id}l`}
            gradientUnits="userSpaceOnUse"
            {...line}
          >
            {stage.sweep.map((c, i) => (
              <stop key={c} offset={(0.7 * i) / (n - 1)} stopColor={c} />
            ))}
            <stop offset={0.85} stopColor={stage.ground} />
          </linearGradient>
        ) : null}
        {stage.blobs.map((b, i) => {
          const x = (b.x + (i % 2 === 0 ? 4 : -4) * k) / 100;
          const y = (b.y + (i % 2 === 0 ? 3 : -2) * k) / 100;
          return (
            <radialGradient
              key={b.c}
              id={`${id}r${i}`}
              cx={x}
              cy={y}
              r={b.w / 100}
              gradientTransform={`translate(${x} ${y}) scale(1 ${b.h / b.w}) translate(${-x} ${-y})`}
            >
              <stop offset={0} stopColor={b.c} stopOpacity={b.a} />
              <stop offset={0.68} stopColor={b.c} stopOpacity={0} />
            </radialGradient>
          );
        })}
      </defs>
      <rect width={W} height={H} fill={stage.ground} />
      {n > 0 ? <rect width={W} height={H} fill={`url(#${id}l)`} /> : null}
      {stage.blobs.map((b, i) => (
        <rect key={b.c} width={W} height={H} fill={`url(#${id}r${i})`} />
      ))}
    </g>
  );
}

function dot(cx: number, cy: number, r: number) {
  const x = cx - r;
  const d = 2 * r;
  return `M${x.toFixed(2)} ${cy.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${d.toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-d).toFixed(2)} 0`;
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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function HalftoneCut({
  from = "Draft one",
  to = "Final cut",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: HalftoneCutProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = STAGES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const pitch = 20 * u;
  const R = 0.74 * pitch;
  const cols = Math.ceil(W / pitch) + 1;
  const rows = Math.ceil(H / pitch) + 1;
  const ox = (W - (cols - 1) * pitch) / 2;
  const oy = (H - (rows - 1) * pitch) / 2;
  const ang = 0.52;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const span = W * ca + H * sa;

  let pathA = "";
  let pathB = "";
  let inkA = "";
  let inkB = "";
  let aFull = true;
  let aEmpty = true;
  let bFull = true;
  let bEmpty = true;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = ox + i * pitch;
      const cy = oy + j * pitch;
      const d = Math.min(1, Math.max(0, (cx * ca + cy * sa) / span));
      const a0 = T0 + d * SPREAD;
      const pa = SHRINK(interpolate(t, [a0, a0 + SHRINK_LEN], [0, 1], CLAMP));
      const pb = GROW(
        interpolate(t, [a0 + LAG, a0 + LAG + GROW_LEN], [0, 1], CLAMP),
      );
      const ia = SHRINK(
        interpolate(t, [a0 - INK_LEAD, a0 - INK_LEAD + INK_OUT], [0, 1], CLAMP),
      );
      const ib = GROW(
        interpolate(
          t,
          [a0 + LAG + INK_LAG, a0 + LAG + INK_LAG + INK_IN],
          [0, 1],
          CLAMP,
        ),
      );
      const ra = R * (1 - pa);
      const rb = R * pb;
      if (ia < 1) inkA += dot(cx, cy, R * (1 - ia));
      if (ib > 0) inkB += dot(cx, cy, R * ib);
      if (ia > 0) aFull = false;
      if (ib < 1) bFull = false;
      if (ra > 0.15 * u) {
        aEmpty = false;
        pathA += dot(cx, cy, ra);
      }
      if (rb > 0.15 * u) {
        bEmpty = false;
        pathB += dot(cx, cy, rb);
      }
    }
  }

  const fsA = Math.min(176 * u, (0.8 * W) / widthEm(from, ITALIC));
  const fsB = Math.min(200 * u, (0.82 * W) / widthEm(to, ROMAN));
  const drift = interpolate(t, [0, 108], [0, 1], CLAMP);
  const driftA = 1 + 0.025 * interpolate(t, [0, T0 + SPREAD], [0, 1], CLAMP);
  const settle = SETTLE(
    interpolate(t, [T0 + LAG + 10, END + 14], [0, 1], CLAMP),
  );
  const scaleB = 1.045 - 0.045 * settle;
  const about = (k: number) =>
    `translate(${W / 2} ${H / 2}) scale(${k}) translate(${-W / 2} ${-H / 2})`;

  const title = (
    text: string,
    size: number,
    fill: string,
    k: number,
    italic: boolean,
  ) => (
    <text
      x={W / 2}
      y={H / 2 + 0.35 * size}
      textAnchor="middle"
      fontFamily={serif}
      fontStyle={italic ? "italic" : "normal"}
      fontWeight={italic ? 400 : 500}
      fontSize={size}
      letterSpacing={TRACK * size}
      fill={fill}
      transform={about(k)}
    >
      {text}
    </text>
  );

  return (
    <AbsoluteFill style={{ background: stage.base, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <radialGradient
            id={`l${uid}`}
            cx={0.24 * W}
            cy={0}
            r={0.9 * W}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={accent} stopOpacity={stage.tint} />
            <stop offset="0.7" stopColor={accent} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`s${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.07} />
            <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="1" stopColor="#000000" stopOpacity={0.1} />
          </linearGradient>
          <mask
            id={`a${uid}`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <path d={pathA} fill="#FFFFFF" />
          </mask>
          <mask
            id={`ia${uid}`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <path d={inkA} fill="#FFFFFF" />
          </mask>
          <mask
            id={`ib${uid}`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <path d={inkB} fill="#FFFFFF" />
          </mask>
          <mask
            id={`b${uid}`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <path d={pathB} fill="#FFFFFF" />
          </mask>
        </defs>
        {aEmpty ? null : (
          <g mask={aFull ? undefined : `url(#a${uid})`}>
            <rect width={W} height={H} fill={stage.bg} />
            <rect width={W} height={H} fill={`url(#l${uid})`} />
            {aFull ? (
              title(from, fsA, stage.fg, driftA, true)
            ) : (
              <g mask={`url(#ia${uid})`}>
                {title(from, fsA, stage.fg, driftA, true)}
              </g>
            )}
          </g>
        )}
        {bEmpty ? null : (
          <g mask={bFull ? undefined : `url(#b${uid})`}>
            <Ground id={`d${uid}`} W={W} H={H} stage={stage} k={drift} />
            <rect width={W} height={H} fill={`url(#s${uid})`} />
            {bFull ? (
              title(to, fsB, stage.toFg, scaleB, false)
            ) : (
              <g mask={`url(#ib${uid})`}>
                {title(to, fsB, stage.toFg, scaleB, false)}
              </g>
            )}
          </g>
        )}
      </svg>
      <Grain opacity={theme === "light" ? 0.04 : 0.055} />
    </AbsoluteFill>
  );
}
