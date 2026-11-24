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
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_LABELS,
  DEFAULT_LINE,
  type PitchBlanksElementId,
  parse,
  pitchBlanksTimeline,
} from "./timeline";

const bitter = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PitchBlanksProps {
  line?: string;
  labels?: string[];
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the line. Load it yourself; Bitter by default. */
  fontFamily?: string;
  /** Frame the first blank fills in. */
  firstFill?: number;
  /** Frames between one blank filling and the next. */
  fillGap?: number;
  /** Size of the line, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single words, blanks and fills, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<PitchBlanksElementId>;
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

const TRACK = -0.025;
const LABEL_TRACK = 0.12;
const LABEL_SCALE = 0.2;
const BOX = 1.15;
const PITCH = 1.72;
const RULE_Y = 1.02;

const midway = (q: number) => q > 5e-4 && q < 1 - 5e-4;

function useFontsReady(family: string) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("pitch-blanks: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      bitter.waitUntilDone(),
      document.fonts.load(`400 100px "${family}"`),
      document.fonts.load(`500 100px "${family}"`),
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
  }, [handle, family]);
  return ready;
}

function useMeasure(family: string) {
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const cache = useRef(new Map<string, number>());
  return (text: string, weight: 400 | 500, track: number) => {
    const key = `${family}\u0001${weight}\u0001${track}\u0001${text}`;
    const hit = cache.current.get(key);
    if (hit !== undefined) return hit;
    if (!ctx.current)
      ctx.current = document.createElement("canvas").getContext("2d");
    let w = text.length * 0.5;
    if (ctx.current) {
      ctx.current.font = `${weight} 100px "${family}"`;
      w = ctx.current.measureText(text).width / 100;
    }
    const em = w + track * Array.from(text).length;
    cache.current.set(key, em);
    return em;
  };
}

function breakLines(
  widths: number[],
  attach: boolean[],
  space: number,
  max: number,
) {
  const starts = [0];
  let x = 0;
  for (let i = 0; i < widths.length; i++) {
    const gap = i === starts[starts.length - 1] || attach[i] ? 0 : space;
    if (
      i > starts[starts.length - 1] &&
      !attach[i] &&
      x + gap + widths[i] > max
    ) {
      let s = i;
      while (s > starts[starts.length - 1] + 1 && attach[s]) s--;
      starts.push(s);
      x = 0;
      for (let k = s; k <= i; k++)
        x += (k === s || attach[k] ? 0 : space) + widths[k];
    } else {
      x += gap + widths[i];
    }
  }
  return starts;
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

export function PitchBlanks(props: PitchBlanksProps) {
  const {
    line = DEFAULT_LINE,
    labels = DEFAULT_LABELS,
    accent,
    ink,
    background,
    fontFamily = bitter.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  // The pace is counted from the clip without `speed`, as before.
  const tl = useTimeline(pitchBlanksTimeline, props, durationInFrames, timing);
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

  const { toks } = parse(line, labels);
  let wordCount = 0;
  const intros = toks.map((tk) =>
    tk.blank < 0 ? tl.get(`word:${wordCount++}`) : tl.get(`blank:${tk.blank}`),
  );

  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.08 : 0.075);
  const maxW = W - mx * 2;

  const space = measure(" ", 400, TRACK);
  const fullW = toks.map((tk) =>
    measure(tk.text, tk.blank >= 0 ? 500 : 400, TRACK),
  );
  const labelW = toks.map((tk) =>
    tk.blank >= 0
      ? measure(tk.label.toUpperCase(), 400, LABEL_TRACK) * LABEL_SCALE
      : 0,
  );
  const emptyW = toks.map((tk, i) =>
    tk.blank >= 0 ? Math.max(1.9, labelW[i] + 0.7) : 0,
  );
  const slotW = toks.map((tk, i) =>
    tk.blank >= 0 ? Math.max(fullW[i], emptyW[i]) : fullW[i],
  );
  const attach = toks.map((tk) => tk.attach);

  const fit = (maxLines: number) => {
    let size = portrait ? W * 0.13 : H * 0.135;
    let br = breakLines(slotW, attach, space, maxW / size);
    for (let k = 0; k < 60; k++) {
      const widest = Math.max(...slotW) * size;
      const tall = br.length * PITCH * size;
      if (br.length <= maxLines && widest <= maxW && tall <= H * 0.8) break;
      size *= 0.96;
      br = breakLines(slotW, attach, space, maxW / size);
    }
    return { size, br };
  };
  let fitted = fit(portrait ? 6 : 2);
  if (!portrait && fitted.size < H * 0.085) fitted = fit(3);
  const Fs = fitted.size;
  let starts = fitted.br;
  if (starts.length > 1) {
    let best = starts;
    const count = starts.length;
    for (let k = 1; k <= 30; k++) {
      const next = breakLines(
        slotW,
        attach,
        space,
        (maxW / Fs) * (1 - k * 0.015),
      );
      if (next.length !== count) break;
      best = next;
    }
    starts = best;
  }
  const lineOf = toks.map((_, i) => {
    let l = 0;
    while (l + 1 < starts.length && starts[l + 1] <= i) l++;
    return l;
  });

  const fillP = (b: number, tt = t) => {
    const e = tl.get(`fill:${b}`);
    return interpolate(tt, [e.start, e.start + e.beat("fill")], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  };
  const wordP = (b: number) => {
    const e = tl.get(`fill:${b}`);
    return interpolate(t, [e.start + e.beat("word"), e.end], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };

  const widthsAt = (tt: number) =>
    toks.map((tk, i) =>
      tk.blank >= 0
        ? emptyW[i] + (fullW[i] - emptyW[i]) * fillP(tk.blank, tt)
        : fullW[i],
    );
  const xsAt = (widths: number[]) => {
    const out: number[] = [];
    let x = 0;
    toks.forEach((tk, i) => {
      if (i === starts[lineOf[i]]) x = 0;
      else if (!tk.attach) x += space;
      out.push(x);
      x += widths[i];
    });
    return out;
  };
  const curW = widthsAt(t);
  const xs = xsAt(curW);
  // A blank that fills pushes the rest of its line along by `left`, and
  // layout rounds a rule's edges to whole pixels, so a pushed rule stepped in
  // uneven pixels. While it is pushed it is laid out where the line ends up
  // and the push is a transform; standing still it keeps its plain layout.
  // One composition frame, on the scene timeline.
  const dt = speed;
  const xsNext = xsAt(widthsAt(t + dt));
  const xsPrev = xsAt(widthsAt(t - dt));
  const xsEnd = xsAt(widthsAt(1e9));

  const pitch = PITCH * Fs;
  const blockH = (starts.length - 1) * pitch + BOX * Fs + Fs * 0.5;
  const top0 = H / 2 - blockH / 2;
  const Fl = Math.max(11, Fs * LABEL_SCALE);
  const ruleH = Math.max(2, Fs * 0.03);

  const intro = (i: number) =>
    interpolate(t, [intros[i].start, intros[i].end], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

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
        {toks.map((tk, i) => {
          const left = mx + xs[i] * Fs;
          const top = top0 + lineOf[i] * pitch;
          const w = curW[i] * Fs;
          if (tk.blank < 0) {
            const p = intro(i);
            return (
              <div
                key={`w${i}`}
                style={{
                  position: "absolute",
                  left,
                  top,
                  height: BOX * Fs,
                  lineHeight: `${BOX * Fs}px`,
                  fontSize: Fs,
                  letterSpacing: `${TRACK}em`,
                  whiteSpace: "pre",
                  opacity: p,
                  transform: `translateY(${((1 - p) * Fs * 0.3).toFixed(2)}px)${glide(midway(p))}`,
                }}
              >
                {tk.text}
              </div>
            );
          }
          const blank = intros[i];
          const draw = interpolate(
            t,
            [blank.start, blank.start + blank.beat("draw")],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          const lab = interpolate(
            t,
            [blank.start + blank.beat("label"), blank.end],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          const f = fillP(tk.blank);
          const wp = wordP(tk.blank);
          const pushed =
            Math.abs(xsNext[i] - xs[i]) * Fs > 1e-3 ||
            Math.abs(xs[i] - xsPrev[i]) * Fs > 1e-3;
          const ruleLeft = pushed ? mx + xsEnd[i] * Fs : left;
          return (
            <div key={`b${i}`}>
              <div
                style={{
                  position: "absolute",
                  left: ruleLeft,
                  top: top + RULE_Y * Fs,
                  width: w,
                  height: ruleH,
                  background: interpolateColors(f, [0, 1], [fg, hi]),
                  opacity: 0.4 + 0.6 * f,
                  transform: `${pushed ? `translateX(${left - ruleLeft}px) ` : ""}scaleX(${draw.toFixed(4)})`,
                  transformOrigin: "0 50%",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left,
                  top,
                  height: BOX * Fs,
                  lineHeight: `${BOX * Fs}px`,
                  fontSize: Fs,
                  fontWeight: 500,
                  letterSpacing: `${TRACK}em`,
                  whiteSpace: "pre",
                  opacity: wp,
                  transform: `translateY(${((1 - wp) * Fs * 0.42).toFixed(2)}px)${glide(midway(wp))}`,
                }}
              >
                {tk.text}
              </div>
              <div
                style={{
                  position: "absolute",
                  left,
                  width: w,
                  top: top + RULE_Y * Fs + ruleH + Fs * 0.1,
                  fontSize: Fl,
                  lineHeight: 1.2,
                  letterSpacing: `${LABEL_TRACK}em`,
                  textTransform: "uppercase",
                  textAlign: "center",
                  whiteSpace: "pre",
                  color: interpolateColors(f, [0, 1], [fg, hi]),
                  opacity: lab * (0.55 + 0.35 * f),
                }}
              >
                {tk.label}
              </div>
            </div>
          );
        })}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
