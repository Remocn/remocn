"use client";

import { loadFont } from "@remotion/google-fonts/Manrope";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: MANROPE } = loadFont("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

/**
 * Beat sheet (30fps, speed 1):
 * 0–48     a round 25×25 LED matrix counts down 3-2-1; each numeral swaps in
 *          with a top-to-bottom row refresh.
 * 48–76    the 1 steps down in brightness while a progress arc sweeps the rim,
 *          its head lit in the accent. Complete ring flashes to full.
 * 80–104   the ring pixels hop cell by cell into a pixel version of the real
 *          remocn R; the accent head lands as the R's leg.
 * 104–126  the matrix shrinks and eases left; the unlit dots fade out so the
 *          pixel R becomes the R of the logo.
 * 128–143  "emocn" types in beside it (Manrope 600, as on remocn.dev), accent
 *          caret blinks out.
 * 143–180  hold on the lockup.
 * Lit dots and the typed word share one gradients.sh fill ("limb" on dark,
 * "pixel-glass" on light) that turns from the disc into the lockup.
 */

export interface GlyphMatrixProps {
  /**
   * Word typed in beside the pixel R at the end. "remocn" (any case) types
   * "emocn" so the lockup reads as the real logo.
   */
  label?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const N = 25;
const C = 12;
const R_MASK = 12.55;
const RING_IN = 10.4;
const HEAD = 0.22;
const TAU = Math.PI * 2;

const L1 = 0.3;
const L2 = 0.6;
const L3 = 1;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    off: "#FFFFFF",
    offAlpha: 0.085,
    // gradients.sh "limb" (#4b2bd6, #8a8bff, #e9ecff), deep end lifted a
    // step so the dimmest LED level still reads on black.
    fill: ["#5B5BF5", "#8A8BFF", "#E9ECFF"],
  },
  light: {
    bg: "#F5F4F0",
    off: "#141416",
    offAlpha: 0.075,
    // gradients.sh "pixel-glass".
    fill: ["#3D6BFF", "#7A3CFF", "#FF4FB8"],
  },
} as const;

const NUMERALS: Record<string, string[]> = {
  "3": [
    ".#########.",
    "###########",
    "###########",
    "###.....###",
    "........###",
    "........###",
    "........###",
    "....######.",
    "....#######",
    "....######.",
    "........###",
    "........###",
    "........###",
    "###.....###",
    "###########",
    "###########",
    ".#########.",
  ],
  "2": [
    ".#########.",
    "###########",
    "###########",
    "###.....###",
    "........###",
    "........###",
    ".......####",
    ".....#####.",
    "...######..",
    "..#####....",
    ".####......",
    "####.......",
    "###........",
    "###........",
    "###########",
    "###########",
    "###########",
  ],
  "1": [
    "....####...",
    "..######...",
    ".#######...",
    ".##..###...",
    ".....###...",
    ".....###...",
    ".....###...",
    ".....###...",
    ".....###...",
    ".....###...",
    ".....###...",
    ".....###...",
    ".....###...",
    ".....###...",
    "..#########",
    "..#########",
    "..#########",
  ],
};

/**
 * The real remocn R, rasterised to the LED grid (14×15, strokes two cells
 * wide). "o" cells are the leg, where the accent head of the arc lands.
 */
const MARK = [
  "###########...",
  ".###########..",
  "..........###.",
  "...........##.",
  "...........###",
  "...........###",
  "...........##.",
  "......#######.",
  "..##########..",
  ".#########....",
  "###....ooo....",
  "##......oo....",
  "##......ooo...",
  "##.......ooo..",
  "##........ooo.",
];
const MARK_COLS = 14;
const MARK_ROWS = 15;
const MARK_COL = C - 7;
const MARK_ROW = C - 7;
/** As on remocn.dev: the R is 0.76em tall and sits 0.04em before "emocn". */
const R_EM = 0.76;
const LOGO_GAP = 0.04;

/** Manrope 500 advance widths (1/1000 em) for ASCII 32–126. */
const ADV = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
/** The logo word "emocn": Manrope 600 advances and kerning (em). */
const LOGO_ADV: Record<string, number> = {
  e: 0.596,
  m: 0.882,
  o: 0.61,
  c: 0.568,
  n: 0.615,
};
const LOGO_KERN: Record<string, number> = { em: -0.015, mo: -0.006 };

