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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import {
  type ResolvedElement,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  curly,
  DEFAULT_EXAMPLE,
  DEFAULT_INFLECTIONS,
  DEFAULT_NOUN_SENSE,
  DEFAULT_VERB_SENSE,
  splitWords,
  type VerbedElementId,
  verbedTimeline,
} from "./timeline";

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
  /** Frame the entry turns from noun to verb. */
  turnAt?: number;
  /** Frames between words as a sense writes in. */
  stagger?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the entry, roman and italic. Load it yourself; Bitter by default. */
  fontFamily?: string;
  /** Size of the entry, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the headword, the label, single words of each
   * sense and the example, the turn, the inflections and the forms taking
   * the accent, by the ids in `./timeline`. Frames on the scene timeline,
   * after `delay` and `speed`.
   */
  timing?: Timing<VerbedElementId>;
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
const DIM = 0.5;
const BACK = 0.74;

type Face = "head" | "body" | "italic";

// Bitter's roman and italic load as one family, so one name covers both.
function fontOf(face: Face, family: string) {
  if (face === "head") return `500 100px "${family}"`;
  if (face === "italic") return `italic 400 100px "${family}"`;
  return `400 100px "${family}"`;
}

function trackOf(face: Face) {
  return face === "head" ? HEAD_TRACK : BODY_TRACK;
}

function useFontsReady(family: string) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("verbed: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      roman.waitUntilDone(),
      italic.waitUntilDone(),
      document.fonts.load(fontOf("head", family)),
      document.fonts.load(fontOf("body", family)),
      document.fonts.load(fontOf("italic", family)),
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
  }, [family, handle]);
  return ready;
}

