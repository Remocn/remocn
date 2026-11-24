"use client";

import { loadFont } from "@remotion/google-fonts/Unbounded";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  ALPHABET,
  type AToZElementId,
  aToZTimeline,
  DEFAULT_ENTRIES,
  DEFAULT_FINALE,
  initialOf,
  lettersBetween,
} from "./timeline";

const unbounded = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface AToZProps {
  entries?: string[];
  finale?: string;
  connector?: string;
  accent?: string;
  /** Text color of the connector and entries; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Unbounded by default. */
  fontFamily?: string;
  /** Frames between wrapped lines of an entry as it rolls. */
  stagger?: number;
  /** Frames for each letter and entry roll. */
  roll?: number;
  /** Size of the letter and text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single elements of the animation, by the ids
   * in `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<AToZElementId>;
}

const ELLIPSIS = "…";
const FONT_PX = 200;
const TRACK = -0.03;
const LETTER_TRACK = -0.02;

const EASE_ROLL = Easing.bezier(0.6, 0, 0.1, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  letters: Record<string, number>;
  maxLetter: number;
  words: Record<string, number>;
  space: number;
  connector: number;
  asc: number;
  desc: number;
  cap: number;
  tall: number;
  deep: number;
}

function measure(
  texts: string[],
  connector: string,
  fontFamily: string,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("a-to-z: no 2d context");
  const em = (s: string, w: number, track: number) => {
    ctx.font = `${w} ${FONT_PX}px "${fontFamily}"`;
    return (
      ctx.measureText(s).width / FONT_PX +
      track * Math.max(0, Array.from(s).length - 1)
    );
  };
  const letters: Record<string, number> = {};
  let maxLetter = 0;
  for (const ch of ALPHABET) {
    letters[ch] = em(ch, 500, 0);
    maxLetter = Math.max(maxLetter, letters[ch]);
  }
  const words: Record<string, number> = {};
  for (const tx of texts) {
    for (const w of tx.split(/\s+/)) {
      if (w && words[w] === undefined) words[w] = em(w, 500, TRACK);
    }
  }
  ctx.font = `500 ${FONT_PX}px "${fontFamily}"`;
  const fm = ctx.measureText("Hgy");
  return {
    letters,
    maxLetter,
    words,
    space: em(" ", 500, 0),
    connector: em(connector, 400, TRACK),
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
    cap: ctx.measureText("H").actualBoundingBoxAscent / FONT_PX,
    tall: ctx.measureText("dlkhfH").actualBoundingBoxAscent / FONT_PX,
    deep: ctx.measureText("gjpqy,").actualBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(texts: string[], connector: string, fontFamily: string) {
  const key = `${fontFamily}\u0003${connector}\u0001${texts.join("\u0002")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("a-to-z: measuring"));
  const released = useRef(false);
  const input = useRef({ texts, connector, fontFamily });
  input.current = { texts, connector, fontFamily };
  useEffect(() => {
    let live = true;
    Promise.all([
      unbounded.waitUntilDone(),
      document.fonts.load(`500 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measure(
            input.current.texts,
            input.current.connector,
            input.current.fontFamily,
          ),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily]);
  return state && state.key === key ? state.m : null;
}

function wrap(text: string, m: Metrics, max: number) {
  const words = text.trim().split(/\s+/);
  const widths = words.map((w) => m.words[w] ?? w.length * 0.7);
  const run = (limit: number) => {
    const lines: string[][] = [];
    let line: string[] = [];
    let w = 0;
    words.forEach((word, i) => {
      const add = line.length === 0 ? widths[i] : w + m.space + widths[i];
      if (line.length > 0 && add > limit) {
        lines.push(line);
        line = [word];
        w = widths[i];
      } else {
        line.push(word);
        w = add;
      }
    });
    if (line.length) lines.push(line);
    return lines;
  };
  const first = run(max);
  let best = first;
  for (let k = 1; k <= 20; k++) {
    const next = run(max * (1 - k * 0.025));
    if (next.length !== first.length) break;
    best = next;
  }
  return {
    lines: best.map((l) => l.join(" ")),
    widest: Math.max(
      ...best.map((l) =>
        l.reduce((s, w, i) => s + (m.words[w] ?? 0) + (i > 0 ? m.space : 0), 0),
      ),
    ),
  };
}

interface Step<T> {
  at: number;
  value: T;
  roll: number;
  /** Frames between wrapped lines as they roll; text only. */
  stagger?: number;
  ease: (x: number) => number;
}

/** In time order; a stable sort keeps steps at the same frame in order. */
const byTime = <T,>(steps: Step<T>[]) => steps.sort((a, b) => a.at - b.at);

function stepAt<T>(steps: Step<T>[], t: number) {
  let k = 0;
  for (let i = 0; i < steps.length; i++) if (t >= steps[i].at) k = i;
  return { cur: steps[k], prev: k > 0 ? steps[k - 1] : null };
}

