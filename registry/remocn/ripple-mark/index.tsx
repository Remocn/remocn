"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { getLength, getPointAtLength, getSubpaths } from "@remotion/paths";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Manrope is the remocn.dev brand face: 600 for the logo's "emocn" (the brand
// asset), 500 for any other name set next to a custom mark.
const { fontFamily: manrope } = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface RippleMarkProps {
  logo?: string | string[];
  name?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// The real remocn.dev "R" mark (viewBox 124.06 × 134.26).
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const DEFAULT_MARK = [REMOCN_R_PATH];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const GROW = Easing.bezier(0.34, 1.32, 0.64, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    dot: "#E8E7EA",
    dotAlpha: 0.42,
    light: "rgba(255,255,255,0.05)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    dot: "#2A2A2E",
    dotAlpha: 0.34,
    light: "rgba(255,255,255,0.8)",
    grain: 0.045,
  },
} as const;

// gradients.sh "beam" across the lit mark: bright top-left into the brand blue.
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"];
function ramp(stops: string[], n: number) {
  return Array.from({ length: n }, (_, i) => {
    const k = (i / (n - 1)) * (stops.length - 1);
    const j = Math.min(stops.length - 2, Math.floor(k));
    const f = k - j;
    const a = Number.parseInt(stops[j].slice(1), 16);
    const b = Number.parseInt(stops[j + 1].slice(1), 16);
    const ch = (sh: number) =>
      Math.round(((a >> sh) & 255) * (1 - f) + ((b >> sh) & 255) * f)
        .toString(16)
        .padStart(2, "0");
    return `#${ch(16)}${ch(8)}${ch(0)}`;
  });
}
const LIT_STEPS = 8;

const RIPPLE_AT = 7;
const PAN_AT = 46;
const PAN_DUR = 30;
const WORD_AT = 56;
const BUCKETS = 5;

// Manrope advance widths (per 1000 em) for ASCII 32–126, extracted offline.
const MANROPE_600 = [
  200, 344, 442, 928, 615, 900, 662, 244, 444, 444, 456, 574, 290, 420, 286,
  418, 642, 422, 587, 572, 602, 584, 622, 523, 602, 622, 328, 330, 630, 750,
  630, 544, 910, 658, 625, 730, 690, 580, 516, 723, 710, 264, 488, 630, 526,
  850, 706, 740, 627, 740, 650, 644, 604, 714, 628, 962, 639, 593, 647, 418,
  418, 418, 676, 660, 522, 570, 608, 568, 608, 596, 370, 608, 615, 264, 276,
  524, 264, 882, 615, 610, 608, 608, 386, 536, 422, 615, 538, 790, 545, 548,
  532, 439, 284, 439, 698,
];
const MANROPE_500 = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];

// Manrope in a line-height: 1 box: baseline sits 0.883em below the top.
const BASELINE = 0.883;

function textWidth(text: string, size: number, tracking: number, w: number[]) {
  let em = 0;
  const chars = Array.from(text);
  chars.forEach((ch, i) => {
    const code = ch.charCodeAt(0);
    em += (code >= 32 && code < 127 ? w[code - 32] : 600) / 1000;
    if (i < chars.length - 1) em += tracking;
  });
  return em * size;
}

type Poly = [number, number][];

