"use client";

import { loadVariableFont } from "@remotion/google-fonts/Archivo";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  countValues,
  DEFAULT_LABEL,
  type ModuleCountElementId,
  moduleCountTimeline,
} from "./timeline";

const archivo = loadVariableFont("normal", { subsets: ["latin"] });

export interface ModuleCountProps {
  value?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  steps?: number;
  accent?: string;
  /** Text color of the label; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the label. Load it yourself; Archivo by default. */
  fontFamily?: string;
  /** Weight of the label, set on the variable font's wght axis. */
  fontWeight?: number;
  /** Frames between label words as they rise in. */
  stagger?: number;
  /** Size of the figure and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the intro, each step of the count, the grid
   * lock and the label words, by the ids in `./timeline`. Frames on the
   * scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<ModuleCountElementId>;
}

const THEMES = {
  dark: {
    bg: "#0E4D4A",
    ink: "#F4E9D8",
    accent: "#FF6B4A",
    second: "#FFC93C",
    grid: "rgba(244,233,216,0.14)",
  },
  light: {
    bg: "#F4E9D8",
    ink: "#0E4D4A",
    accent: "#FF6B4A",
    second: "#0E4D4A",
    grid: "rgba(14,77,74,0.16)",
  },
} as const;

type Cell = "." | "#" | "a" | "b" | "c" | "d" | "o";

const GLYPHS: Record<string, string[]> = {
  "0": ["a#b", "#.#", "#.#", "#.#", "d#c"],
  "1": ["a#.", ".#.", ".#.", ".#.", "###"],
  "2": ["a#b", "..#", "a#c", "#..", "###"],
  "3": ["a#b", "..#", ".##", "..#", "d#c"],
  "4": ["#.#", "#.#", "d##", "..#", "..#"],
  "5": ["###", "#..", "##b", "..#", "d#c"],
  "6": ["a##", "#..", "##b", "#.#", "d#c"],
  "7": ["###", "..#", ".ac", ".#.", ".#."],
  "8": ["a#b", "#.#", "###", "#.#", "d#c"],
  "9": ["a#b", "#.#", "d##", "..#", "##c"],
  "+": ["...", ".#.", "###", ".#.", "..."],
  "-": ["...", "...", "###", "...", "..."],
  "×": ["...", "#.#", ".#.", "#.#", "..."],
  x: ["...", "#.#", ".#.", "#.#", "..."],
  "%": ["o.#", "..#", ".#.", "#..", "#.o"],
  k: ["#..", "#.a", "##c", "#.b", "#.#"],
  K: ["#..", "#.a", "##c", "#.b", "#.#"],
  M: ["##b##", "#.#.#", "#.#.#", "#...#", "#...#"],
  ".": [".", ".", ".", ".", "o"],
  ",": [".", ".", ".", ".", "c"],
  $: ["a##", "#..", "d#b", "..#", "##c"],
};

const ROWS = 5;
const BLANK3 = ["...", "...", "...", "...", "..."];

const RADII: Record<Cell, [number, number, number, number]> = {
  ".": [0, 0, 0, 0],
  "#": [0, 0, 0, 0],
  a: [1, 0, 0, 0],
  b: [0, 1, 0, 0],
  c: [0, 0, 1, 0],
  d: [0, 0, 0, 1],
  o: [0.5, 0.5, 0.5, 0.5],
};

const GAP = 0.09;
const GAP_LOCK = 0.045;
const FIT_W = 0.84;
const CAP_H = 0.46;
const TRACK_LABEL = -0.012;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

function glyph(ch: string | undefined): string[] {
  if (!ch) return BLANK3;
  return GLYPHS[ch] ?? BLANK3;
}

function format(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function blankLike(cols: number): string[] {
  return Array.from({ length: ROWS }, () => ".".repeat(cols));
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function ModuleCount(props: ModuleCountProps) {
  const {
    value = 48,
    from = 0,
    prefix = "",
    suffix = "",
    label = DEFAULT_LABEL,
    steps = 11,
    accent,
    ink,
    background,
    fontFamily = archivo.fontFamily,
    fontWeight = 450,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    moduleCountTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const clear = bg === "transparent";

  const plan = useMemo(() => {
    const values = countValues(value, from, steps);
    const finalNum = format(value);
    const finalStr = `${prefix}${finalNum}${suffix}`;
    const slots = Array.from(finalStr);
    const numStart = Array.from(prefix).length;
    const numLen = Array.from(finalNum).length;
    const strings = values.map((v, k) => {
      const num = Array.from(format(v));
      const arr: (string | undefined)[] = slots.map(() => undefined);
      for (let i = 0; i < Array.from(prefix).length; i++) {
        arr[i] = slots[i];
      }
      for (let j = 0; j < num.length && j < numLen; j++) {
        arr[numStart + numLen - 1 - j] = num[num.length - 1 - j];
      }
      if (k === values.length - 1) {
        for (let i = numStart + numLen; i < slots.length; i++) {
          arr[i] = slots[i];
        }
      }
      return arr;
    });
    const cols = slots.map((ch) => glyph(ch)[0].length);
    return { strings, slots, cols };
  }, [value, from, prefix, suffix, steps]);

  const { strings, slots, cols } = plan;
  const stepEls = strings.map((_, k) => tl.get(`step:${k}`));
  const introEl = tl.get("intro");
  const lockEl = tl.get("lock");

  const unitsW =
    cols.reduce((s, n) => s + n * (1 + GAP), 0) +
    (1 + GAP) * Math.max(0, slots.length - 1) -
    GAP;
  const unitsH = ROWS + (ROWS - 1) * GAP;
  const s = Math.min(
    (W * (W < H ? 0.84 : FIT_W)) / unitsW,
    (H * CAP_H) / unitsH,
  );

  // Every position below drifts while the grid tightens and the figure
  // recentres. Layout holds where the drift settles and the drift itself is a
  // transform: layout rounds a box and a baseline to whole pixels, so the
  // cells and the label would click along pixel by pixel. Rest goes through
  // the same arithmetic, so the leftover translate there is exactly 0.
  const labelRows = 2;
  const geometry = (time: number) => {
    const lock = interpolate(time, [lockEl.start, lockEl.end], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    const gap = GAP + (GAP_LOCK - GAP) * lock;

    const slotX: number[] = [];
    let x = 0;
    for (let i = 0; i < slots.length; i++) {
      slotX.push(x);
      x += (cols[i] + 1) * (1 + gap) * s;
    }
    const boxW = x - (1 + 2 * gap) * s;
    const boxH = (ROWS + (ROWS - 1) * gap) * s;

    const visibleFrom = (k: number) => {
      const arr = strings[k];
      let first = arr.findIndex((ch) => ch !== undefined);
      if (first < 0) first = 0;
      let lastI = arr.length - 1;
      while (lastI > first && arr[lastI] === undefined) lastI--;
      const l = slotX[first];
      const r = slotX[lastI] + (cols[lastI] + (cols[lastI] - 1) * gap) * s;
      return (l + r) / 2;
    };
    let centre = visibleFrom(0);
    for (let k = 1; k < strings.length; k++) {
      const e = stepEls[k];
      const p = interpolate(
        time,
        [e.start, e.start + e.beat("morph") + e.beat("recentre")],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_IN_OUT,
        },
      );
      centre += (visibleFrom(k) - centre) * p;
    }
    const shiftX = boxW / 2 - centre;
    const P = (1 + gap) * s;
    const boxTop = H / 2 - boxH / 2 - P * 0.5;
    const boxLeft = W / 2 - boxW / 2 + shiftX;
    const mod = (v: number) => ((v % P) + P) % P;
    const gx0 = mod(boxLeft - (gap * s) / 2);
    const gy0 = mod(boxTop - (gap * s) / 2);
    const M = Math.min(W, H) * 0.07;
    const labelLeft = gx0 + Math.ceil((M - gx0) / P) * P;
    const labelTop = gy0 + Math.floor((H - M - gy0) / P) * P - labelRows * P;
    return {
      lock,
      gap,
      slotX,
      boxW,
      boxH,
      P,
      boxTop,
      boxLeft,
      gx0,
      gy0,
      labelLeft,
      labelTop,
    };
  };
  const g = geometry(t);
  const rest = geometry(Number.MAX_SAFE_INTEGER);
  const { lock, gap, slotX, boxW, boxH, P, boxTop, boxLeft, gx0, gy0 } = g;
  const near = [geometry(t - 1), geometry(t + 1)];
  const labelMoving = near.some(
    (o) =>
      Math.abs(o.labelLeft - g.labelLeft) > 1e-3 ||
      Math.abs(o.labelTop - g.labelTop) > 1e-3 ||
      Math.abs(o.P - g.P) > 1e-4,
  );
  const shift = (dx: number, dy: number) =>
    Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3
      ? ""
      : `translate(${dx}px, ${dy}px) `;

  const intro = interpolate(t, [introEl.start, introEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const spot = accent ?? c.accent;
  const isFigure = (ch: string) => /[0-9.,]/.test(ch);

  const cells: React.ReactNode[] = [];
  let colIndex = 0;
  for (let i = 0; i < slots.length; i++) {
    const n = cols[i];
    for (let col = 0; col < n; col++) {
      const column = colIndex;
      colIndex++;
      for (let row = 0; row < ROWS; row++) {
        let k = 0;
        for (let q = 1; q < strings.length; q++) {
          if (t >= stepEls[q].start + column * stepEls[q].beat("column")) {
            k = q;
          }
        }
        const codeAt = (q: number): Cell => {
          const g =
            strings[q][i] === undefined ? blankLike(n) : glyph(strings[q][i]);
          return (g[row]?.[col] ?? ".") as Cell;
        };
        const now = codeAt(k);
        const prev = k > 0 ? codeAt(k - 1) : ".";
        const p =
          k === 0
            ? 1
            : interpolate(
                t,
                [
                  stepEls[k].start + column * stepEls[k].beat("column"),
                  stepEls[k].start +
                    column * stepEls[k].beat("column") +
                    stepEls[k].beat("morph"),
                ],
                [0, 1],
                {
                  ...CLAMP,
                  easing: EASE_OUT,
                },
              );
        const onPrev = prev === "." ? 0 : 1;
        const onNow = now === "." ? 0 : 1;
        const pOn = onNow < onPrev ? Math.min(1, p * 2.6) : p;
        let on = onPrev + (onNow - onPrev) * pOn;
        if (k === 0) on = onNow * intro;
        if (on <= 0.001) continue;
        const rp = RADII[prev === "." ? now : prev];
        const rn = RADII[now === "." ? prev : now];
        const r = rp.map((v, j) => (v + (rn[j] - v) * p) * s);
        const scale = 0.62 + 0.38 * on;
        const left = slotX[i] + col * (1 + gap) * s;
        const top = row * (1 + gap) * s;
        const leftRest = rest.slotX[i] + col * (1 + rest.gap) * s;
        const topRest = row * (1 + rest.gap) * s;
        const enterLift = k === 0 ? (1 - intro) * s * 0.4 : 0;
        cells.push(
          <div
            key={`${i}-${col}-${row}`}
            style={{
              position: "absolute",
              left: leftRest,
              top: topRest,
              width: s,
              height: s,
              borderRadius: `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px`,
              background: isFigure(slots[i]) ? spot : c.second,
              opacity: on,
              transform: `${shift(left - leftRest, top - topRest)}translateY(${enterLift.toFixed(2)}px) scale(${scale.toFixed(4)})`,
            }}
          />,
        );
      }
    }
  }

  const portrait = H > W * 1.1;
  const sizeAt = (p: number) =>
    Math.min(Math.max(p * 0.4, H * 0.036), portrait ? W * 0.06 : H * 0.056);
  const labelSize = sizeAt(P);
  const labelSizeRest = sizeAt(rest.P);
  const Pr = rest.P;
  const labelCols = Math.max(
    4,
    Math.floor((portrait ? W * 0.84 : W * 0.42) / Pr),
  );
  // The label is laid out at its settled size and the tightening grid grows
  // it through `scale` about the bottom-left of its lines, where flex-end
  // stacks them, instead of re-laying out every frame. The bottom of the lines
  // sits 1.84P below the top with border-box and 2P with content-box; a
  // percentage of the box height covers both.
  const dP = P - Pr;
  const labelK = labelSize / labelSizeRest;
  const labelMove =
    Math.abs(dP) < 1e-6
      ? shift(g.labelLeft - rest.labelLeft, g.labelTop - rest.labelTop)
      : `translate(${g.labelLeft - rest.labelLeft + 0.16 * dP}px, calc(${g.labelTop - rest.labelTop - 0.16 * dP}px + ${(dP / Pr) * 100}%)) scale(${labelK}) `;
  const wordsMoving = (label ? label.split(" ") : []).some((_, k) => {
    const e = tl.get(`word:${k}`);
    return midway(
      interpolate(t, [e.start, e.end], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      }),
    );
  });
  const words = label ? label.split(" ") : [];
  const gridLine = Math.max(1, s * 0.016);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {clear ? null : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to right, ${c.grid} ${gridLine}px, transparent ${gridLine}px), linear-gradient(to bottom, ${c.grid} ${gridLine}px, transparent ${gridLine}px)`,
            backgroundSize: `${P}px ${P}px`,
            backgroundPosition: `${gx0 - gridLine / 2}px ${gy0 - gridLine / 2}px`,
            opacity: lock,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: rest.boxLeft,
            top: rest.boxTop,
            width: boxW,
            height: boxH,
            transform:
              shift(boxLeft - rest.boxLeft, boxTop - rest.boxTop) || undefined,
          }}
        >
          {cells}
        </div>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: rest.labelLeft + Pr * 0.16,
              top: rest.labelTop,
              transform:
                `${labelMove}${glide(labelMoving || wordsMoving)}`.trim() ||
                undefined,
              transformOrigin: `0 calc(100% - ${Pr * 0.16}px)`,
              height: labelRows * Pr,
              display: "flex",
              flexWrap: "wrap",
              alignContent: "flex-end",
              paddingBottom: Pr * 0.16,
              width: labelCols * Pr - Pr * 0.32,
              fontFamily,
              fontVariationSettings: `"wdth" 125, "wght" ${fontWeight}`,
              fontSize: labelSizeRest,
              lineHeight: 1.18,
              letterSpacing: `${TRACK_LABEL}em`,
              color: ink ?? c.ink,
              textWrap: "balance",
            }}
          >
            {words.map((w, k) => {
              const e = tl.get(`word:${k}`);
              const p = interpolate(t, [e.start, e.end], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              return (
                <span
                  key={`${w}-${k}`}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    opacity: p,
                    transform: `translateY(${((1 - p) * labelSizeRest * 0.6).toFixed(2)}px)`,
                  }}
                >
                  {w}
                  {k < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