interface TypeSet {
  chars: string[];
  /** Pen x of each glyph and its advance, in em. */
  xs: number[];
  advs: number[];
  width: number;
  weight: number;
  logo: boolean;
}

function typeset(label: string): TypeSet {
  const logo = label.trim().toLowerCase() === "remocn";
  const chars = Array.from(logo ? "emocn" : label);
  const track = logo ? -0.025 : -0.03;
  const xs: number[] = [];
  const advs: number[] = [];
  let pen = 0;
  chars.forEach((ch, i) => {
    if (logo && i > 0) pen += LOGO_KERN[chars[i - 1] + ch] ?? 0;
    const code = ch.charCodeAt(0);
    const a = logo
      ? (LOGO_ADV[ch] ?? 0.6)
      : (code >= 32 && code <= 126 ? ADV[code - 32] : 600) / 1000;
    xs.push(pen);
    advs.push(a);
    pen += a + (i < chars.length - 1 ? track : 0);
  });
  return { chars, xs, advs, width: pen, weight: logo ? 600 : 500, logo };
}

interface Cell {
  i: number;
  j: number;
}

const inMask = (i: number, j: number) =>
  (i - C) * (i - C) + (j - C) * (j - C) <= R_MASK * R_MASK;
const angleOf = (i: number, j: number) => {
  const a = Math.atan2(i - C, -(j - C));
  return a < 0 ? a + TAU : a;
};

function bitmapCells(rows: string[], ch = "#"): Cell[] {
  const w = rows[0].length;
  const h = rows.length;
  const c0 = C - Math.floor(w / 2);
  const r0 = C - Math.floor(h / 2);
  const out: Cell[] = [];
  rows.forEach((row, r) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === ch) out.push({ i: c0 + x, j: r0 + r });
    }
  });
  return out;
}

function markCells(ch: string): Cell[] {
  const out: Cell[] = [];
  MARK.forEach((row, r) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === ch) out.push({ i: MARK_COL + x, j: MARK_ROW + r });
    }
  });
  return out;
}

interface Hop {
  from: Cell;
  to: Cell;
  delay: number;
  accent: boolean;
}

function pairUp(src: Cell[], tgt: Cell[], accent: boolean, d0: number) {
  const byAngle = (a: Cell, b: Cell) => angleOf(a.i, a.j) - angleOf(b.i, b.j);
  const s = [...src].sort(byAngle);
  const t = [...tgt].sort(byAngle);
  const n = Math.max(s.length, t.length);
  const out: Hop[] = [];
  for (let k = 0; k < n; k++) {
    out.push({
      from: s[Math.floor((k * s.length) / n)],
      to: t[Math.floor((k * t.length) / n)],
      delay: d0 + (k / n) * 10,
      accent,
    });
  }
  return out;
}

function buildModel() {
  const all: Cell[] = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) if (inMask(i, j)) all.push({ i, j });
  }
  const ring = all.filter((c) => {
    const d = Math.hypot(c.i - C, c.j - C);
    return d >= RING_IN;
  });
  const ringBody = ring.filter((c) => angleOf(c.i, c.j) < TAU - HEAD);
  const ringHead = ring.filter((c) => angleOf(c.i, c.j) >= TAU - HEAD);
  const hops = [
    ...pairUp(ringBody, markCells("#"), false, 0),
    ...pairUp(ringHead, markCells("o"), true, 3),
  ];
  return {
    all,
    ring,
    numerals: {
      "3": bitmapCells(NUMERALS["3"]),
      "2": bitmapCells(NUMERALS["2"]),
      "1": bitmapCells(NUMERALS["1"]),
    } as Record<string, Cell[]>,
    hops,
  };
}

// Timeline (frames at speed 1).
const NUM_STEP = 16;
const ROW_STEP = 0.45;
const ARC_START = 48;
const ARC_LEN = 26;
const HOP_START = 80;
const HOP_LEN = 13;
const MOVE_START = 104;
const MOVE_LEN = 22;
const TYPE_START = 128;
const TYPE_STEP = 2.5;

