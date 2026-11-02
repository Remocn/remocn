"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface RubberbandWordProps {
  /** The word the cursor grabs by its last letter. */
  word?: string;
  /** What the word becomes on the snap. Leave empty to keep the word and only accent it. */
  snapWord?: string;
  /** Close the final word with an accent period. */
  period?: boolean;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Sora 500, per 1000 em, chars 32–126 (harfbuzz, wght 500).
const ADV = [
  222, 303, 452, 702, 652, 864, 702, 264, 382, 382, 568, 592, 266, 506, 266,
  365, 750, 423, 623, 620, 652, 630, 668, 585, 647, 668, 266, 266, 592, 590,
  592, 556, 1124, 765, 684, 797, 788, 598, 560, 832, 803, 320, 641, 703, 549,
  937, 858, 865, 649, 865, 710, 682, 602, 785, 719, 1052, 705, 654, 652, 382,
  365, 382, 587, 581, 300, 581, 694, 608, 694, 616, 380, 679, 644, 317, 324,
  595, 296, 973, 644, 678, 694, 694, 414, 543, 429, 634, 572, 873, 574, 555,
  493, 382, 375, 382, 511,
];
const RSB = [
  0, 81, 81, 35, 50, 31, 25, 80, 13, 64, 45, 60, 51, 59, 65, 23, 67, 110, 53,
  55, 24, 42, 47, 31, 47, 66, 65, 48, 74, 60, 74, 43, 61, 23, 60, 33, 41, 59,
  44, 31, 98, 100, 86, -9, 26, 98, 98, 51, 32, 51, 21, 49, 24, 84, 28, 27, 15,
  15, 43, 50, 15, 102, 60, 0, 86, 77, 48, 35, 86, 40, 10, 80, 77, 88, 84, 1, 86,
  77, 77, 48, 48, 86, 18, 42, 41, 88, 30, 34, 16, 24, 34, 43, 136, 52, 20,
];
const LSB = [
  0, 82, 81, 35, 49, 31, 29, 81, 64, 13, 45, 61, 20, 59, 65, 23, 67, 39, 62, 41,
  43, 53, 66, 43, 47, 47, 65, 23, 74, 61, 74, 36, 61, 23, 98, 52, 98, 98, 98,
  52, 98, 100, 37, 98, 98, 98, 98, 52, 98, 52, 98, 48, 25, 84, 22, 27, 14, 13,
  54, 102, 15, 50, 61, 0, 0, 41, 86, 48, 48, 48, 28, 48, 86, 33, 0, 86, 21, 86,
  86, 48, 86, 48, 86, 39, 12, 74, 21, 23, 23, 14, 49, 52, 136, 43, 20,
];
// Lowercase + period kerning pairs, |k| >= 10/1000.
const KERN = new Map(
  [
    "bv-11 bw-11 bx-12 by-11 b.-13 ff-38 fl12 fv17 fw17 fy17 f.-43 kc-15",
    "kd-15 ke-15 kg-15 ko-15 kq-15 ks-10 ov-11 ow-11 ox-12 oy-11 o.-13",
    "pv-11 pw-11 px-12 py-11 p.-13 qj15 rt11 rv18 rw18 ry18 r.-61 vc-11",
    "vd-11 ve-11 vg-11 vo-11 vq-11 vt10 v.-37 wc-11 wd-11 we-11 wg-11 wo-11",
    "wq-11 wt10 w.-37 xa-10 xc-12 xd-12 xe-12 xg-12 xo-12 xq-12 xu-12 yc-11",
    "yd-11 ye-11 yg-11 yo-11 yq-11 yt10 y.-37 .c-13 .d-13 .e-13 .g-13 .o-13",
    ".q-13 .u-17 .v-37 .w-37 .y-37",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000] as const),
);
// Sora's hhea box is 0.97 + 0.29 em; with lineHeight 1 the baseline sits at 0.84.
const TRACK = -0.03;
const BASELINE = 0.84;
const XHEIGHT = 0.534;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "halo" palette (#fff4ec #ffb36b #e2457a #3d4dff), warm end at
// the word, accent end at the pulled letter. The band carries it while pulled;
// the snapped word inherits it. Light swaps the pale amber for one that reads.
const THEMES = {
  dark: { bg: "#0A0A0B", fg: "#F3F2EF", halo: ["#FFB36B", "#E2457A"] },
  light: { bg: "#F5F4F0", fg: "#121214", halo: ["#E8743A", "#D83A71"] },
} as const;

// Beats (frames at speed 1).
const GRAB = 22;
const DRAG_END = 56;
const RELEASE = 64;

function adv(ch: string) {
  const c = ch.charCodeAt(0);
  return (c >= 32 && c < 127 ? ADV[c - 32] : 600) / 1000;
}
function lsb(ch: string) {
  const c = ch.charCodeAt(0);
  return (c >= 32 && c < 127 ? LSB[c - 32] : 50) / 1000;
}
function rsb(ch: string) {
  const c = ch.charCodeAt(0);
  return (c >= 32 && c < 127 ? RSB[c - 32] : 50) / 1000;
}

/** Glyph left edges and widths in em, plus the total advance. */
function layout(text: string) {
  const xs: number[] = [];
  const ws: number[] = [];
  let x = 0;
  for (let i = 0; i < text.length; i++) {
    if (i > 0) x += (KERN.get(text[i - 1] + text[i]) ?? 0) + TRACK;
    xs.push(x);
    ws.push(adv(text[i]));
    x += adv(text[i]);
  }
  return { xs, ws, width: x };
}

/**
 * The elastic. Pulled (`s > 0`): the grabbed last glyph travels with the
 * cursor, the letters before it spread a little toward it and squash. On the
 * overshoot (`s < 0`) the whole word compresses evenly, so nothing overlaps.
 */
function elastic(
  i: number,
  count: number,
  xs: number[],
  s: number,
  sMax: number,
) {
  const last = count - 1;
  const u = count > 1 ? (xs[i] - xs[0]) / Math.max(1e-3, xs[last] - xs[0]) : 1;
  if (s >= 0) {
    const k = s / sMax;
    if (i === last) return { dx: s, sx: 1 + 0.07 * k, sy: 1 - 0.07 * k };
    return {
      dx: s * 0.16 * u ** 1.3,
      sx: 1 + 0.05 * k * u,
      sy: 1 - 0.05 * k * u,
    };
  }
  const k = Math.max(-1, s / (sMax * 0.14));
  return { dx: s * 0.5 * u, sx: 1 + 0.05 * k * u, sy: 1 - 0.07 * k * u };
}

/** Taffy band between the word and the pulled letter: thins and pinches as it grows. */
function bandPath(
  xL: number,
  xR: number,
  cy: number,
  xh: number,
  F: number,
  thinAs: number,
) {
  const L = Math.max(0, xR - xL);
  const thin = (1 / (1 + Math.max(0, thinAs) / (0.55 * F))) ** 0.85;
  const a = xh * 0.5 * Math.max(0.2, thin * 0.75);
  const b = xh * 0.5 * Math.max(0.4, 0.95 * thin ** 0.4);
  const c = a * (0.62 + 0.38 * thin);
  const h1 = xL + L * 0.38;
  const h2 = xR - L * 0.38;
  return [
    `M${xL} ${cy - a}`,
    `C${h1} ${cy - c} ${h2} ${cy - c} ${xR} ${cy - b}`,
    `L${xR} ${cy + b}`,
    `C${h2} ${cy + c} ${h1} ${cy + c} ${xL} ${cy + a}`,
    `A${a} ${a} 0 0 1 ${xL} ${cy - a}Z`,
  ].join("");
}

function Cursor({ size, pressed }: { size: number; pressed: number }) {
  return (
    <svg
      width={size * 0.7}
      height={size}
      viewBox="0 0 17.5 25"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        transformOrigin: "6% 6%",
        transform: `scale(${1 - 0.1 * pressed})`,
        filter: "drop-shadow(0 1.5px 2px rgba(0,0,0,0.32))",
      }}
      aria-hidden
    >
      <path
        d="M1.5 1.5 L1.5 20.6 L6.1 16.3 L9.1 23.2 L12.6 21.7 L9.7 14.9 L15.9 14.9 Z"
        fill="#0A0A0B"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RubberbandWord({
  word = "tension",
  snapWord = "release",
  period = true,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RubberbandWordProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const t = THEMES[theme];

  const from = word.trim() || "tension";
  const to = snapWord.trim() || from;
  const swaps = to !== from;

  const A = layout(from);
  const B = layout(to);
  const dotW = period ? adv(".") + TRACK : 0;
  const longest = Math.max(A.width, B.width + dotW);
  const F = Math.min(H * 0.27, (W * 0.54) / longest);
  const xh = XHEIGHT * F;
  const baseline = H * 0.5 + xh * 0.5;
  const cy = baseline - xh * 0.5;
  const leftA = (W - A.width * F) / 2;
  const leftB = swaps ? (W - (B.width + dotW) * F) / 2 : leftA;
  const sMax = W * 0.21;

  // Pull: drag out, hold the tension, then let go with one damped overshoot.
  const drag = interpolate(frame, [GRAB + 4, DRAG_END], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const creep = interpolate(frame, [DRAG_END, RELEASE], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const held = sMax * (0.95 * drag + 0.05 * creep);
  const snap = spring({
    frame: frame - RELEASE,
    fps,
    config: { damping: 15, stiffness: 230, mass: 1 },
  });
  const s = frame < RELEASE ? held : sMax * (1 - snap);

  // Grab point: the last glyph's right stem, at mid x-height.
  const lastA = from.length - 1;
  const grabX0 =
    leftA + (A.xs[lastA] + A.ws[lastA] - rsb(from[lastA])) * F - F * 0.05;
  const press = interpolate(
    frame,
    [GRAB, GRAB + 3, RELEASE, RELEASE + 4],
    [0, 1, 1, 0],
    CLAMP,
  );
  const approach = interpolate(frame, [0, GRAB], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const startX = W * 0.8;
  const startY = H * 0.86;
  const arc = Math.sin(approach * Math.PI) * H * 0.05;
  const away = interpolate(frame, [RELEASE + 1, RELEASE + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lift = H * 0.015 * (0.95 * drag + 0.05 * creep);
  let cx = startX + (grabX0 - startX) * approach + arc * 0.5;
  let cyCursor = startY + (cy - startY) * approach + arc;
  if (frame >= GRAB) {
    cx = grabX0 + held;
    cyCursor = cy - lift;
  }
  if (frame >= RELEASE) {
    cx = grabX0 + sMax + W * 0.03 * away;
    cyCursor = cy - H * 0.015 + H * 0.06 * away;
  }
  const cursorOpacity = interpolate(
    frame,
    [RELEASE + 8, RELEASE + 22],
    [1, 0],
    CLAMP,
  );
  const cursorSize = H * 0.085;

  // The swap rides the snap: the old word squashes flat onto its baseline,
  // the new one springs up out of that line with one overshoot.
  const SWAP = RELEASE + 4;
  const clipTop = baseline - F * 0.98;
  const clipH = F * 1.24;
  const squash = (i: number, count: number, incoming: boolean) => {
    const start = SWAP + (count - 1 - i) * 0.5 + (incoming ? 4 : 0);
    if (!incoming) {
      return interpolate(frame, [start, start + 5], [1, 0], {
        ...CLAMP,
        easing: Easing.bezier(0.55, 0, 1, 0.45),
      });
    }
    return spring({
      frame: frame - start,
      fps,
      config: { damping: 12, stiffness: 240, mass: 0.8 },
    });
  };
  const halo = [t.halo[0], t.halo[1], accent];
  const wordGradient = `linear-gradient(90deg, ${halo[0]} 0%, ${halo[1]} 52%, ${halo[2]} 100%)`;
  // The fill is a touch wider than the word and slides a few percent so the
  // last letter settles on the accent, next to the accent period.
  const gradW = B.width * F * 1.12;
  const gradShift =
    B.width *
    F *
    0.12 *
    interpolate(frame, [RELEASE, RELEASE + 60], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.45, 0, 0.55, 1),
    });
  const accentOn = interpolate(frame, [GRAB, GRAB + 3], [0, 1], CLAMP) > 0.5;

  const glyphs = (
    text: string,
    L: ReturnType<typeof layout>,
    left: number,
    incoming: boolean,
  ) =>
    text.split("").map((ch, i) => {
      const g = elastic(i, text.length, L.xs, s, sMax);
      const q = swaps ? squash(i, text.length, incoming) : 1;
      if (q <= 0.01) return null;
      const isLast = i === text.length - 1;
      const color =
        !incoming && isLast && accentOn && (swaps || frame < RELEASE + 6)
          ? accent
          : t.fg;
      const w = L.ws[i] * F;
      // The snapped word wears the gradient; without a swap the word itself does.
      const fill: React.CSSProperties =
        incoming || (!swaps && frame >= RELEASE + 6)
          ? {
              color: "transparent",
              backgroundImage: wordGradient,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${gradW}px ${F}px`,
              backgroundPosition: `${-L.xs[i] * F - gradShift}px 0px`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }
          : { color };
      return (
        <span
          key={`${uid}-${incoming ? "b" : "a"}-${i}`}
          style={{
            position: "absolute",
            left: left + L.xs[i] * F + g.dx,
            top: baseline - clipTop - BASELINE * F,
            width: w,
            fontSize: F,
            lineHeight: 1,
            ...fill,
            opacity: Math.min(1, q * 6),
            transformOrigin: `50% ${BASELINE * F}px`,
            transform: `scale(${g.sx}, ${g.sy * q})`,
            whiteSpace: "pre",
          }}
        >
          {ch}
        </span>
      );
    });

  // Band: from just inside the previous glyph to the pulled glyph's left stem.
  let band = "";
  let bandX: [number, number] = [0, 1];
  const bandOpacity =
    interpolate(s, [sMax * 0.02, sMax * 0.1], [0, 1], CLAMP) *
    interpolate(frame, [RELEASE, RELEASE + 5], [1, 0], CLAMP);
  if (from.length > 1 && bandOpacity > 0) {
    const prev = lastA - 1;
    const gp = elastic(prev, from.length, A.xs, s, sMax);
    const gl = elastic(lastA, from.length, A.xs, s, sMax);
    const wp = A.ws[prev] * F;
    const wl = A.ws[lastA] * F;
    const xL =
      leftA +
      A.xs[prev] * F +
      gp.dx +
      wp / 2 +
      (wp / 2 - rsb(from[prev]) * F) * gp.sx -
      F * 0.1;
    const xR =
      leftA +
      A.xs[lastA] * F +
      gl.dx +
      wl / 2 -
      (wl / 2 - lsb(from[lastA]) * F) * gl.sx +
      F * 0.05;
    // After the release the band stays thin while it whips back and fades.
    const thinAs = frame >= RELEASE ? Math.max(xR - xL, sMax * 0.8) : xR - xL;
    band = bandPath(xL, xR, cy, xh * gl.sy, F, thinAs);
    bandX = [xL - xh * 0.3, xR];
  }

  const dotIn = interpolate(frame, [SWAP + 10, SWAP + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lastB = to.length - 1;
  const gB = elastic(lastB, to.length, B.xs, s, sMax);
  const dotLeft = leftB + (B.xs[lastB] + B.ws[lastB] + TRACK) * F + gB.dx;

  return (
    <AbsoluteFill style={{ background: t.bg }}>
      {band ? (
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${uid}-band`}
              gradientUnits="userSpaceOnUse"
              x1={bandX[0]}
              y1={0}
              x2={bandX[1]}
              y2={0}
            >
              <stop offset="0" stopColor={halo[0]} />
              <stop offset="0.55" stopColor={halo[1]} />
              <stop offset="1" stopColor={halo[2]} />
            </linearGradient>
          </defs>
          <path d={band} fill={`url(#${uid}-band)`} opacity={bandOpacity} />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: clipTop,
          width: W,
          height: clipH,
          overflow: "hidden",
          fontFamily: sans,
          fontWeight: 500,
        }}
      >
        {glyphs(from, A, leftA, false)}
        {swaps ? glyphs(to, B, leftB, true) : null}
        {period ? (
          <span
            style={{
              position: "absolute",
              left: dotLeft,
              top: baseline - clipTop - BASELINE * F,
              fontSize: F,
              lineHeight: 1,
              color: accent,
              opacity: dotIn,
              transformOrigin: `30% ${BASELINE * F}px`,
              transform: `scale(${0.6 + 0.4 * dotIn})`,
            }}
          >
            .
          </span>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: cx - cursorSize * 0.06,
          top: cyCursor - cursorSize * 0.06,
          opacity: cursorOpacity,
        }}
      >
        <Cursor size={cursorSize} pressed={press} />
      </div>
    </AbsoluteFill>
  );
}
