"use client";

import { loadVariableFont } from "@remotion/google-fonts/Archivo";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const archivo = loadVariableFont("normal", { subsets: ["latin"] });

export interface ModuleCountProps {
  value?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  steps?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

const START = 10;
const FIRST_GAP = 4;
const LAST_GAP = 9;
const MORPH = 7;
const COL_DELAY = 0.7;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

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

export function ModuleCount({
  value = 48,
  from = 0,
  prefix = "",
  suffix = "",
  label = "Scenes, every one snapped to a single grid",
  steps = 11,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: ModuleCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const clear = bg === "transparent";

  const plan = useMemo(() => {
    const n = Math.max(1, Math.round(steps));
    const values: number[] = [];
    for (let k = 0; k <= n; k++) {
      const p = k / n;
      const eased = 1 - (1 - p) ** 2.4;
      const v = Math.round(from + (value - from) * eased);
      if (values.length === 0 || values[values.length - 1] !== v) {
        values.push(v);
      }
    }
    if (values[values.length - 1] !== Math.round(value)) {
      values.push(Math.round(value));
    }
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
    const times: number[] = [];
    let at = START;
    const last = Math.max(1, values.length - 1);
    for (let k = 0; k < values.length; k++) {
      times.push(at);
      const p = k / last;
      at += FIRST_GAP + (LAST_GAP - FIRST_GAP) * p ** 1.6;
    }
    const cols = slots.map((ch) => glyph(ch)[0].length);
    return { strings, times, slots, cols };
  }, [value, from, prefix, suffix, steps]);

  const { strings, times, slots, cols } = plan;
  const lastStep = times[times.length - 1];

  const unitsW =
    cols.reduce((s, n) => s + n * (1 + GAP), 0) +
    (1 + GAP) * Math.max(0, slots.length - 1) -
    GAP;
  const unitsH = ROWS + (ROWS - 1) * GAP;
  const s = Math.min(
    (W * (W < H ? 0.84 : FIT_W)) / unitsW,
    (H * CAP_H) / unitsH,
  );

  const lock = interpolate(t, [lastStep + 4, lastStep + 22], [0, 1], {
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
    const p = interpolate(t, [times[k], times[k] + MORPH + 4], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    centre += (visibleFrom(k) - centre) * p;
  }
  const shiftX = boxW / 2 - centre;

  const intro = interpolate(t, [START - 8, START + 6], [0, 1], {
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
      const sweep = colIndex * COL_DELAY;
      colIndex++;
      for (let row = 0; row < ROWS; row++) {
        let k = 0;
        for (let q = 1; q < strings.length; q++) {
          if (t >= times[q] + sweep) k = q;
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
                [times[k] + sweep, times[k] + sweep + MORPH],
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
        const enterLift = k === 0 ? (1 - intro) * s * 0.4 : 0;
        cells.push(
          <div
            key={`${i}-${col}-${row}`}
            style={{
              position: "absolute",
              left,
              top,
              width: s,
              height: s,
              borderRadius: `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px`,
              background: isFigure(slots[i]) ? spot : c.second,
              opacity: on,
              transform: `translateY(${enterLift.toFixed(2)}px) scale(${scale.toFixed(4)})`,
            }}
          />,
        );
      }
    }
  }

  const labelAt = lastStep - 6;
  const P = (1 + gap) * s;
  const boxTop = H / 2 - boxH / 2 - P * 0.5;
  const boxLeft = W / 2 - boxW / 2 + shiftX;
  const mod = (v: number) => ((v % P) + P) % P;
  const gx0 = mod(boxLeft - (gap * s) / 2);
  const gy0 = mod(boxTop - (gap * s) / 2);
  const portrait = H > W * 1.1;
  const M = Math.min(W, H) * 0.07;
  const labelLeft = gx0 + Math.ceil((M - gx0) / P) * P;
  const labelRows = 2;
  const labelTop = gy0 + Math.floor((H - M - gy0) / P) * P - labelRows * P;
  const labelSize = Math.min(
    Math.max(P * 0.4, H * 0.036),
    portrait ? W * 0.06 : H * 0.056,
  );
  const labelCols = Math.max(
    4,
    Math.floor((portrait ? W * 0.84 : W * 0.42) / P),
  );
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
      <div
        style={{
          position: "absolute",
          left: boxLeft,
          top: boxTop,
          width: boxW,
          height: boxH,
        }}
      >
        {cells}
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: labelLeft + P * 0.16,
            top: labelTop,
            height: labelRows * P,
            display: "flex",
            flexWrap: "wrap",
            alignContent: "flex-end",
            paddingBottom: P * 0.16,
            width: labelCols * P - P * 0.32,
            fontFamily: archivo.fontFamily,
            fontVariationSettings: '"wdth" 125, "wght" 450',
            fontSize: labelSize,
            lineHeight: 1.18,
            letterSpacing: `${TRACK_LABEL}em`,
            color: c.ink,
            textWrap: "balance",
          }}
        >
          {words.map((w, k) => {
            const p = interpolate(
              t,
              [labelAt + k * 3, labelAt + k * 3 + 16],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={`${w}-${k}`}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  opacity: p,
                  transform: `translateY(${((1 - p) * labelSize * 0.6).toFixed(2)}px)`,
                }}
              >
                {w}
                {k < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