function useMeasure(family: string) {
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const cache = useRef(new Map<string, number>());
  return (text: string, face: Face) => {
    const key = `${family}\u0001${face}\u0001${text}`;
    const hit = cache.current.get(key);
    if (hit !== undefined) return hit;
    if (!ctx.current)
      ctx.current = document.createElement("canvas").getContext("2d");
    let w = text.length * 0.5;
    if (ctx.current) {
      ctx.current.font = fontOf(face, family);
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

export function Verbed(props: VerbedProps) {
  const {
    headword = "remocn",
    pronunciation = "/rem-uh-kun/",
    nounLabel = "noun",
    verbLabel = "verb",
    nounSense = DEFAULT_NOUN_SENSE,
    verbSense = DEFAULT_VERB_SENSE,
    inflections = DEFAULT_INFLECTIONS,
    example = DEFAULT_EXAMPLE,
    accent,
    ink,
    background,
    fontFamily = roman.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames: T } = useSceneConfig();
  // The entry is paced to the clip without `speed`, so the schedule gets
  // the clip length as it is; it counts scene frames, pace included.
  const tl = useTimeline(verbedTimeline, props, T, timing);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady(fontFamily);
  const measure = useMeasure(fontFamily);

  if (!ready) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const t = frame;

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

  const riseAt = (x: number, start: number, dur = 16) =>
    interpolate(x, [start, start + dur], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const rise = (start: number, dur = 16) => riseAt(t, start, dur);
  // The ease-out tail is long, so "moving" is judged on the travel in px
  // against the neighbouring frames, not on the progress.
  const dt = 1;
  const stirs = (px: (x: number) => number) => {
    const now = px(t);
    return (
      Math.abs(px(t + dt) - now) > 1e-3 || Math.abs(now - px(t - dt)) > 1e-3
    );
  };
  const rising = (start: number, dur: number, travel: number) =>
    stirs((x) => (1 - riseAt(x, start, dur)) * travel);

  const word = (
    text: string,
    key: string,
    p: number,
    size: number,
    moving: boolean,
    extra?: React.CSSProperties,
  ) => (
    <span
      key={key}
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: p,
        transform: `translateY(${((1 - p) * size * 0.4).toFixed(2)}px)${glide(moving)}`,
        ...extra,
      }}
    >
      {text}
    </span>
  );

  const eHead = tl.get("headword");
  const eTurn = tl.get("turn");
  const eNumber = tl.get("number");
  const eInfl = tl.get("inflections");
  const eForms = tl.get("forms");
  const nounEls = nounWords.map((_, i) => tl.get(`noun:${i}`));
  const verbEls = verbWords.map((_, i) => tl.get(`verb:${i}`));
  const exampleEls = exampleWords.map((_, i) => tl.get(`example:${i}`));
  const turnOf = (x: number) =>
    interpolate(x, [eTurn.start, eTurn.end], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  const turn = turnOf(t);
  const verbIn = rise(eNumber.start, eNumber.length);

  const headP = rise(eHead.start, eHead.length);
  const pronP = rise(
    tl.get("pronunciation").start,
    tl.get("pronunciation").length,
  );
  const labelP = rise(tl.get("label").start, tl.get("label").length);

  const headTop = my;
  const sensesTop = headTop + L.headH + L.gap;
  const verbTop = sensesTop + L.nounH * BACK + Fd * 0.6;
  const inflTop = verbTop + L.verbH;
  const exTop = inflTop + L.inflH + Fd * 0.2;

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
          fontFamily,
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
  // Weighed at the far end of the sense, where the scale moves text most.
  const nounMoving = stirs((x) => (1 - BACK) * turnOf(x) * blockW);
  const nounShift = (L.numW * turn) / nounScale;
  const nounAlpha = 1 - (1 - DIM) * turn;

  const lines = (
    rows: string[][],
    top: number,
    left: number,
    els: ResolvedElement<VerbedElementId>[],
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
          fontFamily,
          fontStyle: face === "italic" ? "italic" : "normal",
          fontWeight: 400,
        }}
      >
        {row.map((w, wi) => {
          const e = els[n++];
          const p = rise(e.start, e.length);
          return word(
            wi < row.length - 1 ? `${w} ` : w,
            `${keyBase}${li}-${wi}`,
            p,
            Fd,
            rising(e.start, e.length, Fd * 0.4) &&
              !(keyBase === "n" && nounMoving),
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
        color: fg,
        fontFamily,
        fontWeight: 400,
        overflow: "hidden",
      }}
    >
      <ScaleLayer scale={scale}>
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
              transform: `translateY(${((1 - headP) * Fh * 0.18).toFixed(2)}px)${glide(rising(eHead.start, eHead.length, Fh * 0.18))}`,
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
            // Rounded only at rest: a scale stepped by 1e-4 moves the far end
            // of the sense in steps of a sixth of a pixel while it shrinks.
            transform: `scale(${nounMoving ? nounScale : nounScale.toFixed(4)})${glide(nounMoving)}`,
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
          {lines(L.nounLines, 0, nounShift, nounEls, "n", "body")}
        </div>

        <div
          style={{
            ...numStyle,
            top: verbTop,
            color: hi,
            opacity: verbIn,
            transform: `translateY(${((1 - verbIn) * Fd * 0.4).toFixed(2)}px)${glide(rising(eNumber.start, eNumber.length, Fd * 0.4))}`,
          }}
        >
          2.
        </div>
        {lines(L.verbLines, verbTop, mx + L.numW, verbEls, "v", "body")}

        {L.inflLines.map((row, li) => (
          <div
            key={`i${li}`}
            style={{
              position: "absolute",
              left: mx + L.numW,
              top: inflTop + li * L.inflLineH,
              height: L.inflLineH,
              lineHeight: `${L.inflLineH}px`,
              fontFamily,
              fontStyle: "italic",
              fontSize: L.Fi,
              letterSpacing: `${BODY_TRACK}em`,
              whiteSpace: "pre",
              opacity:
                rise(
                  eInfl.start + li * eInfl.beat("stagger"),
                  eInfl.beat("line"),
                ) * 0.62,
            }}
          >
            {row.join(" ")}
          </div>
        ))}

        {lines(L.exLines, exTop, mx + L.numW, exampleEls, "e", "italic", (w) =>
          isForm(w)
            ? interpolateColors(
                rise(eForms.start, eForms.length),
                [0, 1],
                [fg, hi],
              )
            : fg,
        )}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
