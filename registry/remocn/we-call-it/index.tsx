"use client";

import { loadFont } from "@remotion/google-fonts/Bitter";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const bitter = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface WeCallItProps {
  descriptions?: string[];
  lead?: string;
  name?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0F1B3D", ink: "#F4EFE6", accent: "#FF8A3D" },
  light: { bg: "#F4EFE6", ink: "#0F1B3D", accent: "#C85A12" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const BODY_TRACK = -0.02;
const NAME_TRACK = -0.04;
const LH = 1.18;
const NAME_LH = 1.02;
const NAME_BOX = 1.24;
const STEP = 40;
const HOLD = 26;
const MOVE = 18;
const KICK_DIM = 0.62;
const CAP = 0.7;
const DESC = 0.24;

function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("we-call-it: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      bitter.waitUntilDone(),
      document.fonts.load(`400 100px "${bitter.fontFamily}"`),
      document.fonts.load(`500 100px "${bitter.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
}

function useMeasure() {
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const cache = useRef(new Map<string, number>());
  return (text: string, weight: 400 | 500, track: number) => {
    const key = `${weight}\u0001${track}\u0001${text}`;
    const hit = cache.current.get(key);
    if (hit !== undefined) return hit;
    if (!ctx.current)
      ctx.current = document.createElement("canvas").getContext("2d");
    let w = text.length * 0.5;
    if (ctx.current) {
      ctx.current.font = `${weight} 100px "${bitter.fontFamily}"`;
      w = ctx.current.measureText(text).width / 100;
    }
    const em = w + track * Array.from(text).length;
    cache.current.set(key, em);
    return em;
  };
}

function greedy(
  words: string[],
  wOf: (s: string) => number,
  space: number,
  max: number,
) {
  const lines: string[][] = [];
  let line: string[] = [];
  let x = 0;
  for (const word of words) {
    const w = wOf(word);
    if (line.length > 0 && x + space + w > max) {
      lines.push(line);
      line = [word];
      x = w;
    } else {
      x += (line.length > 0 ? space : 0) + w;
      line.push(word);
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

function balanced(
  words: string[],
  wOf: (s: string) => number,
  space: number,
  max: number,
) {
  const base = greedy(words, wOf, space, max);
  if (base.length <= 1) return base;
  let best = base;
  for (let k = 1; k <= 30; k++) {
    const next = greedy(words, wOf, space, max * (1 - k * 0.015));
    if (next.length !== base.length) break;
    best = next;
  }
  return best;
}

function useBaseline() {
  const memo = useRef<number | null>(null);
  return () => {
    if (memo.current !== null) return memo.current;
    const ctx = document.createElement("canvas").getContext("2d");
    let asc = 0.935;
    let desc = 0.265;
    if (ctx) {
      ctx.font = `500 100px "${bitter.fontFamily}"`;
      const m = ctx.measureText("Hg");
      if (m.fontBoundingBoxAscent > 0) {
        asc = m.fontBoundingBoxAscent / 100;
        desc = m.fontBoundingBoxDescent / 100;
      }
    }
    memo.current = (NAME_BOX - asc - desc) / 2 + asc;
    return memo.current;
  };
}

function splits(words: string[], k: number): string[][][] {
  if (k === 1) return [[words]];
  const out: string[][][] = [];
  for (let i = 1; i <= words.length - k + 1; i++) {
    for (const rest of splits(words.slice(i), k - 1)) {
      out.push([words.slice(0, i), ...rest]);
    }
  }
  return out;
}

function splitWords(s: string) {
  return s.trim().split(/\s+/).filter(Boolean);
}

export function WeCallIt({
  descriptions = [
    "Scenes you install like components.",
    "Edits that land as commits.",
    "A film that ships with the release.",
  ],
  lead = "We call it a",
  name = "video registry.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: WeCallItProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady();
  const measure = useMeasure();
  const baselineOf = useBaseline();

  if (!ready) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const descs = descriptions.map(splitWords).filter((d) => d.length > 0);
  const n = descs.length;
  const nameWords = splitWords(name);

  const leadAt = 6 + n * STEP - 2;
  const ruleAt = leadAt + 4;
  const nameAt = leadAt + 10;
  const motionEnd = nameAt + nameWords.length * 4 + 24;
  const tail = Math.max(30, T * 0.18);
  const pace = Math.min(1.5, Math.max(0.5, (T - tail) / motionEnd));
  const t = frame / pace;

  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.08 : 0.07);
  const my = H * (portrait ? 0.14 : 0.09);
  const mb = H * (portrait ? 0.07 : 0.08);
  const innerW = W - mx * 2;

  const space = measure(" ", 400, BODY_TRACK);
  const wBody = (s: string) => measure(s, 400, BODY_TRACK);

  let Fb = portrait ? W * 0.095 : H * 0.115;
  const stageW = innerW * (portrait ? 1 : 0.86);
  let stageLines = descs.map((d) => balanced(d, wBody, space, stageW / Fb));
  for (
    let k = 0;
    k < 40 && stageLines.some((l) => l.length > (portrait ? 3 : 2));
    k++
  ) {
    Fb *= 0.95;
    stageLines = descs.map((d) => balanced(d, wBody, space, stageW / Fb));
  }
  const Fk = portrait ? W * 0.044 : H * 0.042;
  const s = Fk / Fb;
  const bigLineH = Fb * LH;
  const kickGap = Fk * 0.32;

  const kickTops: number[] = [];
  let y = my;
  for (let i = 0; i < n; i++) {
    kickTops.push(y);
    y += stageLines[i].length * bigLineH * s + kickGap;
  }
  const leadTop = y;
  const kickBottom = leadTop + Fk * LH;

  const nameAvailH = H - mb - kickBottom - H * 0.07;
  let best = { font: 0, rows: [nameWords] };
  for (let k = 1; k <= Math.min(3, nameWords.length); k++) {
    for (const rows of splits(nameWords, k)) {
      const widest = Math.max(
        ...rows.map((r) => measure(r.join(" "), 500, NAME_TRACK)),
      );
      const font = Math.min(
        innerW / widest,
        nameAvailH / ((k - 1) * NAME_LH + CAP + DESC),
        H * (portrait ? 0.2 : 0.42),
      );
      if (font > best.font * 1.04) best = { font, rows };
    }
  }
  const Fn = best.font;
  const nameRows = best.rows;
  const lastBase = H - mb - DESC * Fn;
  const firstBase = lastBase - (nameRows.length - 1) * NAME_LH * Fn;
  const nameTop = firstBase - baselineOf() * Fn;
  const ruleY = firstBase - CAP * Fn - Math.min(Fn * 0.2, H * 0.05);

  const stageH = (i: number) => stageLines[i].length * bigLineH;
  const stageTopOf = (i: number) => {
    const midY = (kickBottom + Math.min(ruleY, H * 0.82)) / 2 + H * 0.02;
    return midY - stageH(i) / 2;
  };

  const ease = (a: number, b: number, e = EASE_OUT) =>
    interpolate(t, [a, b], [0, 1], { ...CLAMP, easing: e });

  const lineStyle = (size: number, lh: number) => ({
    height: lh,
    lineHeight: `${lh}px`,
    fontSize: size,
    whiteSpace: "nowrap" as const,
  });

  return (
    <AbsoluteFill
      style={{
        background: stage,
        color: c.ink,
        fontFamily: bitter.fontFamily,
        fontWeight: 400,
        overflow: "hidden",
      }}
    >
      {descs.map((_, i) => {
        const a = 6 + i * STEP;
        const m = a + HOLD;
        const mv = ease(m, m + MOVE, EASE_IO);
        const left = mx;
        const top = stageTopOf(i) + (kickTops[i] - stageTopOf(i)) * mv;
        const scale = 1 + (s - 1) * mv;
        let wi = 0;
        return (
          <div
            key={`d${i}`}
            style={{
              position: "absolute",
              left,
              top,
              transform: `scale(${scale.toFixed(4)})`,
              transformOrigin: "0 0",
              opacity: 1 - (1 - KICK_DIM) * mv,
              letterSpacing: `${BODY_TRACK}em`,
            }}
          >
            {stageLines[i].map((row, li) => (
              <div key={`d${i}-${li}`} style={lineStyle(Fb, bigLineH)}>
                {row.map((word, k) => {
                  const order = wi++;
                  const p = ease(a + order * 3, a + order * 3 + 16);
                  return (
                    <span
                      key={`d${i}-${li}-${k}`}
                      style={{
                        display: "inline-block",
                        whiteSpace: "pre",
                        opacity: p,
                        transform: `translateY(${((1 - p) * Fb * 0.32).toFixed(2)}px)`,
                      }}
                    >
                      {k < row.length - 1 ? `${word} ` : word}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}

      {lead.trim() ? (
        <div
          style={{
            position: "absolute",
            left: mx,
            top: leadTop,
            ...lineStyle(Fk, Fk * LH),
            letterSpacing: `${BODY_TRACK}em`,
            color: hi,
            opacity: ease(leadAt, leadAt + 14),
            transform: `translateY(${((1 - ease(leadAt, leadAt + 14)) * Fk * 0.5).toFixed(2)}px)`,
          }}
        >
          {lead.trim()}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: mx,
          top: ruleY,
          width: innerW,
          height: Math.max(2, Fk * 0.07),
          background: hi,
          transform: `scaleX(${ease(ruleAt, ruleAt + 22, EASE_IO).toFixed(4)})`,
          transformOrigin: "0 50%",
        }}
      />

      {nameRows.map((row, li) => {
        const p = ease(nameAt + li * 5, nameAt + li * 5 + 24);
        const boxTop = nameTop + li * NAME_LH * Fn;
        return (
          <div
            key={`n${li}`}
            style={{
              position: "absolute",
              left: mx,
              top: boxTop,
              ...lineStyle(Fn, NAME_BOX * Fn),
              fontWeight: 500,
              letterSpacing: `${NAME_TRACK}em`,
              color: hi,
              transform: `translateY(${((1 - p) * (H - boxTop)).toFixed(2)}px)`,
            }}
          >
            {row.join(" ")}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
