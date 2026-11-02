"use client";

import { loadFont } from "@remotion/google-fonts/Geologica";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const geologica = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface WhichMeansProps {
  name?: string;
  label?: string;
  steps?: string[];
  hinge?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0E3B43", ink: "#FFFFFF", accent: "#4FE3D0" },
  light: { bg: "#E8F6F5", ink: "#0B3138", accent: "#0F8C7E" },
} as const;

const DEFAULT_STEPS = [
  "Every edit shows up as you type,",
  "you catch the typo before you render,",
  "the first render is the one you ship.",
];

const FONT_PX = 200;
const NAME_W = 500;
const BODY_W = 400;
const NAME_TRACK = -0.035;
const BODY_TRACK = -0.02;
const LH = 1.16;
const NAME_LH = 1.02;
const HINGE_EM = 0.5;
const GAP_EM = 0.5;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const NAME_AT = 0;
const FIRST_AT = 12;
const FIRST_READ = 36;
const WORD_STAGGER = 2;
const WORD_IN = 12;
const CENTER_TO_SLOT = 14;
const EXIT = 11;
const RISE = 18;
const WRITE_AFTER_RISE = 13;
const DIM = 0.5;
const TAIL = 76;

type Metrics = Record<string, number>;
const key = (w: number, s: string) => `${w}\u0002${s}`;

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("which-means: no 2d context");
  const out: Metrics = {};
  for (const weight of [NAME_W, BODY_W]) {
    ctx.font = `${weight} ${FONT_PX}px "${geologica.fontFamily}"`;
    for (const s of texts) {
      out[key(weight, s)] = ctx.measureText(s).width / FONT_PX;
    }
  }
  return out;
}

