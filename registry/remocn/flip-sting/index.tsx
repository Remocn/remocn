"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface FlipStingProps {
  /** Small line under the logo once the flip settles. Pass "" to hide. */
  line?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// A studio-ident sting in the manner of the Marvel Studios flip-book: the
// logo is a stencil, a flip-book of flat graphic frames riffles inside it.
//
// Beat sheet (30fps, speed 1):
//  0–68    the camera pulls out of the R to the whole logo (fast, then
//          settling); inside the letters, flat frames flip every 2 frames
//  28–64   the flip slows: 3, 3, 3, 4, 4, 5, 6, 8 frames a page
//  64      the last page lands: the logo fills with the gradient and holds
//  74–88   the line rises in under the logo; slow push, poster hold to 130
const PULL_END = 68;
const LINE_AT = 74;
/** Frames the demo needs: the flip plus a long poster hold. */
export const FLIP_STING_DURATION = 130;

/** Page lengths: a fast riffle that slows into the final fill. */
const PAGES = [
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6, 8,
];
const SETTLE_AT = PAGES.reduce((a, b) => a + b, 0);

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const PULL = Easing.bezier(0.25, 0.4, 0.1, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

/** gradients.sh "limb" palette: the fill the flip settles on. */
const LIMB = ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    /** The flat ink that pages are printed on, opposite the stage. */
    ink: "#F5F4F0",
    muted: "#9A9893",
    fill: [LIMB[0], LIMB[1], LIMB[2]],
  },
  light: {
    bg: "#F5F4F0",
    ink: "#0A0A0B",
    muted: "#6E6C67",
    fill: [LIMB[1], LIMB[2], LIMB[3]],
  },
} as const;

type Colors = (typeof THEMES)[keyof typeof THEMES];

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_W = 124.06;
const R_H = 134.26;

/**
 * The remocn.dev logo in em: the R is 0.76em tall on the baseline, then a
 * 0.04em gap and "emocn" in Manrope 600 at -0.025em (harfbuzz width 3.25em).
 */
const R_HEIGHT = 0.76;
const R_WIDTH = (R_HEIGHT * R_W) / R_H;
const GAP = 0.04;
const WORD_TRACK = -0.025;
const WORD_WIDTH = 3.25 + WORD_TRACK * 4;
const LOGO_WIDTH = R_WIDTH + GAP + WORD_WIDTH;

