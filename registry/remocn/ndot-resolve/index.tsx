"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const geist = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const WEIGHT = 500;

/**
 * Beat sheet (30fps, speed 1):
 * 0–20     the headline scans in row by row in a round-dot matrix face, like
 *          an LED panel refreshing top to bottom.
 * 20–34    hold on the dot headline.
 * 34–83    left to right (2.2f stagger), a hard refresh line runs down each
 *          glyph in 5 frames: solid Geist 500 above it, dot face below it.
 *          The emphasis word refreshes into a gradients.sh fill ("halo" on
 *          dark, "pixel-glass" on light, ending in the accent) and stays dots.
 * 83–135   hold; one quiet refresh pass runs over the emphasis word while its
 *          gradient drifts a few percent.
 */

export interface NdotResolveProps {
  /** Headline. Use "\n" to force line breaks; otherwise it is balanced. */
  text?: string;
  /** Word that stays in dots, in the gradient. Empty string = none. */
  emphasis?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0A0A0B", ink: "#F3F2EF", hot: ["#FFB36B", "#E2457A"] },
  light: { bg: "#F5F4F0", ink: "#141416", hot: ["#7A3CFF", "#FF4FB8"] },
} as const;

const TRACK = -0.032;

type Measure = (s: string) => number;

/** Waits for Geist, then measures with a canvas (em, kerning included). */
function useMeasurer() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("ndot-resolve: measuring"));
  const released = useRef(false);
  const font = `${WEIGHT} 100px "${geist.fontFamily}"`;

  useEffect(() => {
    let live = true;
    Promise.all([geist.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [font, handle]);

  const ctx = useMemo(
    () => (ready ? document.createElement("canvas").getContext("2d") : null),
    [ready],
  );
  const measure = useCallback(
    (s: string) => {
      if (!ctx) return s.length * 0.55;
      ctx.font = font;
      return ctx.measureText(s).width / 100;
    },
    [ctx, font],
  );
  const cap = useMemo(() => {
    if (!ctx) return 0.71;
    ctx.font = font;
    return ctx.measureText("H").actualBoundingBoxAscent / 100;
  }, [ctx, font]);
  return useMemo(
    () => (ready ? { measure, cap } : null),
    [ready, measure, cap],
  );
}

/**
 * Round-dot face on a 7-row cap grid (row 6 sits on the baseline, rows 7–8 are
 * descenders). Dot glyphs are centred in each Geist glyph's advance, so the
 * dot line and the solid line share one set of measured metrics.
 */
const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["####", "#...", "#...", "###.", "#...", "#...", "####"],
  F: ["####", "#...", "#...", "###.", "#...", "#...", "#..."],
  G: [".####", "#....", "#....", "#..##", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#", "#", "#", "#", "#", "#", "#"],
  J: ["...#", "...#", "...#", "...#", "...#", "#..#", ".##."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#...", "#...", "#...", "#...", "#...", "#...", "####"],
  M: [
    "#.....#",
    "##...##",
    "#.#.#.#",
    "#..#..#",
    "#.....#",
    "#.....#",
    "#.....#",
  ],
  N: ["#....#", "##...#", "#.#..#", "#..#.#", "#...##", "#....#", "#....#"],
  O: [".####.", "#....#", "#....#", "#....#", "#....#", "#....#", ".####."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".####.", "#....#", "#....#", "#....#", "#..#.#", "#...#.", ".###.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#....#", "#....#", "#....#", "#....#", "#....#", "#....#", ".####."],
  V: ["#...#", "#...#", "#...#", "#...#", ".#.#.", ".#.#.", "..#.."],
  W: [
    "#.....#",
    "#.....#",
    "#.....#",
    "#..#..#",
    "#.#.#.#",
    "##...##",
    "#.....#",
  ],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  a: [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
  b: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
  c: ["....", "....", ".###", "#...", "#...", "#...", ".###"],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".####"],
  f: ["..##", ".#..", "###.", ".#..", ".#..", ".#..", ".#.."],
  g: [
    ".....",
    ".....",
    ".####",
    "#...#",
    "#...#",
    "#...#",
    ".####",
    "....#",
    ".###.",
  ],
  h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
  i: ["#", ".", "#", "#", "#", "#", "#"],
  j: ["..#", "...", "..#", "..#", "..#", "..#", "..#", "..#", "##."],
  k: ["#...", "#...", "#..#", "#.#.", "##..", "#.#.", "#..#"],
  l: ["#", "#", "#", "#", "#", "#", "#"],
  m: [
    ".......",
    ".......",
    "###.##.",
    "#..#..#",
    "#..#..#",
    "#..#..#",
    "#..#..#",
  ],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  p: [
    ".....",
    ".....",
    "####.",
    "#...#",
    "#...#",
    "#...#",
    "####.",
    "#....",
    "#....",
  ],
  q: [
    ".....",
    ".....",
    ".####",
    "#...#",
    "#...#",
    "#...#",
    ".####",
    "....#",
    "....#",
  ],
  r: ["...", "...", "#.#", "##.", "#..", "#..", "#.."],
  s: ["....", "....", ".###", "#...", ".##.", "...#", "###."],
  t: ["...", ".#.", "###", ".#.", ".#.", ".#.", "..#"],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#...#", ".####"],
  v: [".....", ".....", "#...#", "#...#", ".#.#.", ".#.#.", "..#.."],
  w: [
    ".......",
    ".......",
    "#.....#",
    "#.....#",
    "#..#..#",
    "#.#.#.#",
    ".#...#.",
  ],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  y: [
    ".....",
    ".....",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    ".####",
    "....#",
    ".###.",
  ],
  z: [".....", ".....", "#####", "...#.", "..#..", ".#...", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#", ".##", "#.#", "..#", "..#", "..#", "..#"],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ",": [".", ".", ".", ".", ".", ".", "#", "#"],
  "!": ["#", "#", "#", "#", "#", ".", "#"],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "'": ["#", "#", ".", ".", ".", ".", "."],
  "’": ["#", "#", ".", ".", ".", ".", "."],
  "-": ["...", "...", "...", "###", "...", "...", "..."],
  "–": ["....", "....", "....", "####", "....", "....", "...."],
  ":": [".", ".", "#", ".", ".", ".", "#"],
  "/": ["...#", "...#", "..#.", "..#.", ".#..", ".#..", "#..."],
};

interface Glyph {
  ch: string;
  line: number;
  /** Pen x and glyph advance in em, relative to the line start. */
  pen: number;
  adv: number;
  /** Lit cells (col, row) of the dot glyph. */
  cells: [number, number][];
  cols: number;
  emphasis: boolean;
  order: number;
}

function lineWidth(s: string, m: Measure) {
  return m(s) + TRACK * Math.max(0, s.length - 1);
}

function splitLines(text: string, maxEm: number, m: Measure): string[] {
  if (text.includes("\n")) return text.split("\n");
  const widthOf = (s: string) => lineWidth(s, m);
  if (widthOf(text) <= maxEm) return [text];
  const words = text.split(" ");
  let best: string[] = [text];
  let bestScore = Number.POSITIVE_INFINITY;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(" ");
    const b = words.slice(k).join(" ");
    const sentence = /[.!?,:;]$/.test(a) ? 0.75 : 1;
    const score = Math.max(widthOf(a), widthOf(b)) * sentence;
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
}

function layout(text: string, emphasis: string, maxEm: number, m: Measure) {
  const lines = splitLines(text, maxEm, m);
  const target = emphasis.trim().toLowerCase();
  const glyphs: Glyph[] = [];
  let order = 0;
  lines.forEach((line, li) => {
    // Mark which characters belong to the emphasis word (with its punctuation).
    const hot = new Array(line.length).fill(false);
    if (target) {
      const re = /\S+/g;
      let m = re.exec(line);
      while (m) {
        const core = m[0].replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        if (core === target) {
          for (let i = m.index; i < m.index + m[0].length; i++) hot[i] = true;
        }
        m = re.exec(line);
      }
    }
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const a = m(ch);
      // Pen from the measured prefix, so the font's kerning carries through.
      const pen = m(line.slice(0, i)) + TRACK * i;
      const rows = GLYPHS[ch];
      const cells: [number, number][] = [];
      if (rows) {
        rows.forEach((row, r) => {
          for (let c = 0; c < row.length; c++) {
            if (row[c] === "#") cells.push([c, r]);
          }
        });
      }
      glyphs.push({
        ch,
        line: li,
        pen,
        adv: a,
        cells,
        cols: rows ? rows[0].length : 0,
        emphasis: hot[i],
        order: ch === " " ? -1 : order++,
      });
    }
  });
  const widths = lines.map((l) => lineWidth(l, m));
  const descender = glyphs.some((g) => (GLYPHS[g.ch]?.length ?? 0) > 7);
  return { lines, glyphs, widths, count: order, descender };
}

// Timeline (frames at speed 1).
const ROW_STEP = 1.1;
const RES_START = 34;
const STAGGER = 2.2;
const WIPE_LEN = 5;
const WIPE_EASE = Easing.bezier(0.33, 0, 0.2, 1);
const DOT_R = 0.47;

const dotPath = (x: number, y: number, r: number) =>
  `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`;

export function NdotResolve({
  text = "Less noise. More launch.",
  emphasis = "launch",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: NdotResolveProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pal = THEMES[theme];
  const metrics = useMeasurer();

  const maxFs = H * 0.235;
  const laid = useMemo(
    () =>
      metrics
        ? layout(text, emphasis, (W * 0.84) / maxFs, metrics.measure)
        : null,
    [text, emphasis, W, maxFs, metrics],
  );

  if (!metrics || !laid) {
    return (
      <div style={{ position: "absolute", inset: 0, background: pal.bg }} />
    );
  }

  const { glyphs, widths, lines, count, descender } = laid;
  const CAP = metrics.cap;
  const blockEm = Math.max(...widths);
  const fs = Math.min(maxFs, (W * 0.84) / blockEm);
  const p = (CAP * fs) / 7;
  const lead = fs * (descender ? 1.16 : 1.08);
  const blockH = (lines.length - 1) * lead + CAP * fs;
  const left = (W - blockEm * fs) / 2;
  const top = (H - blockH) / 2 + CAP * fs;
  const rowsPerLine = 9;

  const ink2: string[] = [];
  const ink3: string[] = [];
  const hot: string[] = [];
  const hotDim: string[] = [];
  const wiping: ReactNode[] = [];
  const solid: ReactNode[] = [];
  const resEnd = RES_START + (count - 1) * STAGGER + WIPE_LEN;
  // Extent of the emphasis word, for its gradient.
  let hotX0 = Number.POSITIVE_INFINITY;
  let hotX1 = Number.NEGATIVE_INFINITY;
  let hotY = top;

  for (const g of glyphs) {
    if (g.order < 0) continue;
    const baseline = top + g.line * lead;
    const penX = left + g.pen * fs;
    const inkLeft = penX + (g.adv * fs - g.cols * p) / 2;
    const cx = (c: number) => inkLeft + (c + 0.5) * p;
    const cy = (r: number) => baseline - (6.5 - r) * p;
    const start = RES_START + g.order * STAGGER;

    if (g.emphasis) {
      hotX0 = Math.min(hotX0, inkLeft);
      hotX1 = Math.max(hotX1, inkLeft + g.cols * p);
      hotY = baseline;
      for (const [c, r] of g.cells) {
        const tr = (g.line * rowsPerLine + r) * ROW_STEP;
        if (t < tr) continue;
        // Refresh into the gradient, row by row, one dark step per row.
        const sw = start + r * 0.6;
        if (t >= sw && t < sw + 1) continue;
        // A quiet refresh pass over the emphasis word during the hold.
        const pass = resEnd + 12 + r * 0.9;
        const d = dotPath(cx(c), cy(r), DOT_R * p);
        if (t >= sw + 1) {
          if (t >= pass && t < pass + 1.5) hotDim.push(d);
          else hot.push(d);
        } else if (t < tr + 1) ink2.push(d);
        else ink3.push(d);
      }
      continue;
    }

    // A hard line refreshes each glyph top to bottom: solid Geist above it,
    // the dot face below it. One system per region, never two overlapping.
    const lf = t - start;
    const yTop = baseline - fs * 0.8;
    const yBot = baseline + fs * 0.26;
    const wipeY =
      lf <= 0
        ? yTop
        : yTop + (yBot - yTop) * WIPE_EASE(Math.min(1, lf / WIPE_LEN));

    if (lf < WIPE_LEN) {
      for (const [c, row] of g.cells) {
        const tr = (g.line * rowsPerLine + row) * ROW_STEP;
        if (t < tr) continue;
        if (lf > 0 && cy(row) < wipeY) continue;
        const d = dotPath(cx(c), cy(row), DOT_R * p);
        if (t < tr + 1) ink2.push(d);
        else ink3.push(d);
      }
    }
    if (lf <= 0) continue;

    const glyphText = (extra: Record<string, string | number>) => (
      <text
        key={`t${g.order}-${g.line}`}
        x={penX}
        y={baseline}
        fill={pal.ink}
        fontFamily={geist.fontFamily}
        fontWeight={WEIGHT}
        fontSize={fs}
        style={{ fontKerning: "none" }}
        {...extra}
      >
        {g.ch}
      </text>
    );

    if (lf >= WIPE_LEN) {
      solid.push(glyphText({}));
      continue;
    }
    const id = `${uid}-c${g.line}-${g.order}`;
    wiping.push(
      <g key={id}>
        <clipPath id={id}>
          <rect
            x={penX - fs * 0.2}
            y={yTop - fs * 0.2}
            width={g.adv * fs + fs * 0.4}
            height={wipeY - yTop + fs * 0.2}
          />
        </clipPath>
        {glyphText({ clipPath: `url(#${id})` })}
      </g>,
    );
  }

  // The emphasis fill sweeps left to right and drifts a few percent.
  const hotW = Math.max(1, hotX1 - hotX0);
  const sway = Math.sin(t / 34) * 0.06 * hotW;
  const gradId = `${uid}-hot`;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={hotX0 - 0.08 * hotW + sway}
            y1={hotY - CAP * fs * 0.6}
            x2={hotX1 + 0.04 * hotW + sway}
            y2={hotY + CAP * fs * 0.1}
          >
            <stop offset={0} stopColor={pal.hot[0]} />
            <stop offset={0.5} stopColor={pal.hot[1]} />
            <stop offset={1} stopColor={accent} />
          </linearGradient>
        </defs>
        {ink2.length ? (
          <path d={ink2.join("")} fill={pal.ink} fillOpacity={0.45} />
        ) : null}
        {ink3.length ? <path d={ink3.join("")} fill={pal.ink} /> : null}
        {wiping}
        {solid}
        {hot.length ? <path d={hot.join("")} fill={`url(#${gradId})`} /> : null}
        {hotDim.length ? (
          <path
            d={hotDim.join("")}
            fill={`url(#${gradId})`}
            fillOpacity={0.45}
          />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
}
