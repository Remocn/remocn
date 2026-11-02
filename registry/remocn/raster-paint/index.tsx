"use client";

import { loadFont } from "@remotion/google-fonts/GeistMono";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: mono } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface RasterPaintProps {
  title?: string;
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const SCAN = Easing.bezier(0.45, 0, 0.55, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#9A999F",
    slot: "rgba(255,255,255,0.035)",
    light: "rgba(255,255,255,0.045)",
    band: 0.16,
    // gradients.sh "halo", top-left to bottom-right through the bitmap
    halo: ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    slot: "rgba(18,18,20,0.04)",
    light: "rgba(255,255,255,0.75)",
    band: 0.12,
    halo: ["#f59a52", "#e2457a", "#3d4dff", "#2b2f9e"],
    grain: 0.045,
  },
} as const;

const LINE_IN = 2;
const SCAN_AT = 10;
const SCAN_DUR = 58;
const SWEEP = 4;
const TRAIL = 12;
const LABEL_AT = SCAN_AT + SCAN_DUR + 6;

const GLYPHS: Record<string, string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#", ".##", "#.#", "..#", "..#", "..#", "..#"],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ".": ["..", "..", "..", "..", "..", "##", "##"],
  ",": ["..", "..", "..", "..", "##", ".#", "#."],
  "%": ["##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "-": [".....", ".....", ".....", "####.", ".....", ".....", "....."],
  "!": ["#", "#", "#", "#", "#", ".", "#"],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
};

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function rasterize(text: string) {
  const rows: string[] = Array.from({ length: 7 }, () => "");
  const chars = text.split("");
  chars.forEach((ch, i) => {
    const g = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()] ?? GLYPHS[" "];
    for (let r = 0; r < 7; r++)
      rows[r] += g[r] + (i < chars.length - 1 ? "." : "");
  });
  return rows.map((row) => row.split("").map((c) => (c === "#" ? 1 : 0)));
}

function scale2x(src: number[][]) {
  const h = src.length;
  const w = src[0]?.length ?? 0;
  const at = (r: number, c: number) =>
    r < 0 || c < 0 || r >= h || c >= w ? 0 : src[r][c];
  const out: number[][] = Array.from({ length: h * 2 }, () =>
    new Array(w * 2).fill(0),
  );
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const p = src[r][c];
      const a = at(r - 1, c);
      const b = at(r, c + 1);
      const cc = at(r, c - 1);
      const d = at(r + 1, c);
      out[r * 2][c * 2] = cc === a && cc !== d && a !== b ? a : p;
      out[r * 2][c * 2 + 1] = a === b && a !== cc && b !== d ? b : p;
      out[r * 2 + 1][c * 2] = d === cc && d !== b && cc !== a ? cc : p;
      out[r * 2 + 1][c * 2 + 1] = b === d && b !== a && d !== cc ? d : p;
    }
  }
  return out;
}