function hash(i: number, salt: number) {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * The logo as clip geometry, its visual centre on the origin of `camera`.
 * A clipPath can't hold a <g>, so the camera goes on every shape.
 */
function LogoShape({ size, camera }: { size: number; camera: string }) {
  const left = (-LOGO_WIDTH * size) / 2;
  const baseline = (R_HEIGHT * size) / 2;
  const k = (R_HEIGHT * size) / R_H;
  return (
    <>
      <path
        d={REMOCN_R_PATH}
        transform={`${camera} translate(${left} ${baseline - R_HEIGHT * size}) scale(${k})`}
      />
      <text
        x={left + (R_WIDTH + GAP) * size}
        y={baseline}
        fontFamily={manrope.fontFamily}
        fontWeight={600}
        fontSize={size}
        letterSpacing={WORD_TRACK * size}
        transform={camera}
      >
        emocn
      </text>
    </>
  );
}

/**
 * One flat frame of the flip-book, drawn in screen space. Pages are printed
 * on the ink or the accent, never on the stage colour, so the letters always
 * read as a silhouette.
 */
function Page({
  index,
  W,
  H,
  c,
  accent,
}: {
  index: number;
  W: number;
  H: number;
  c: Colors;
  accent: string;
}) {
  const design = (index * 7 + 3) % 9;
  const jx = (hash(index, 1) - 0.5) * W * 0.3;
  const jy = (hash(index, 2) - 0.5) * H * 0.3;
  const onAccent = index % 2 === 0;
  const field = onAccent ? accent : c.ink;
  // The big shape is the other printing ink; the small mark comes from the
  // limb palette. Neither is ever the stage colour, so no page can punch a
  // hole in the logo.
  const dark = onAccent ? c.ink : accent;
  const mark = LIMB[1];
  const els: ReactNode[] = [];
  switch (design) {
    case 0: {
      // A giant page number.
      els.push(
        <text
          key="n"
          x={W * 0.5 + jx}
          y={H * 0.82 + jy * 0.4}
          textAnchor="middle"
          fontFamily={manrope.fontFamily}
          fontWeight={400}
          fontSize={H * 1.05}
          letterSpacing={-0.04 * H}
          fill={dark}
        >
          {String((index % 9) + 1).padStart(2, "0")}
        </text>,
      );
      break;
    }
    case 1: {
      els.push(
        <circle
          key="c"
          cx={W * 0.58 + jx}
          cy={H * 0.5 + jy}
          r={H * 0.42}
          fill={dark}
        />,
        <circle
          key="d"
          cx={W * 0.58 + jx + H * 0.3}
          cy={H * 0.5 + jy - H * 0.3}
          r={H * 0.09}
          fill={mark}
        />,
      );
      break;
    }
    case 2: {
      const band = H / 9;
      for (let b = 0; b < 9; b += 2) {
        els.push(
          <rect
            key={b}
            x={0}
            y={b * band + (jy % band)}
            width={W}
            height={band}
            fill={dark}
          />,
        );
      }
      break;
    }
    case 3: {
      const x = W * 0.45 + jx;
      els.push(
        <polygon
          key="s"
          points={`${x - H * 0.2},${H} ${x + H * 0.25},${H} ${x + H * 0.95},0 ${x + H * 0.5},0`}
          fill={mark}
        />,
        <polygon
          key="t"
          points={`${x - H * 0.9},${H} ${x - H * 0.45},${H} ${x + H * 0.25},0 ${x - H * 0.2},0`}
          fill={dark}
        />,
      );
      break;
    }
    case 4: {
      const step = H / 6;
      const r = step * 0.28;
      for (let gy = 0; gy < 7; gy++) {
        for (let gx = 0; gx < Math.ceil(W / step) + 1; gx++) {
          els.push(
            <circle
              key={`${gx}-${gy}`}
              cx={gx * step + (jx % step)}
              cy={gy * step + step / 2}
              r={r}
              fill={dark}
            />,
          );
        }
      }
      break;
    }
    case 5: {
      let x = (jx % (W * 0.1)) - W * 0.1;
      let b = 0;
      while (x < W) {
        const w = W * (0.025 + hash(index * 13 + b, 4) * 0.07);
        if (b % 2 === 0) {
          els.push(
            <rect
              key={b}
              x={x}
              y={0}
              width={w}
              height={H}
              fill={b % 4 === 0 ? dark : mark}
            />,
          );
        }
        x += w;
        b++;
      }
      break;
    }
    case 6: {
      els.push(
        <circle
          key="r"
          cx={W * 0.5 + jx}
          cy={H * 0.5 + jy}
          r={H * 0.36}
          fill="none"
          stroke={dark}
          strokeWidth={H * 0.16}
        />,
      );
      break;
    }
    case 7: {
      // The R itself, huge and cropped.
      const h = H * 1.5;
      els.push(
        <path
          key="R"
          d={REMOCN_R_PATH}
          fill={dark}
          transform={`translate(${W * 0.3 + jx} ${-H * 0.2 + jy}) scale(${h / R_H})`}
        />,
      );
      break;
    }
    default: {
      const s = H * 0.24;
      for (let k = 3; k >= 0; k--) {
        els.push(
          <rect
            key={k}
            x={W * 0.5 + jx - s * (k + 1)}
            y={H * 0.5 + jy - s * (k + 1)}
            width={s * 2 * (k + 1)}
            height={s * 2 * (k + 1)}
            fill={k % 2 === 0 ? dark : field}
          />,
        );
      }
    }
  }
  return (
    <>
      <rect width={W} height={H} fill={field} />
      {els}
    </>
  );
}

export function FlipSting({
  line = "LAUNCH FILMS",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: FlipStingProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const size = Math.min((W * 0.62) / LOGO_WIDTH, (H * 0.3) / R_HEIGHT);
  const showLine = line !== "";
  const centerY = showLine ? H * 0.46 : H * 0.5;

  // Camera: out of the R, settling on the whole logo, then a slow push.
  const pull = interpolate(t, [0, PULL_END], [0, 1], {
    ...CLAMP,
    easing: PULL,
  });
  const push = interpolate(t, [PULL_END, FLIP_STING_DURATION], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const s0 = 3.6;
  const scale = Math.exp(Math.log(s0) * (1 - pull)) * (1 + push * 0.025);
  const focusX =
    ((-LOGO_WIDTH * size) / 2 + R_WIDTH * size * 0.42) * (1 - pull);
  const focusY = -R_HEIGHT * size * 0.1 * (1 - pull);

  // Which page of the flip-book is up.
  let page = -1;
  let acc = 0;
  for (let i = 0; i < PAGES.length; i++) {
    if (t < acc + PAGES[i]) {
      page = i;
      break;
    }
    acc += PAGES[i];
  }
  const settled = page === -1 || t >= SETTLE_AT;
  const drift = interpolate(t, [SETTLE_AT, FLIP_STING_DURATION], [0, 1], CLAMP);

  const lineIn = interpolate(t, [LINE_AT, LINE_AT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const logoBottom = centerY + (R_HEIGHT * size * scale) / 2;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={`${uid}-logo`}>
            <LogoShape
              size={size}
              camera={`translate(${W / 2} ${centerY}) scale(${scale}) translate(${-focusX} ${-focusY})`}
            />
          </clipPath>
          <linearGradient
            id={`${uid}-fill`}
            gradientUnits="userSpaceOnUse"
            x1={W * (0.2 + drift * 0.06)}
            y1={centerY - size * 0.6}
            x2={W * (0.8 + drift * 0.06)}
            y2={centerY + size * 0.6}
          >
            <stop offset="0" stopColor={c.fill[0]} />
            <stop offset="0.5" stopColor={c.fill[1]} />
            <stop offset="1" stopColor={c.fill[2]} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${uid}-logo)`}>
          {settled ? (
            <rect width={W} height={H} fill={`url(#${uid}-fill)`} />
          ) : (
            <Page index={page} W={W} H={H} c={c} accent={accent} />
          )}
        </g>
      </svg>
      {showLine ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: logoBottom + H * 0.075,
            textAlign: "center",
            fontFamily: mono.fontFamily,
            fontWeight: 400,
            fontSize: H * 0.03,
            lineHeight: 1,
            letterSpacing: "0.42em",
            paddingLeft: "0.42em",
            color: c.muted,
            opacity: lineIn,
            transform: `translateY(${(1 - lineIn) * H * 0.015}px)`,
          }}
        >
          {line}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
