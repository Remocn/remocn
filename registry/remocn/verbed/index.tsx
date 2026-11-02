"use client";

import { loadFont } from "@remotion/google-fonts/Bitter";
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

const roman = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const italic = loadFont("italic", { weights: ["400"], subsets: ["latin"] });

export interface VerbedProps {
  headword?: string;
  pronunciation?: string;
  nounLabel?: string;
  verbLabel?: string;
  nounSense?: string;
  verbSense?: string;
  inflections?: string[];
  example?: string;
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

const HEAD_TRACK = -0.035;
const BODY_TRACK = -0.005;
const LH = 1.32;
const MOTION_END = 168;
const DIM = 0.5;
const BACK = 0.74;

type Face = "head" | "body" | "italic";

function fontOf(face: Face) {
  if (face === "head") return `500 100px "${roman.fontFamily}"`;
  if (face === "italic") return `italic 400 100px "${italic.fontFamily}"`;
  return `400 100px "${roman.fontFamily}"`;
}

function trackOf(face: Face) {
  return face === "head" ? HEAD_TRACK : BODY_TRACK;
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("verbed: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      roman.waitUntilDone(),
      italic.waitUntilDone(),
      document.fonts.load(fontOf("head")),
      document.fonts.load(fontOf("body")),
      document.fonts.load(fontOf("italic")),
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
  return (text: string, face: Face) => {
    const key = `${face}\u0001${text}`;
    const hit = cache.current.get(key);
    if (hit !== undefined) return hit;
    if (!ctx.current)
      ctx.current = document.createElement("canvas").getContext("2d");
    let w = text.length * 0.5;
    if (ctx.current) {
      ctx.current.font = fontOf(face);
      w = ctx.current.measureText(text).width / 100;
    }
    const em = w + trackOf(face) * Array.from(text).length;
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

function splitWords(s: string) {
  return s.trim().split(/\s+/).filter(Boolean);
}

function curly(s: string) {
  const body = s
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "");
  return `“${body}”`;
}

export function Verbed({
  headword = "remocn",
  pronunciation = "/rem-uh-kun/",
  nounLabel = "noun",
  verbLabel = "verb",
  nounSense = "a set of video scenes you copy into your repo and edit like any other code.",
  verbSense = "to make the launch film in the same pull request as the feature.",
  inflections = ["remocns", "remocned", "remocning"],
  example = "We remocned the changelog before lunch.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: VerbedProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady();
  const measure = useMeasure();

  if (!ready) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const tail = Math.max(30, T * 0.16);
  const pace = Math.min(1.5, Math.max(0.5, (T - tail) / MOTION_END));
  const t = frame / pace;

  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.08 : 0.07);
  const my = H * (portrait ? 0.1 : 0.085);
  const blockW = W * (portrait ? 0.84 : 0.8);
  const availH = H - my * 2;

  const space = measure(" ", "body");
  const inflWords = inflections
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w, i, all) => (i < all.length - 1 ? `${w} ·` : w));
  const exampleText = curly(example);
  const nounWords = splitWords(nounSense);
  const verbWords = splitWords(verbSense);
  const exampleWords = splitWords(exampleText);
  const stem = headword.trim().toLowerCase();

  let Fh = portrait ? W * 0.27 : H * 0.26;
  let Fd = portrait ? W * 0.078 : H * 0.066;
  const layout = () => {
    const Fl = Fd;
    const Fp = Fd * 0.82;
    const Fi = Fd * 0.78;
    const numW = Fd * 1.5;
    const textW = (blockW - numW) / Fd;
    const headW = measure(headword, "head") * Fh;
    const labelFull = `${nounLabel}, ${verbLabel}`;
    const sideW =
      Fh * 0.22 +
      measure(pronunciation, "body") * Fp +
      Fd * 0.5 +
      measure(labelFull, "italic") * Fl;
    const stacked = headW + sideW > W - mx * 2;
    const nounLines = balanced(
      nounWords,
      (s) => measure(s, "body"),
      space,
      textW,
    );
    const verbLines = balanced(
      verbWords,
      (s) => measure(s, "body"),
      space,
      textW,
    );
    const exLines = balanced(
      exampleWords,
      (s) => measure(s, "italic"),
      measure(" ", "italic"),
      textW,
    );
    const lineH = Fd * LH;
    const headH = Fh * 1.08 + (stacked ? Fl * 1.5 : 0);
    const gap = Fd * 0.9;
    const nounH = nounLines.length * lineH;
    const verbH = verbLines.length * lineH;
    const inflLines = balanced(
      inflWords,
      (s) => measure(s, "italic"),
      measure(" ", "italic"),
      (textW * Fd) / Fi,
    );
    const inflLineH = Fi * 1.3;
    const inflH =
      inflLines.length > 0 ? inflLines.length * inflLineH + Fi * 0.25 : 0;
    const exH = exLines.length * lineH;
    const total =
      headH + gap + nounH * BACK + Fd * 0.6 + verbH + inflH + Fd * 0.2 + exH;
    return {
      Fl,
      Fp,
      Fi,
      numW,
      headW,
      stacked,
      nounLines,
      verbLines,
      exLines,
      lineH,
      headH,
      gap,
      nounH,
      verbH,
      inflH,
      inflLines,
      inflLineH,
      total,
    };
  };
  let L = layout();
  for (let k = 0; k < 40 && (L.total > availH || L.headW > W - mx * 2); k++) {
    Fh *= 0.96;
    Fd *= 0.97;
    L = layout();
  }

  const rise = (start: number, dur = 16) =>
    interpolate(t, [start, start + dur], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const word = (
    text: string,
    key: string,
    p: number,
    size: number,
    extra?: React.CSSProperties,
  ) => (
    <span
      key={key}
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: p,
        transform: `translateY(${((1 - p) * size * 0.4).toFixed(2)}px)`,
        ...extra,
      }}
    >
      {text}
    </span>
  );