function insideEvenOdd(px: number, py: number, polys: Poly[]) {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function flattenLogo(paths: string[]) {
  const parts = paths.map((d) => {
    const polys: Poly[] = [];
    for (const sub of getSubpaths(d)) {
      const len = getLength(sub);
      if (len <= 0) continue;
      const n = Math.max(24, Math.min(600, Math.ceil(len * 4)));
      const poly: Poly = [];
      for (let i = 0; i <= n; i++) {
        const p = getPointAtLength(sub, (len * i) / n);
        if (p) poly.push([p.x, p.y]);
      }
      polys.push(poly);
    }
    return polys;
  });
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const polys of parts) {
    for (const poly of polys) {
      for (const [x, y] of poly) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { parts, minX, minY, w: maxX - minX || 1, h: maxY - minY || 1 };
}

export function RippleMark({
  logo,
  name = "remocn",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RippleMarkProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pal = THEMES[theme];

  const paths = useMemo(
    () => (logo ? (Array.isArray(logo) ? logo : [logo]) : DEFAULT_MARK),
    [logo],
  );
  const shape = useMemo(() => flattenLogo(paths), [paths]);

  // Fine pitch so the R's strokes read three to four dots thick.
  const pitch = H / 80;
  const markH = H * 0.245;
  const scale = markH / shape.h;
  const markW = shape.w * scale;
  // Default mark + "remocn" is the real logo: the R stands in for the first
  // letter, "emocn" follows in Manrope 600 with the R 0.76em tall on the
  // baseline. Any other name is set beside the mark in Manrope 500.
  const brand = !logo && name.trim().toLowerCase() === "remocn";
  const word = brand ? "emocn" : name;
  const fontSize = brand ? markH / 0.76 : (markH * 0.46) / 0.54;
  const weight = brand ? 600 : 500;
  const tracking = brand ? -0.025 : -0.02;
  const wordW = word
    ? textWidth(word, fontSize, tracking, brand ? MANROPE_600 : MANROPE_500)
    : 0;
  const gap = word ? (brand ? fontSize * 0.07 : markH * 0.28) : 0;
  const groupW = markW + gap + wordW;
  const pan = word ? W / 2 - markW / 2 - (W - groupW) / 2 : 0;

  const ox = W / 2;
  const oy = H / 2;
  const markLeft = ox - markW / 2;
  const markTop = oy - markH / 2;

  const grid = useMemo(() => {
    const c0 = Math.floor((-pitch * 2 - ox) / pitch);
    const c1 = Math.ceil((W + pan + pitch * 2 - ox) / pitch);
    const r0 = Math.floor((-pitch * 2 - oy) / pitch);
    const r1 = Math.ceil((H + pitch * 2 - oy) / pitch);
    const out: { x: number; y: number; d: number; cov: number }[] = [];
    const S = 4;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const x = ox + (c + 0.5) * pitch;
        const y = oy + (r + 0.5) * pitch;
        let cov = 0;
        if (
          x > markLeft - pitch &&
          x < markLeft + markW + pitch &&
          y > markTop - pitch &&
          y < markTop + markH + pitch
        ) {
          let hits = 0;
          for (let i = 0; i < S; i++) {
            for (let j = 0; j < S; j++) {
              const sx = x + ((i + 0.5) / S - 0.5) * pitch;
              const sy = y + ((j + 0.5) / S - 0.5) * pitch;
              const lx = (sx - markLeft) / scale + shape.minX;
              const ly = (sy - markTop) / scale + shape.minY;
              if (shape.parts.some((polys) => insideEvenOdd(lx, ly, polys)))
                hits++;
            }
          }
          cov = hits / (S * S);
        }
        out.push({ x, y, d: Math.hypot(x - ox, y - oy), cov });
      }
    }
    return out;
  }, [pitch, ox, oy, W, H, pan, markLeft, markTop, markW, markH, scale, shape]);

  const v = 13 * u;
  const panE = EASE_IO(
    interpolate(t, [PAN_AT, PAN_AT + PAN_DUR], [0, 1], CLAMP),
  );
  const px = -pan * panE;
  const r0 = pitch * 0.15;
  const rOut = pitch * 0.09;
  const rIn = pitch * 0.47;
  const pre = interpolate(t, [0, RIPPLE_AT, RIPPLE_AT + 6], [0, 1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const reach = Math.hypot(W + pan, H) * 0.75;

  const neutral: string[][] = Array.from({ length: BUCKETS }, () => []);
  // key runs 1 (top-left) → 0 (bottom-right); buckets are indexed by key.
  // The palette's mid blue is swapped for the accent so the mark stays on brand.
  const LITC = useMemo(
    () =>
      theme === "light"
        ? ramp([BEAM[3], accent, accent, BEAM[1]], LIT_STEPS)
        : ramp([accent, accent, BEAM[1], "#dfe7ff"], LIT_STEPS),
    [theme, accent],
  );
  const lit: string[][] = Array.from({ length: LIT_STEPS }, () => []);
  const circle = (x: number, y: number, r: number) =>
    `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`;

  for (const p of grid) {
    const local = t - RIPPLE_AT - p.d / v;
    const amp = Math.max(0, 1 - p.d / reach);
    const g = Math.exp(-((local / 3.4) ** 2)) * amp;
    const push = Math.exp(-(((local - 1.5) / 3) ** 2)) * amp;
    const ux = p.d > 0 ? (p.x - ox) / p.d : 0;
    const uy = p.d > 0 ? (p.y - oy) / p.d : 0;
    const x = p.x + px + ux * push * 4 * u;
    const y = p.y + uy * push * 4 * u;
    if (x < -pitch || x > W + pitch || y < -pitch || y > H + pitch) continue;

    let r: number;
    if (p.cov > 0.4 && local > 0) {
      const k = GROW(interpolate(local, [0, 14], [0, 1], CLAMP));
      const fill = Math.min(1, (p.cov - 0.4) / 0.35);
      r = r0 + (rIn * (0.5 + 0.5 * fill) - r0) * k;
      r *= 1 + g * 0.25;
      const lx = (p.x - markLeft) / markW;
      const ly = (p.y - markTop) / markH;
      const key = 1 - (lx * 0.6 + ly * 0.4);
      const n = LIT_STEPS;
      lit[Math.max(0, Math.min(n - 1, Math.floor(key * n)))].push(
        circle(x, y, r),
      );
      continue;
    }
    const settle = EASE_OUT(interpolate(local, [0, 18], [0, 1], CLAMP));
    r = r0 + (rOut - r0) * settle;
    r *= 1 + g * 1.5;
    if (p.d < pitch * 0.8) r *= 1 + pre * 1.6;
    const sx = (x - W / 2) / (W * 0.55);
    const sy = (y - H / 2) / (H * 0.7);
    const fall = 1 - Math.min(1, sx * sx + sy * sy) * 0.6;
    const b = fall * (1 - settle * 0.35) + g * 0.8;
    const bucket = Math.max(0, Math.min(BUCKETS - 1, Math.floor(b * BUCKETS)));
    neutral[bucket].push(circle(x, y, r));
  }

  const cam = interpolate(t, [0, PAN_AT + PAN_DUR + 40], [1.04, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const wordLeft = markLeft + px + markW + gap;
  const baseline = markTop + markH;
  const letters = word.split("");

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 60% at 50% 46%, ${pal.light}, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${cam})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {neutral.map((segs, i) =>
            segs.length ? (
              <path
                key={`n${i}`}
                d={segs.join("")}
                fill={pal.dot}
                opacity={pal.dotAlpha * (0.3 + (i / (BUCKETS - 1)) * 0.7)}
              />
            ) : null,
          )}
          {lit.map((segs, i) =>
            segs.length ? (
              <path key={`a${i}`} d={segs.join("")} fill={LITC[i]} />
            ) : null,
          )}
        </svg>
        {word ? (
          <div
            style={{
              position: "absolute",
              left: wordLeft,
              top: baseline - fontSize * BASELINE,
              display: "flex",
              fontFamily: manrope,
              fontWeight: weight,
              fontSize,
              lineHeight: 1,
              letterSpacing: `${tracking}em`,
              color: pal.fg,
              whiteSpace: "pre",
            }}
          >
            {letters.map((ch, i) => {
              const k = interpolate(t - WORD_AT - i * 2.5, [0, 16], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              return (
                <span
                  key={`${uid}-${i}`}
                  style={{
                    display: "inline-block",
                    opacity: k,
                    transform: `translateX(${(1 - k) * 22 * u}px)`,
                    filter: `blur(${(1 - k) * 6 * u}px)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ) : null}
      </AbsoluteFill>
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: pal.grain,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <filter id={`${uid}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={9}
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${uid}-grain)`} />
      </svg>
    </AbsoluteFill>
  );
}