function parseHex(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toLin = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (v: number) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

function toOklab([r8, g8, b8]: number[]) {
  const r = toLin(r8);
  const g = toLin(g8);
  const b = toLin(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, A, B]: number[]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Perceptual (OKLab) mix, so warm-to-blue transitions stay vivid. */
function mix(a: number[], b: number[], k: number) {
  const la = toOklab(a);
  const lb = toOklab(b);
  return fromOklab(la.map((v, i) => v + (lb[i] - v) * k));
}

const css = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

function ramp(stops: number[][], k: number) {
  const x = Math.min(1, Math.max(0, k)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

export function RasterPaint({
  title = "10x",
  label = "Faster renders in remocn 2.0",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RasterPaintProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pal = THEMES[theme];

  const bitmap = useMemo(() => scale2x(rasterize(title)), [title]);
  const rows = bitmap.length;
  const cols = bitmap[0]?.length ?? 1;

  const p = Math.min((H * 0.44) / rows, (W * 0.76) / cols);
  const sq = p * 0.86;
  const blockW = cols * p;
  const blockH = rows * p;
  const labelSize = 28 * u;
  const labelGap = label ? 44 * u : 0;
  const groupH = blockH + (label ? labelGap + labelSize * 1.2 : 0);
  const left = W / 2 - blockW / 2;
  const top = H / 2 - groupH / 2;

  const accRgb = parseHex(accent) ?? [59, 91, 253];
  const hotRgb = accRgb.map((v) => v + (255 - v) * 0.35);
  const haloRgb = pal.halo.map((c) => parseHex(c) ?? accRgb);
  const drift = interpolate(t, [0, 120], [-0.06, 0.06], CLAMP);

  const scanK = interpolate(t, [SCAN_AT, SCAN_AT + SCAN_DUR], [0, 1], CLAMP);
  const headRow = -1.5 + SCAN(scanK) * (rows + 3);
  const headY = top + headRow * p;
  const rowTime = (r: number) => {
    const target = (r + 0.5 + 1.5) / (rows + 3);
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (SCAN(mid) < target) lo = mid;
      else hi = mid;
    }
    return SCAN_AT + lo * SCAN_DUR + 1 + hash(r * 3.17) * 2.4;
  };

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const tr = rowTime(r);
    if (t < tr) continue;
    const y = top + r * p + (p - sq) / 2;
    for (let c = 0; c < cols; c++) {
      if (!bitmap[r][c]) continue;
      const tp = tr + (c / cols) * SWEEP;
      const age = t - tp;
      if (age < 0) continue;
      const on = EASE_OUT(interpolate(age, [0, 3], [0, 1], CLAMP));
      const cool = EASE_OUT(interpolate(age, [1, TRAIL], [0, 1], CLAMP));
      const settled = ramp(
        haloRgb,
        (r / rows) * 0.72 + (c / cols) * 0.28 + drift,
      );
      const fill = css(
        cool < 0.5
          ? mix(hotRgb, accRgb, cool * 2)
          : mix(accRgb, settled, (cool - 0.5) * 2),
      );
      const s = sq * (0.82 + 0.18 * on);
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={left + c * p + (p - s) / 2}
          y={y + (sq - s) / 2}
          width={s}
          height={s}
          fill={fill}
          opacity={on}
        />,
      );
    }
  }

  const over = 40 * u;
  const lineIn = EASE_OUT(
    interpolate(t, [LINE_IN, SCAN_AT + 4], [0, 1], CLAMP),
  );
  const lineOut = interpolate(
    t,
    [SCAN_AT + SCAN_DUR - 6, SCAN_AT + SCAN_DUR + 2],
    [1, 0],
    CLAMP,
  );
  const lineAlpha = lineOut;
  const halfLen = (blockW / 2 + over) * lineIn;
  const bandH = p * 7;
  const labelK = EASE_OUT(
    interpolate(t, [LABEL_AT, LABEL_AT + 16], [0, 1], CLAMP),
  );
  const cam = interpolate(t, [0, LABEL_AT + 30], [1.03, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const tick = 6 * u;

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
          <defs>
            <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={accent} stopOpacity={0} />
              <stop offset="1" stopColor={accent} stopOpacity={pal.band} />
            </linearGradient>
          </defs>
          <g opacity={lineIn * lineOut}>
            {Array.from({ length: cols }, (_, c) => (
              <rect
                key={`s${c}`}
                x={left + c * p + (p - sq) / 2}
                y={headY + (p - sq) / 2 - p * 0.5}
                width={sq}
                height={sq}
                fill={pal.slot}
              />
            ))}
          </g>
          {rects}
          <g opacity={lineAlpha}>
            <rect
              x={W / 2 - halfLen}
              y={headY - bandH}
              width={halfLen * 2}
              height={bandH}
              fill={`url(#${uid}-band)`}
            />
            <rect
              x={W / 2 - halfLen}
              y={headY - 1.25 * u}
              width={halfLen * 2}
              height={2.5 * u}
              fill={accent}
            />
            <rect
              x={W / 2 - halfLen}
              y={headY - tick}
              width={2.5 * u}
              height={tick * 2}
              fill={accent}
              opacity={lineIn}
            />
            <rect
              x={W / 2 + halfLen - 2.5 * u}
              y={headY - tick}
              width={2.5 * u}
              height={tick * 2}
              fill={accent}
              opacity={lineIn}
            />
          </g>
        </svg>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: top + blockH + labelGap,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14 * u,
              opacity: labelK,
              transform: `translateY(${(1 - labelK) * 10 * u}px)`,
            }}
          >
            <div
              style={{
                width: 11 * u,
                height: 11 * u,
                background: accent,
              }}
            />
            <div
              style={{
                fontFamily: mono,
                fontWeight: 400,
                fontSize: labelSize,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: pal.muted,
              }}
            >
              {label}
            </div>
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
            seed={21}
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${uid}-grain)`} />
      </svg>
    </AbsoluteFill>
  );
}