  const TURN = 84;
  const turn = interpolate(t, [TURN, TURN + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const verbIn = rise(TURN + 4, 18);

  const headP = rise(0, 20);
  const pronP = rise(8, 16);
  const labelP = rise(12, 16);

  const headTop = my;
  const sensesTop = headTop + L.headH + L.gap;
  const verbTop = sensesTop + L.nounH * BACK + Fd * 0.6;
  const inflTop = verbTop + L.verbH;
  const exTop = inflTop + L.inflH + Fd * 0.2;

  const nounStart = 20;
  const verbStart = TURN + 12;
  const inflStart = verbStart + verbWords.length * 2 + 10;
  const exStart = inflStart + 14;

  const sideRow = (
    <>
      <span
        style={{
          fontSize: L.Fp,
          letterSpacing: `${BODY_TRACK}em`,
          opacity: pronP * 0.58,
          marginLeft: L.stacked ? 0 : Fh * 0.22,
          marginRight: Fd * 0.5,
          whiteSpace: "pre",
        }}
      >
        {pronunciation}
      </span>
      <span
        style={{
          fontFamily: italic.fontFamily,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: L.Fl,
          letterSpacing: `${BODY_TRACK}em`,
          whiteSpace: "pre",
          opacity: labelP,
          display: "inline-flex",
          alignItems: "baseline",
        }}
      >
        <span>{nounLabel}</span>
        <span
          style={{
            display: "inline-block",
            color: hi,
            opacity: turn,
            transform: `translateX(${((1 - turn) * Fd * 0.3).toFixed(2)}px)`,
          }}
        >
          {`, ${verbLabel}`}
        </span>
      </span>
    </>
  );

  const nounScale = 1 - (1 - BACK) * turn;
  const nounShift = (L.numW * turn) / nounScale;
  const nounAlpha = 1 - (1 - DIM) * turn;

  const lines = (
    rows: string[][],
    top: number,
    left: number,
    start: number,
    keyBase: string,
    face: Face,
    colorOf?: (w: string) => string,
  ) => {
    let n = 0;
    return rows.map((row, li) => (
      <div
        key={`${keyBase}${li}`}
        style={{
          position: "absolute",
          left,
          top: top + li * L.lineH,
          height: L.lineH,
          lineHeight: `${L.lineH}px`,
          whiteSpace: "nowrap",
          fontSize: Fd,
          letterSpacing: `${trackOf(face)}em`,
          fontFamily: face === "italic" ? italic.fontFamily : roman.fontFamily,
          fontStyle: face === "italic" ? "italic" : "normal",
          fontWeight: 400,
        }}
      >
        {row.map((w, wi) => {
          const p = rise(start + n++ * 2, 14);
          return word(
            wi < row.length - 1 ? `${w} ` : w,
            `${keyBase}${li}-${wi}`,
            p,
            Fd,
            colorOf ? { color: colorOf(w) } : undefined,
          );
        })}
      </div>
    ));
  };

  const isForm = (w: string) =>
    stem.length > 0 &&
    w
      .toLowerCase()
      .replace(/^[“"‘']+/, "")
      .startsWith(stem);

  const numStyle: React.CSSProperties = {
    position: "absolute",
    left: mx,
    height: L.lineH,
    lineHeight: `${L.lineH}px`,
    fontSize: Fd,
    fontWeight: 500,
    whiteSpace: "pre",
  };

  return (
    <AbsoluteFill
      style={{
        background: stage,
        color: c.ink,
        fontFamily: roman.fontFamily,
        fontWeight: 400,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: mx,
          top: headTop,
          display: "flex",
          flexDirection: L.stacked ? "column" : "row",
          alignItems: L.stacked ? "flex-start" : "baseline",
          lineHeight: 1.08,
        }}
      >
        <span
          style={{
            fontSize: Fh,
            fontWeight: 500,
            letterSpacing: `${HEAD_TRACK}em`,
            whiteSpace: "pre",
            opacity: headP,
            transform: `translateY(${((1 - headP) * Fh * 0.18).toFixed(2)}px)`,
          }}
        >
          {headword}
        </span>
        {L.stacked ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: Fd * 0.2,
              lineHeight: 1.2,
            }}
          >
            {sideRow}
          </div>
        ) : (
          sideRow
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: mx,
          top: sensesTop,
          width: 0,
          height: 0,
          transform: `scale(${nounScale.toFixed(4)})`,
          transformOrigin: "0 0",
          opacity: nounAlpha,
        }}
      >
        <div
          style={{
            ...numStyle,
            left: 0,
            top: 0,
            opacity: turn,
            transform: `translateX(${((1 - turn) * -Fd * 0.4).toFixed(2)}px)`,
          }}
        >
          1.
        </div>
        {lines(L.nounLines, 0, nounShift, nounStart, "n", "body")}
      </div>

      <div
        style={{
          ...numStyle,
          top: verbTop,
          color: hi,
          opacity: verbIn,
          transform: `translateY(${((1 - verbIn) * Fd * 0.4).toFixed(2)}px)`,
        }}
      >
        2.
      </div>
      {lines(L.verbLines, verbTop, mx + L.numW, verbStart, "v", "body")}

      {L.inflLines.map((row, li) => (
        <div
          key={`i${li}`}
          style={{
            position: "absolute",
            left: mx + L.numW,
            top: inflTop + li * L.inflLineH,
            height: L.inflLineH,
            lineHeight: `${L.inflLineH}px`,
            fontFamily: italic.fontFamily,
            fontStyle: "italic",
            fontSize: L.Fi,
            letterSpacing: `${BODY_TRACK}em`,
            whiteSpace: "pre",
            opacity: rise(inflStart + li * 3, 16) * 0.62,
          }}
        >
          {row.join(" ")}
        </div>
      ))}

      {lines(L.exLines, exTop, mx + L.numW, exStart, "e", "italic", (w) =>
        isForm(w)
          ? interpolateColors(rise(exStart + 12, 16), [0, 1], [c.ink, hi])
          : c.ink,
      )}
    </AbsoluteFill>
  );
}