function useMetrics(texts: string[]) {
  const id = texts.join("\u0001");
  const [state, setState] = useState<{ id: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("which-means: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geologica.waitUntilDone(),
      document.fonts.load(`${NAME_W} 100px "${geologica.fontFamily}"`),
      document.fonts.load(`${BODY_W} 100px "${geologica.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ id, m: measureAll(id.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [id, handle]);
  return state && state.id === id ? state.m : null;
}

const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

function greedy(
  words: string[],
  width: (w: string) => number,
  space: number,
  limit: number,
) {
  const lines: string[][] = [];
  let cur: string[] = [];
  let acc = 0;
  for (const w of words) {
    const ww = width(w);
    if (cur.length > 0 && acc + space + ww > limit) {
      lines.push(cur);
      cur = [w];
      acc = ww;
    } else {
      acc = cur.length > 0 ? acc + space + ww : ww;
      cur.push(w);
    }
  }
  if (cur.length > 0) lines.push(cur);
  return lines;
}

function balanced(
  words: string[],
  width: (w: string) => number,
  space: number,
  limit: number,
) {
  const count = greedy(words, width, space, limit).length;
  let lo = 0;
  let hi = limit;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(words, width, space, mid).length <= count) hi = mid;
    else lo = mid;
  }
  return greedy(words, width, space, hi);
}

function partitions(words: string[], parts: number): string[][][] {
  if (parts <= 1 || words.length <= 1) return [[words]];
  const out: string[][][] = [];
  for (let cut = 1; cut <= words.length - parts + 1; cut++) {
    for (const rest of partitions(words.slice(cut), parts - 1)) {
      out.push([words.slice(0, cut), ...rest]);
    }
  }
  return out;
}

const stripEnd = (s: string) => s.replace(/[\s,.;:…]+$/u, "");

interface Clause {
  lines: string[][];
  h: number;
}

export function WhichMeans({
  name = "Live preview",
  label = "New",
  steps = DEFAULT_STEPS,
  hinge = "which means",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: WhichMeansProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = (steps.length > 0 ? steps : DEFAULT_STEPS).map(stripEnd);
  const nameWords = splitWords(name);
  const m = useMetrics([
    " ",
    "…",
    ...nameWords,
    ...list.flatMap(splitWords),
    hinge,
    label,
  ]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.07);

  const nameX = marginX;
  const colX = portrait ? marginX : W * 0.36;
  const nameMaxW = portrait ? W - marginX * 2 : colX - marginX - W * 0.055;
  const colW = W - marginX - colX;

  const nW = (s: string) =>
    m[key(NAME_W, s)] + NAME_TRACK * Array.from(s).length;
  const bW = (s: string) =>
    m[key(BODY_W, s)] + BODY_TRACK * Array.from(s).length;
  const nSpace = nW(" ");
  const bSpace = bW(" ");
  const lineWidth = (line: string[], f: (s: string) => number, sp: number) =>
    line.reduce((a, w, i) => a + f(w) + (i > 0 ? sp : 0), 0);

  const nameCap = H * (portrait ? 0.09 : 0.16);
  let nameLines: string[][] = [nameWords];
  let nameF = 0;
  let nameScore = -1;
  for (let L = 1; L <= Math.min(3, nameWords.length); L++) {
    for (const p of partitions(nameWords, L)) {
      const wEm = Math.max(...p.map((l) => lineWidth(l, nW, nSpace)));
      const f = Math.min(nameCap, nameMaxW / wEm);
      const score = f / (1 + 0.12 * (L - 1));
      if (score > nameScore) {
        nameScore = score;
        nameF = f;
        nameLines = p;
      }
    }
  }

  const bodyCap = H * (portrait ? 0.058 : 0.1);
  const maxStack = H * (portrait ? 0.56 : 0.86);
  let F = bodyCap;
  let clauses: Clause[] = [];
  for (let i = 0; i < 40; i++) {
    clauses = list.map((s) => {
      const lines = balanced(splitWords(s), bW, bSpace, colW / F);
      return { lines, h: lines.length * LH * F };
    });
    const tallest = Math.max(...clauses.map((cl) => cl.h));
    const stack = tallest * 2 + F * (HINGE_EM + GAP_EM * 2);
    const tooMany = clauses.some((cl) => cl.lines.length > 3);
    if (!tooMany && stack <= maxStack) break;
    F *= 0.95;
  }

  const span = durationInFrames * speed;
  const fixed = FIRST_AT + FIRST_READ + TAIL;
  const period =
    n > 2
      ? Math.min(72, Math.max(44, (span - fixed - 10) / (n - 2)))
      : Math.max(44, span - fixed);
  const stepAt = (k: number) =>
    k <= 0 ? FIRST_AT : FIRST_AT + FIRST_READ + (k - 1) * period;

  const ease = (from: number, dur: number, curve = EASE_OUT) =>
    interpolate(t, [from, from + dur], [0, 1], { ...CLAMP, easing: curve });

  const hingeY = portrait ? H * 0.57 : H * 0.5;
  const hingeF = F * HINGE_EM;
  const gap = F * GAP_EM;
  const causeBottom = hingeY - hingeF / 2 - gap;
  const effectTop = hingeY + hingeF / 2 + gap;
  const causeTop = (k: number) => causeBottom - clauses[k].h;

  const nameH = nameLines.length * NAME_LH * nameF;
  const labelF = Math.max(12, nameF * 0.3, F * 0.46);
  const nameTop = portrait ? H * 0.16 : hingeY - nameH / 2 + labelF * 0.6;

  const nodes: React.ReactNode[] = [];

  const labelIn = ease(NAME_AT + 4, 14);
  if (label) {
    nodes.push(
      <div
        key="label"
        style={{
          position: "absolute",
          left: nameX,
          top: nameTop - labelF * 1.9,
          fontFamily: geologica.fontFamily,
          fontWeight: BODY_W,
          fontSize: labelF,
          lineHeight: 1,
          color: hi,
          opacity: labelIn,
          transform: `translateY(${((1 - labelIn) * labelF * 0.6).toFixed(2)}px)`,
          whiteSpace: "pre",
        }}
      >
        {label}
      </div>,
    );
  }

  nameLines.forEach((line, li) => {
    nodes.push(
      <div
        key={`name-${line.join(" ")}`}
        style={{
          position: "absolute",
          left: nameX - nameF * 0.04,
          top: nameTop + li * NAME_LH * nameF - nameF * 0.08,
          height: nameF * NAME_LH + nameF * 0.16,
          paddingLeft: nameF * 0.04,
          paddingRight: nameF * 0.1,
          overflow: "hidden",
          fontFamily: geologica.fontFamily,
          fontWeight: NAME_W,
          fontSize: nameF,
          lineHeight: `${nameF * NAME_LH + nameF * 0.16}px`,
          letterSpacing: `${NAME_TRACK}em`,
          color: c.ink,
          whiteSpace: "pre",
        }}
      >
        {line.map((w, wi) => {
          const e = ease(NAME_AT + (li * 2 + wi) * 3, 16);
          return (
            <span
              key={w}
              style={{
                display: "inline-block",
                transform: `translateY(${((1 - e) * nameF * 1.1).toFixed(2)}px)`,
              }}
            >
              {wi > 0 ? ` ${w}` : w}
            </span>
          );
        })}
      </div>,
    );
  });

  const renderClause = (
    k: number,
    top: number,
    opacity: number,
    color: string,
    writeAt: number,
    endDot: number,
    ellipsis: number,
  ) => {
    const cl = clauses[k];
    const last = k === n - 1;
    let wordIndex = 0;
    return (
      <div
        key={`clause-${k}`}
        style={{
          position: "absolute",
          left: colX,
          top,
          width: colW + F,
          opacity,
          color,
          fontFamily: geologica.fontFamily,
          fontWeight: BODY_W,
          fontSize: F,
          letterSpacing: `${BODY_TRACK}em`,
          lineHeight: `${LH * F}px`,
          whiteSpace: "pre",
        }}
      >
        {ellipsis > 0 && colX > (bW("…") + 0.12) * F ? (
          <span
            style={{
              position: "absolute",
              left: -bW("…") * F - F * 0.06,
              top: 0,
              opacity: ellipsis,
            }}
          >
            …
          </span>
        ) : null}
        {cl.lines.map((line, li) => (
          <div key={line.join(" ")}>
            {line.map((w, wi) => {
              const e = ease(writeAt + wordIndex++ * WORD_STAGGER, WORD_IN);
              const isEnd =
                li === cl.lines.length - 1 && wi === line.length - 1;
              return (
                <span
                  key={`${w}-${wi}`}
                  style={{
                    display: "inline-block",
                    opacity: e,
                    transform: `translateY(${((1 - e) * F * 0.45).toFixed(2)}px)`,
                  }}
                >
                  {wi > 0 ? ` ${w}` : w}
                  {isEnd ? (
                    <span style={{ position: "relative" }}>
                      <span style={{ opacity: last ? 1 : endDot }}>.</span>
                      {last ? null : (
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            opacity: 1 - endDot,
                          }}
                        >
                          ,
                        </span>
                      )}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const s1 = stepAt(1);
  const c0Slot = n > 1 ? ease(s1, CENTER_TO_SLOT, EASE_MOVE) : 0;

  for (let k = 0; k < n; k++) {
    const enter = stepAt(k);
    if (t < enter - 1) continue;
    const promoteAt = stepAt(k + 1);
    const leaveAt = stepAt(k + 2);
    const promoting = k >= 1 && k + 1 < n;
    const isLast = k === n - 1;

    let top: number;
    let opacity = 1;
    let writeAt: number;
    let endDot = 1;
    let ellipsis = 0;

    if (k === 0) {
      writeAt = enter;
      const centred = hingeY - clauses[0].h / 2;
      top = centred + (causeTop(0) - centred) * c0Slot;
      opacity = 1 - (1 - DIM) * ease(s1 + 2, 14);
      endDot = n > 1 ? 1 - ease(s1, 10) : 1;
    } else {
      writeAt = k === 1 ? enter + 4 : enter + WRITE_AFTER_RISE;
      top = effectTop;
      if (promoting) {
        const rise = ease(promoteAt, RISE, EASE_MOVE);
        top = effectTop + (causeTop(k) - effectTop) * rise;
        opacity = 1 - (1 - DIM) * ease(promoteAt + 4, 14);
        endDot = 1 - ease(promoteAt + 4, 10);
        ellipsis = ease(promoteAt + RISE - 4, 10);
      }
    }

    if (k + 2 < n) {
      const exit = ease(leaveAt, EXIT, EASE_MOVE);
      if (exit >= 1) continue;
      top -= exit * F * 0.9;
      opacity *= 1 - exit;
    }

    const color = isLast
      ? interpolateColors(
          ease(enter + WRITE_AFTER_RISE + 8, 16),
          [0, 1],
          [c.ink, hi],
        )
      : c.ink;

    nodes.push(renderClause(k, top, opacity, color, writeAt, endDot, ellipsis));
  }

  if (n > 1) {
    const hingeIn = ease(s1, 12);
    let hingeOp = hingeIn;
    for (let k = 2; k < n; k++) {
      const p = stepAt(k);
      const dip =
        interpolate(t, [p, p + 5], [0, 1], CLAMP) *
        (1 - interpolate(t, [p + RISE - 4, p + RISE + 6], [0, 1], CLAMP));
      hingeOp *= 1 - dip;
    }
    nodes.push(
      <div
        key="hinge"
        style={{
          position: "absolute",
          left: colX,
          top: hingeY - hingeF * 0.6,
          fontFamily: geologica.fontFamily,
          fontWeight: BODY_W,
          fontSize: hingeF,
          lineHeight: `${hingeF * 1.2}px`,
          color: hi,
          opacity: hingeOp,
          transform: `translateX(${((1 - hingeIn) * -F * 0.4).toFixed(2)}px)`,
          whiteSpace: "pre",
        }}
      >
        {hinge}
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
