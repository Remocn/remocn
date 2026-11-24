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
  DEFAULT_ENTRIES,
  type WeekShippedElementId,
  weekShippedTimeline,
} from "./timeline";

const unbounded = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface WeekShippedEntry {
  day: string;
  item: string;
}

export interface WeekShippedProps {
  entries?: WeekShippedEntry[];
  accent?: string;
  /** Text color of the items; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Unbounded by default. */
  fontFamily?: string;
  /** Frames between one day and the next. */
  beat?: number;
  /** Frames the last day holds before the end. */
  hold?: number;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches each day's entry, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<WeekShippedElementId>;
}

const FONT_PX = 200;
const TRACK = -0.03;
const DAY_SCALE = 0.42;

const EASE_ROLL = Easing.bezier(0.6, 0, 0.1, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const STAGGER = 1;

interface Metrics {
  days: number[];
  words: number[][];
  itemWords: string[][];
  space: number;
  asc: number;
  desc: number;
  tall: number;
  deep: number;
}

function measure(entries: WeekShippedEntry[], fontFamily: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("week-shipped: no 2d context");
  const em = (s: string, w: number) => {
    ctx.font = `${w} ${FONT_PX}px "${fontFamily}"`;
    return (
      ctx.measureText(s).width / FONT_PX +
      TRACK * Math.max(0, Array.from(s).length - 1)
    );
  };
  const itemWords = entries.map((e) => e.item.trim().split(/\s+/));
  ctx.font = `500 ${FONT_PX}px "${fontFamily}"`;
  const fm = ctx.measureText("Hgy");
  return {
    days: entries.map((e) => em(e.day, 400)),
    words: itemWords.map((ws) => ws.map((w) => em(w, 500))),
    itemWords,
    space: em(" ", 500) - TRACK,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
    tall: ctx.measureText("dlkhfH").actualBoundingBoxAscent / FONT_PX,
    deep: ctx.measureText("gjpqy,").actualBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(entries: WeekShippedEntry[], fontFamily: string) {
  const key = `${fontFamily}\u0003${entries.map((e) => `${e.day}\u0001${e.item}`).join("\u0002")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("week-shipped: measuring"));
  const released = useRef(false);
  const input = useRef(entries);
  input.current = entries;
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
        setState({ key, m: measure(input.current, fontFamily) });
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

function wrap(words: string[], widths: number[], space: number, max: number) {
  const run = (limit: number) => {
    const lines: string[][] = [];
    let line: string[] = [];
    let w = 0;
    words.forEach((word, i) => {
      const add = line.length === 0 ? widths[i] : w + space + widths[i];
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
  return best.map((l) => l.join(" "));
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

export function WeekShipped(props: WeekShippedProps) {
  const {
    entries = DEFAULT_ENTRIES,
    accent,
    ink,
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
  // The days are fitted to what is left of the scene after `delay`.
  const tl = useTimeline(
    weekShippedTimeline,
    props,
    Math.max(0, durationInFrames - delay) * speed,
    timing,
  );
  const dark = theme === "dark";
  const field = dark ? (accent ?? "#FF5A1F") : "#FFFFFF";
  const stage =
    background === "transparent" ? "transparent" : (background ?? field);
  const fg = ink ?? "#000000";
  const dayInk = dark ? fg : (accent ?? "#E8480F");

  const list = entries.length > 0 ? entries : DEFAULT_ENTRIES;
  const m = useMetrics(list, fontFamily);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const days = tl.lane("Days");

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.09 : 0.075);
  const maxW = W - marginX * 2;
  const lead = Math.max(1.04, m.tall + m.deep + 0.1);
  const longest = Math.max(
    ...m.words.map(
      (ws) => ws.reduce((s, w) => s + w, 0) + m.space * (ws.length - 1),
    ),
  );
  const widestWord = Math.max(...m.words.flat());
  const F = Math.min(
    portrait ? W * 0.11 : H * 0.17,
    maxW / Math.max(widestWord, 0.1),
    (maxW * 3) / Math.max(longest * 1.15, 0.1),
  );
  const Fd = F * DAY_SCALE;
  const wrapped = list.map((_, k) =>
    wrap(m.itemWords[k], m.words[k], m.space, maxW / F),
  );
  const lineH = lead * F;
  const dayGap = F * 0.3;
  const layoutOf = (k: number) => {
    const rows = wrapped[k].length;
    const dayBox = Fd * (m.tall + m.deep);
    const blockH = dayBox + dayGap + F * (m.tall + m.deep) + (rows - 1) * lineH;
    const top = H / 2 - blockH / 2;
    return {
      dayBase: top + Fd * m.tall,
      itemBase: top + dayBox + dayGap + F * m.tall,
    };
  };

  let cur = 0;
  for (let k = 0; k < n; k++) if (t >= days[k].start) cur = k;
  const last = cur === n - 1 && n > 1;
  const e = days[cur];
  const s0 = e.start;

  const outP =
    cur === 0
      ? 1
      : interpolate(t, [s0, s0 + e.beat("out")], [0, 1], {
          ...CLAMP,
          easing: Easing.bezier(0.55, 0, 1, 0.45),
        });
  const inP = (order: number) =>
    cur === 0
      ? interpolate(
          t,
          [
            s0 + order * STAGGER + e.beat("lead"),
            s0 + order * STAGGER + e.beat("rise"),
          ],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        )
      : interpolate(
          t,
          [s0 + e.beat("enter") + order, s0 + e.beat("roll") + order],
          [0, 1],
          { ...CLAMP, easing: last ? EASE_OUT : EASE_ROLL },
        );

  const line = (
    key: string,
    text: string,
    base: number,
    size: number,
    weight: number,
    color: string,
    shift: number,
  ) => {
    const winTop = base - size * (m.tall + 0.05);
    const winH = size * (m.tall + m.deep + 0.1);
    const lineBox = size * (m.asc + m.desc);
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: marginX,
          right: 0,
          top: winTop,
          height: winH,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            // The roll is a transform, there at rest too: layout rounds a
            // baseline to whole pixels, so a line eased by `top` clicks along,
            // and one handed back to layout at rest jumps.
            top: base - size * m.asc - winTop,
            transform: `translateY(${shift * winH * 1.04}px)${glide(shift !== 0)}`,
            height: lineBox,
            lineHeight: `${lineBox}px`,
            fontFamily,
            fontWeight: weight,
            fontSize: size,
            letterSpacing: `${TRACK}em`,
            whiteSpace: "pre",
            color,
          }}
        >
          {text}
        </div>
      </div>
    );
  };

  const entryNodes = (
    k: number,
    shiftOf: (order: number) => number,
    tag: string,
  ) => {
    const L = layoutOf(k);
    const out: React.ReactNode[] = [];
    const d = shiftOf(0);
    if (Math.abs(d) < 1) {
      out.push(line(`${tag}d`, list[k].day, L.dayBase, Fd, 400, dayInk, d));
    }
    wrapped[k].forEach((tx, i) => {
      const sh = shiftOf(i + 1);
      if (Math.abs(sh) < 1) {
        out.push(
          line(`${tag}${i}`, tx, L.itemBase + i * lineH, F, 500, fg, sh),
        );
      }
    });
    return out;
  };

  const nodes: React.ReactNode[] = [];
  if (cur > 0 && outP < 1) nodes.push(...entryNodes(cur - 1, () => -outP, "o"));
  nodes.push(...entryNodes(cur, (order) => 1 - inP(order), "i"));

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