type Lit = Map<number, { b: number; accent: boolean }>;

function light(lit: Lit, c: Cell, b: number, accent = false) {
  if (!inMask(c.i, c.j)) return;
  const key = c.j * N + c.i;
  const prev = lit.get(key);
  if (prev?.accent && !accent) return;
  lit.set(key, { b: accent ? b : Math.max(prev?.b ?? 0, b), accent });
}

function numeralSwap(
  lit: Lit,
  prev: Cell[] | null,
  next: Cell[],
  t: number,
  start: number,
) {
  // Rows of the matrix refresh top to bottom; the row being written shows
  // at mid brightness for one step.
  const front = (t - start) / ROW_STEP;
  const r0 = C - 8;
  for (const c of next) {
    const row = c.j - r0;
    if (row < front - 1) light(lit, c, L3);
    else if (row < front) light(lit, c, L2);
  }
  if (prev) {
    for (const c of prev) {
      const row = c.j - r0;
      if (row >= front) light(lit, c, L3);
    }
  }
}

export function GlyphMatrix({
  label = "remocn",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: GlyphMatrixProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const pal = THEMES[theme];
  const model = useMemo(buildModel, []);

  const lit: Lit = new Map();
  const nums = model.numerals;

  // 1. Countdown.
  if (t < NUM_STEP) numeralSwap(lit, null, nums["3"], t, 0);
  else if (t < NUM_STEP * 2)
    numeralSwap(lit, nums["3"], nums["2"], t, NUM_STEP);
  else if (t < ARC_START)
    numeralSwap(lit, nums["2"], nums["1"], t, NUM_STEP * 2);
  else {
    // The 1 steps down through the brightness levels as the arc runs.
    const k = Math.floor((t - ARC_START) / 6);
    const b = [L3, L2, L1][k];
    if (b !== undefined) for (const c of nums["1"]) light(lit, c, b);
  }

  // 2. Progress arc around the rim.
  if (t >= ARC_START && t < HOP_START + 1) {
    const p = INOUT(
      interpolate(t, [ARC_START, ARC_START + ARC_LEN], [0, 1], CLAMP),
    );
    const sweep = p * TAU;
    const done = t >= ARC_START + ARC_LEN;
    for (const c of model.ring) {
      const a = angleOf(c.i, c.j);
      if (a >= sweep) continue;
      const gap = sweep - a;
      if (gap < HEAD) light(lit, c, L3, true);
      else if (done) light(lit, c, L3);
      else if (gap < HEAD * 2.2) light(lit, c, L3);
      else light(lit, c, L2);
    }
  }

  // 3. Ring pixels hop into the R on the grid. The accent head flies in
  // accent and joins the gradient once it lands.
  if (t >= HOP_START + 1) {
    for (const h of model.hops) {
      const local = (t - HOP_START - h.delay) / HOP_LEN;
      const p = INOUT(Math.min(1, Math.max(0, local)));
      const i = Math.round(h.from.i + (h.to.i - h.from.i) * p);
      const j = Math.round(h.from.j + (h.to.j - h.from.j) * p);
      const landed = local >= 1;
      light(
        lit,
        { i, j },
        landed || local <= 0 ? L3 : h.accent ? L3 : L2,
        h.accent && !landed,
      );
    }
  }

  // Lockup: the pixel R is the logo's R (0.76em tall), the word follows it.
  const type = useMemo(() => typeset(label), [label]);
  const gapEm = type.logo ? LOGO_GAP : 0.16;
  const markEm = (R_EM * MARK_COLS) / MARK_ROWS;
  const fontSize = Math.min(
    (W * 0.62) / (markEm + gapEm + type.width),
    (H * 0.3) / R_EM,
  );
  const p1 = (R_EM * fontSize) / MARK_ROWS;
  const lockW = (markEm + gapEm + type.width) * fontSize;
  const markLeft = (W - lockW) / 2;
  const markTop = H / 2 - (R_EM * fontSize) / 2;
  const baseline = markTop + R_EM * fontSize;
  const lx = markLeft + (markEm + gapEm) * fontSize;

  const D0 = Math.min(H * 0.74, W * 0.5);
  const D1 = N * p1;
  const cx1 = markLeft - MARK_COL * p1 + D1 / 2;
  const cy1 = markTop - MARK_ROW * p1 + D1 / 2;
  const mv = INOUT(
    interpolate(t, [MOVE_START, MOVE_START + MOVE_LEN], [0, 1], CLAMP),
  );
  const D = D0 + (D1 - D0) * mv;
  const cx = W / 2 + (cx1 - W / 2) * mv;
  const cy = H / 2 + (cy1 - H / 2) * mv;
  const pitch = D / N;
  const ox = cx - D / 2;
  const oy = cy - D / 2;
  // LEDs swell as the disc shrinks so the R holds the weight of the type.
  const rOn = pitch * (0.4 + 0.07 * mv);

  const circle = (c: Cell, r: number) => {
    const x = ox + (c.i + 0.5) * pitch;
    const y = oy + (c.j + 0.5) * pitch;
    return `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`;
  };

  // Unlit LEDs go dark as the disc shrinks, leaving only the R.
  const offAlpha = pal.offAlpha * (1 - mv);
  const offPath = offAlpha > 0.001 ? model.all.map((c) => circle(c, rOn)) : [];
  const levels = [L1, L2, L3];
  const inkPaths = levels.map(() => [] as string[]);
  const accentPaths: string[] = [];
  for (const [key, v] of lit) {
    const c = { i: key % N, j: Math.floor(key / N) };
    if (v.accent) accentPaths.push(circle(c, rOn));
    else inkPaths[levels.indexOf(v.b)]?.push(circle(c, rOn));
  }

  // One fill for every lit LED and the typed word: a diagonal across the
  // disc that turns into a left-to-right sweep across the lockup.
  const g0 = { x1: ox, y1: oy + D, x2: ox + D, y2: oy };
  const g1 = {
    x1: markLeft,
    y1: baseline,
    x2: markLeft + lockW,
    y2: markTop,
  };
  const mix = (a: number, b: number) => a + (b - a) * mv;
  const gradId = `gm${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Label: typed character by character, caret in the accent.
  const { chars, xs, advs } = type;
  const typed = Math.max(
    0,
    Math.min(chars.length, Math.floor((t - TYPE_START) / TYPE_STEP) + 1),
  );
  const typeEnd = TYPE_START + chars.length * TYPE_STEP;
  const caretX =
    lx + (typed > 0 ? (xs[typed - 1] + advs[typed - 1]) * fontSize : 0);
  const caretOn =
    t >= MOVE_START + MOVE_LEN &&
    (t < typeEnd + 2 ||
      (t < typeEnd + 34 && Math.floor((t - typeEnd) / 8) % 2 === 1));

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
            x1={mix(g0.x1, g1.x1)}
            y1={mix(g0.y1, g1.y1)}
            x2={mix(g0.x2, g1.x2)}
            y2={mix(g0.y2, g1.y2)}
          >
            {pal.fill.map((col, k) => (
              <stop
                key={col}
                offset={k / (pal.fill.length - 1)}
                stopColor={col}
              />
            ))}
          </linearGradient>
        </defs>
        {offPath.length ? (
          <path d={offPath.join("")} fill={pal.off} fillOpacity={offAlpha} />
        ) : null}
        {inkPaths.map((segs, k) =>
          segs.length ? (
            <path
              key={levels[k]}
              d={segs.join("")}
              fill={`url(#${gradId})`}
              fillOpacity={levels[k]}
            />
          ) : null,
        )}
        {accentPaths.length ? (
          <path d={accentPaths.join("")} fill={accent} />
        ) : null}
        {chars.slice(0, typed).map((ch, k) => (
          <text
            key={k}
            x={lx + xs[k] * fontSize}
            y={baseline}
            fill={`url(#${gradId})`}
            fontFamily={MANROPE}
            fontWeight={type.weight}
            fontSize={fontSize}
            style={{ fontKerning: "none" }}
          >
            {ch}
          </text>
        ))}
        {caretOn ? (
          <rect
            x={caretX + fontSize * 0.05}
            y={baseline - fontSize * 0.74}
            width={Math.max(2, fontSize * 0.04)}
            height={fontSize * 0.86}
            fill={accent}
          />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
}