// Layout rounds a baseline to whole pixels, so a line rolled by `top` clicks
// along pixel by pixel; the roll is a transform on the line instead, marked
// so its text leans while it moves. The transform stays on at rest, at 0, so
// the mark is there on every frame the line is shown.
const lift = (y: number, glide: Glide) => {
  const moving = Math.abs(y) >= 1e-3;
  return `translateY(${moving ? y : 0}px)${glide(moving)}`;
};
type Glide = ReturnType<typeof useGlide>;

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

export function AToZ(props: AToZProps) {
  const {
    entries = DEFAULT_ENTRIES,
    finale = DEFAULT_FINALE,
    connector = "is for",
    accent,
    ink: inkProp,
    background,
    fontFamily = unbounded.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const dark = theme === "dark";
  const field = dark ? (accent ?? "#FF5A1F") : "#FFFFFF";
  const stage =
    background === "transparent" ? "transparent" : (background ?? field);
  const ink = inkProp ?? "#000000";
  const letterInk = dark ? "#000000" : (accent ?? "#E8480F");

  const list = entries.length > 0 ? entries : DEFAULT_ENTRIES;
  const m = useMetrics([...list, finale, ELLIPSIS], connector, fontFamily);
  const tl = useTimeline(aToZTimeline, props, durationInFrames * speed, timing);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const between = lettersBetween(list[list.length - 1], finale);
  const opening = tl.get("entry:0");
  const items = list.map((_, k) => tl.get(`entry:${k}`));
  const ellipsis = between.length > 0 ? tl.get("ellipsis") : null;
  const last = tl.get("finale");

  const letterSteps: Step<string>[] = list.map((e, k) => ({
    at: items[k].start,
    value: initialOf(e),
    roll: items[k].beat("roll"),
    ease: EASE_ROLL,
  }));
  if (ellipsis) {
    between.forEach((ch, i) => {
      letterSteps.push({
        at: ellipsis.start + ellipsis.beat(`flick:${i}`),
        value: ch,
        roll: 0,
        ease: EASE_ROLL,
      });
    });
  }
  letterSteps.push({
    at: last.start,
    value: initialOf(finale),
    roll: last.beat("roll"),
    ease: EASE_OUT,
  });
  byTime(letterSteps);

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.09 : 0.075);

  const shown = [...list, finale].map(initialOf);
  const shownMax = Math.max(...shown.map((ch) => m.letters[ch] ?? 0));
  const all = [...list, finale];
  const widestWord = Math.max(
    ...all.flatMap((s) => s.split(/\s+/).map((w) => m.words[w] ?? 0)),
  );
  const singleWidest = Math.max(...all.map((s) => wrap(s, m, 1e9).widest));
  const lead = Math.max(1.04, m.tall + m.deep + 0.1);

  let G: number;
  let F: number;
  let xL: number;
  let textX: number;
  let textMax: number;
  let yB: number;
  let connectorBase: number;
  if (portrait) {
    G = Math.min(H * 0.26, W * 0.62) / m.cap;
    xL = marginX;
    textX = marginX;
    textMax = W - marginX * 2;
    F = Math.min(
      W * 0.1,
      textMax / Math.max(widestWord, 0.1),
      (textMax * 2) / Math.max(singleWidest * 1.1, 0.1),
    );
    yB = H * 0.44;
    connectorBase = yB + F * 1.1;
  } else {
    const gap0 = W * 0.04;
    G = (H * 0.5) / m.cap;
    G = Math.min(G, (marginX * 0.8) / Math.max(m.maxLetter - shownMax, 0.01));
    const colW = shownMax * G;
    const avail = W - marginX * 2 - colW - gap0;
    F = Math.min(
      H * 0.15,
      avail / Math.max(widestWord, 0.1),
      (avail * 2) / Math.max(singleWidest * 1.1, 0.1),
    );
    const textW = Math.max(...all.map((s) => wrap(s, m, avail / F).widest)) * F;
    const groupW = colW + gap0 + textW;
    const left = Math.max(marginX, (W - groupW) / 2);
    xL = left + colW;
    textX = xL + gap0;
    textMax = W - marginX - textX;
    yB = H / 2 + (m.cap * G) / 2;
    connectorBase = yB - m.cap * G + F * 0.5 * m.cap;
  }
  const capPx = m.cap * G;
  const capTop = yB - capPx;
  const lineSets = [...list, ELLIPSIS, finale].map(
    (s) => wrap(s, m, textMax / F).lines,
  );
  const Fc = F * 0.5;
  const lineH = lead * F;
  const itemTop0 = connectorBase + F * (m.deep + 0.25 + m.tall);

  const textSteps: Step<string[]>[] = list.map((_, k) => ({
    at: items[k].start,
    value: lineSets[k],
    roll: items[k].beat("roll"),
    stagger: items[k].beat("stagger"),
    ease: EASE_ROLL,
  }));
  if (ellipsis) {
    textSteps.push({
      at: ellipsis.start,
      value: lineSets[list.length],
      roll: ellipsis.beat("roll"),
      stagger: ellipsis.beat("stagger"),
      ease: EASE_ROLL,
    });
  }
  textSteps.push({
    at: last.start + last.beat("textAt"),
    value: lineSets[list.length + 1],
    roll: last.beat("roll"),
    stagger: last.beat("stagger"),
    ease: EASE_OUT,
  });
  byTime(textSteps);

  // The opening entry rises in over `frames` from `from`, rather than rolls.
  const rise = (from: number, frames: number) =>
    interpolate(t, [from, from + frames], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const rollPair = (
    key: string,
    winTop: number,
    winH: number,
    render: (value: string, y: number, k: string) => React.ReactNode,
    outgoing: string | null,
    incoming: string | null,
    p: number,
    winStyle?: React.CSSProperties,
  ) => {
    const travel = winH * 1.02;
    const kids: React.ReactNode[] = [];
    if (outgoing !== null && p < 1)
      kids.push(render(outgoing, -travel * p, "o"));
    if (incoming !== null && p > 0)
      kids.push(render(incoming, travel * (1 - p), "i"));
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          top: winTop,
          height: winH,
          overflow: "hidden",
          ...winStyle,
        }}
      >
        {kids}
      </div>
    );
  };

  const nodes: React.ReactNode[] = [];

  {
    const { cur, prev } = stepAt(letterSteps, t);
    const p = !prev
      ? rise(opening.start + opening.beat("letterAt"), opening.beat("rise"))
      : cur.roll === 0
        ? 1
        : interpolate(t, [cur.at, cur.at + cur.roll], [0, 1], {
            ...CLAMP,
            easing: cur.ease,
          });
    const pad = G * 0.06;
    const winTop = capTop - pad;
    const winH = capPx + pad * 2;
    const lineBox = (m.asc + m.desc) * G;
    const textTop = yB - m.asc * G - winTop;
    nodes.push(
      rollPair(
        "letter",
        winTop,
        winH,
        (v, y, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              // As wide as the window, the letter aligned to its side: the
              // lean reads a box's laid-out width as a whole number, which on
              // a box one letter wide is off enough to lean a resting letter,
              // and to drop the lean again when the flick swaps the letter.
              left: 0,
              right: 0,
              textAlign: portrait ? "left" : "right",
              top: textTop,
              transform: lift(y, glide),
              height: lineBox,
              lineHeight: `${lineBox}px`,
              fontFamily,
              fontWeight: 500,
              fontSize: G,
              letterSpacing: `${LETTER_TRACK}em`,
              color: letterInk,
              whiteSpace: "pre",
            }}
          >
            {v}
          </div>
        ),
        prev ? prev.value : null,
        cur.value,
        p,
        portrait
          ? { left: marginX, width: W - marginX }
          : { left: 0, width: xL },
      ),
    );
  }

  const textLine = (size: number, weight: number, color: string) =>
    function TextLine(v: string, y: number, k: string) {
      const lineBox = (m.asc + m.desc) * size;
      return (
        <div
          key={k}
          style={{
            position: "absolute",
            // Across the window, for the same reason as the letter.
            left: 0,
            right: 0,
            top: (m.tall + 0.05 - m.asc) * size,
            transform: lift(y, glide),
            height: lineBox,
            lineHeight: `${lineBox}px`,
            fontFamily,
            fontWeight: weight,
            fontSize: size,
            letterSpacing: `${TRACK}em`,
            color,
            whiteSpace: "pre",
          }}
        >
          {v}
        </div>
      );
    };

  {
    const link = tl.get("connector");
    const cp = rise(link.start, link.beat("rise"));
    const winTop = connectorBase - Fc * (m.tall + 0.05);
    nodes.push(
      rollPair(
        "connector",
        winTop,
        Fc * (m.tall + m.deep + 0.1),
        textLine(Fc, 400, ink),
        null,
        connector,
        cp,
        { left: textX, right: 0 },
      ),
    );
  }

  {
    const { cur, prev } = stepAt(textSteps, t);
    const prevLines = prev ? prev.value : [];
    const curLines = cur.value;
    const slots = Math.max(prevLines.length, curLines.length);
    const slotOf = (lines: string[], s: number) => {
      if (portrait) return lines[s] ?? null;
      const i = lines.length - 1 - s;
      return i >= 0 ? lines[i] : null;
    };
    for (let s = 0; s < slots; s++) {
      const base = portrait ? itemTop0 + s * lineH : yB - s * lineH;
      const order = portrait ? s : slots - 1 - s;
      const lag = order * (cur.stagger ?? 0);
      const p = !prev
        ? rise(
            opening.start + opening.beat("textAt") + lag,
            opening.beat("rise"),
          )
        : interpolate(t, [cur.at + lag, cur.at + lag + cur.roll], [0, 1], {
            ...CLAMP,
            easing: cur.ease,
          });
      const winTop = base - F * (m.tall + 0.05);
      nodes.push(
        rollPair(
          `s${s}`,
          winTop,
          F * (m.tall + m.deep + 0.1),
          textLine(F, 500, ink),
          slotOf(prevLines, s),
          slotOf(curLines, s),
          p,
          { left: textX, right: 0 },
        ),
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
