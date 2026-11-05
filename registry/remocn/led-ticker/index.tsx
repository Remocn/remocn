"use client";

import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface LedTickerProps {
  text?: string;
  highlightWord?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const SCROLL = Easing.bezier(0.2, 0.7, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F3F2EF",
    off: "#FFFFFF",
    offAlpha: 0.075,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#141416",
    off: "#141416",
    offAlpha: 0.075,
    grain: 0.04,
  },
} as const;

const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
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
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ",": ["..", "..", "..", "..", "..", ".#", "#."],
  "!": ["#", "#", "#", "#", "#", ".", "#"],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "-": ["....", "....", "....", "####", "....", "....", "...."],
  ":": [".", ".", "#", ".", ".", "#", "."],
  "'": ["#", "#", ".", ".", ".", ".", "."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "%": ["##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
};

// The remocn.dev "R" mark on the 7-row grid: top bar with no upper stem,
// the bowl, and the stem + leg below. Replaces the R when the text opens
// with the word "remocn".
const MARK_R = [
  "#####.",
  ".....#",
  ".....#",
  ".####.",
  "#..#..",
  "#...#.",
  "#....#",
];

// gradients.sh "halo" (peach → amber → rose → blue) across the hot word.
const HALO = ["#ffd2ad", "#ffb36b", "#e2457a", "#3d4dff"];
const HOT_STEPS = 9;

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

const ROWS = 7;
const TRAIL = [1, 0.4, 0.16, 0.06];
const BUCKETS = 6;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Cell {
  c: number;
  r: number;
  hot: number;
}

function layout(text: string, highlightWord?: string) {
  const chars = text.toUpperCase().split("");
  const target = highlightWord?.trim().toUpperCase();
  const brand = /^REMOCN(\s|$)/.test(chars.join(""));
  const cells: Cell[] = [];
  let col = 0;
  let wordStart = 0;
  let hotRange: [number, number] | null = null;
  let word = "";
  const closeWord = (end: number) => {
    if (!hotRange && target && word === target) hotRange = [wordStart, end];
    word = "";
  };
  chars.forEach((ch, i) => {
    const g = brand && i === 0 ? MARK_R : (GLYPHS[ch] ?? GLYPHS[" "]);
    if (ch === " ") {
      closeWord(col - 2);
    } else if (word === "") {
      wordStart = col;
      word = ch;
    } else {
      word += ch;
    }
    const gw = g[0].length;
    for (let r = 0; r < ROWS; r++) {
      for (let x = 0; x < gw; x++) {
        if (g[r][x] === "#") cells.push({ c: col + x, r, hot: 0 });
      }
    }
    col += gw + (i < chars.length - 1 ? 1 : 0);
  });
  closeWord(col - 1);
  const range = hotRange as [number, number] | null;
  if (range) {
    for (const cell of cells) {
      if (cell.c >= range[0] && cell.c <= range[1]) {
        cell.hot = cell.c - range[0] + 1;
      }
    }
  }
  return {
    cells,
    width: Math.max(1, col),
    hotWidth: range ? range[1] - range[0] + 1 : 0,
  };
}

const ENTER = 2;
const SCROLL_DUR = 54;
const HOT_START = ENTER + SCROLL_DUR + 14;
const HOT_STEP = 0.8;
const HOT_DUR = 6;

export function LedTicker({
  text = "remocn is live",
  highlightWord = "live",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: LedTickerProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pal = THEMES[theme];

  const {
    cells,
    width: textCols,
    hotWidth,
  } = useMemo(() => layout(text, highlightWord), [text, highlightWord]);

  const pitch = Math.min((W * 0.86) / textCols, H / 13);
  const cols = Math.ceil(W / pitch) + 2;
  const rows = Math.ceil(H / pitch) + 2;
  const x0 = (W - cols * pitch) / 2;
  const y0 = (H - rows * pitch) / 2;
  const home = Math.round((cols - textCols) / 2);
  const band = Math.round((rows - ROWS) / 2);
  const rOff = pitch * 0.3;
  const rOn = pitch * 0.45;

  const offsetAt = (f: number) => {
    const p = interpolate(f, [ENTER, ENTER + SCROLL_DUR], [0, 1], CLAMP);
    return home + Math.round((cols - home) * (1 - SCROLL(p)));
  };

  const lit = new Map<number, { b: number; hot: number }>();
  TRAIL.forEach((w, k) => {
    const f = Math.floor(t) - k;
    if (f < ENTER - 1) return;
    const o = offsetAt(f);
    for (const cell of cells) {
      const c = o + cell.c;
      if (c < 0 || c >= cols) continue;
      const key = (band + cell.r) * cols + c;
      const prev = lit.get(key);
      if (!prev || prev.b < w) lit.set(key, { b: w, hot: cell.hot });
    }
  });

  const cx = W / 2;
  const cy = H / 2;
  const ink: string[][] = Array.from({ length: BUCKETS }, () => []);
  const hot: string[][] = Array.from({ length: BUCKETS * HOT_STEPS }, () => []);
  const hotColors = ramp(
    [HALO[0], HALO[1], HALO[2], accent].slice(theme === "light" ? 1 : 0),
    HOT_STEPS,
  );
  for (const [key, v] of lit) {
    const r = Math.floor(key / cols);
    const c = key % cols;
    const x = x0 + (c + 0.5) * pitch;
    const y = y0 + (r + 0.5) * pitch;
    const nx = (x - cx) / (W * 0.6);
    const ny = (y - cy) / (H * 0.6);
    const falloff = 1 - Math.min(1, nx * nx + ny * ny) * 0.22;
    let b = v.b * falloff * (0.94 + hash(key * 0.37) * 0.06);
    let isHot = false;
    if (v.hot > 0 && v.b === 1) {
      const start = HOT_START + (v.hot - 1) * HOT_STEP;
      const p = (t - start) / HOT_DUR;
      if (p > 0) {
        const dip = p < 0.45 ? 1 - p / 0.45 : Math.min(1, (p - 0.45) / 0.55);
        b *= 0.12 + 0.88 * EASE_IO(dip);
        isHot = p >= 0.45;
      }
    }
    const bucket = Math.min(BUCKETS - 1, Math.floor(b * BUCKETS));
    const rad = rOff + (rOn - rOff) * Math.min(1, b);
    const seg = `M${(x - rad).toFixed(2)} ${y.toFixed(2)}a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(2 * rad).toFixed(2)} 0a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(-2 * rad).toFixed(2)} 0`;
    if (isHot) {
      const k = hotWidth > 1 ? (v.hot - 1) / (hotWidth - 1) : 0;
      const step = Math.round(k * (HOT_STEPS - 1));
      hot[bucket * HOT_STEPS + step].push(seg);
    } else {
      ink[bucket].push(seg);
    }
  }

  const total = HOT_START + hotWidth * HOT_STEP + HOT_DUR + 40;
  const cam = interpolate(t, [0, total], [1.035, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const bucketOpacity = (i: number) => (i + 1) / BUCKETS;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
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
            <pattern
              id={`${uid}-dot`}
              patternUnits="userSpaceOnUse"
              x={x0}
              y={y0}
              width={pitch}
              height={pitch}
            >
              <circle
                cx={pitch / 2}
                cy={pitch / 2}
                r={rOff}
                fill={pal.off}
                fillOpacity={pal.offAlpha}
              />
            </pattern>
            <radialGradient id={`${uid}-fall`} cx="50%" cy="50%" r="62%">
              <stop offset="0%" stopColor="#fff" stopOpacity={1} />
              <stop offset="55%" stopColor="#fff" stopOpacity={0.62} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0.18} />
            </radialGradient>
            <mask id={`${uid}-mask`}>
              <rect width={W} height={H} fill={`url(#${uid}-fall)`} />
            </mask>
          </defs>
          <rect
            width={W}
            height={H}
            fill={`url(#${uid}-dot)`}
            mask={`url(#${uid}-mask)`}
          />
          {ink.map((segs, i) =>
            segs.length ? (
              <path
                key={`i${i}`}
                d={segs.join("")}
                fill={pal.ink}
                opacity={bucketOpacity(i)}
              />
            ) : null,
          )}
          {hot.map((segs, i) =>
            segs.length ? (
              <path
                key={`h${i}`}
                d={segs.join("")}
                fill={hotColors[i % HOT_STEPS]}
                opacity={bucketOpacity(Math.floor(i / HOT_STEPS))}
              />
            ) : null,
          )}
        </svg>
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
            seed={5}
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${uid}-grain)`} />
      </svg>
    </AbsoluteFill>
  );
}
