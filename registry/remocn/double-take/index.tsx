"use client";

import { loadFont } from "@remotion/google-fonts/Outfit";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  DEFAULT_TEXT,
  type DoubleTakeElementId,
  doubleTakeTimeline,
} from "./timeline";

const outfit = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface DoubleTakeProps {
  text?: string;
  focus?: string;
  cue?: string;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Outfit by default. */
  fontFamily?: string;
  /** Frames between words as the line rises in. */
  stagger?: number;
  /** Frames the line rests at the end before it rewinds. */
  hold?: number;
  /** Size of the copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single words, the crawl, the cue, the rewind
   * and the focus, by the ids in `./timeline`. Frames on the scene timeline,
   * after `delay` and `speed`.
   */
  timing?: Timing<DoubleTakeElementId>;
}

const THEMES = {
  dark: { bg: "#2445E5", ink: "#FFFFFF", accent: "#FF8FB1" },
  light: { bg: "#FFFFFF", ink: "#2445E5", accent: "#E0457B" },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const MEASURE_PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_CRAWL = Easing.bezier(0.42, 0, 0.62, 1);
const EASE_REWIND = Easing.bezier(0.5, 0, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

let measureCtx: CanvasRenderingContext2D | null = null;

function ctx2d(family: string) {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("double-take: no 2d context");
  measureCtx.font = `${WGHT} ${MEASURE_PX}px "${family}"`;
  return measureCtx;
}

function em(s: string, family: string) {
  return (
    ctx2d(family).measureText(s).width / MEASURE_PX +
    TRACK * Array.from(s).length
  );
}

function useFontsReady(family: string) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("double-take: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      outfit.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${family}"`),
      document.fonts.load(`400 100px "${family}"`),
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

interface Layout {
  words: { text: string; x: number; w: number; focus: boolean }[];
  lineW: number;
  focusX0: number;
  focusX1: number;
  baseline: number;
  cap: number;
}

function buildLayout(text: string, focus: string, family: string): Layout {
  const tokens: { text: string; start: number; end: number }[] = [];
  const re = /\S+/g;
  let m = re.exec(text);
  while (m) {
    tokens.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    m = re.exec(text);
  }
  const needle = focus.trim().toLowerCase();
  let at = needle ? text.toLowerCase().indexOf(needle) : -1;
  let end = at + needle.length;
  if (at < 0) {
    const last = tokens[tokens.length - 1];
    at = last ? last.start : 0;
    end = last ? last.end : 0;
  }
  const space = em(" ", family);
  let x = 0;
  const words = tokens.map((tk) => {
    const w = em(tk.text, family);
    const out = {
      text: tk.text,
      x,
      w,
      focus: tk.end > at && tk.start < end,
    };
    x += w + space;
    return out;
  });
  const lineW = em(tokens.map((tk) => tk.text).join(" "), family);
  const fw = words.filter((w) => w.focus);
  const focusX0 = fw.length ? fw[0].x : 0;
  const focusX1 = fw.length ? fw[fw.length - 1].x + fw[fw.length - 1].w : 0;

  const c = ctx2d(family);
  const fm = c.measureText("Hxg");
  const asc = fm.fontBoundingBoxAscent / MEASURE_PX;
  const desc = fm.fontBoundingBoxDescent / MEASURE_PX;
  const cap = c.measureText("H").actualBoundingBoxAscent / MEASURE_PX;
  const baseline = (1 - asc - desc) / 2 + asc;
  return { words, lineW, focusX0, focusX1, baseline, cap };
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

export function DoubleTake(props: DoubleTakeProps) {
  const {
    text = DEFAULT_TEXT,
    focus = "One person",
    cue = "Read that again.",
    accent,
    ink,
    background,
    fontFamily = outfit.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    doubleTakeTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady(fontFamily);

  const layout = useMemo(
    () => (ready ? buildLayout(text, focus, fontFamily) : null),
    [ready, text, focus, fontFamily],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const F = portrait ? W * 0.3 : H * 0.34;
  const mx = W * (portrait ? 0.08 : 0.07);
  const my = H * (portrait ? 0.07 : 0.1);
  const { words, lineW, focusX0, focusX1, baseline, cap } = layout;

  const crawlEl = tl.get("crawl");
  const cueEl = tl.get("cue");
  const rewind = tl.get("rewind");
  const focusEl = tl.get("focus");
  const rewindAt = rewind.start;
  const landAt = rewind.end;
  const t = frame * speed;

  const startLeft = mx;
  const endLeft = Math.min(mx, W - mx - lineW * F);
  const crawl = interpolate(t, [crawlEl.start, crawlEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_CRAWL,
  });
  const left = startLeft + (endLeft - startLeft) * crawl;
  const centreAtStop = (W / 2 - endLeft) / F;

  const focusW = focusX1 - focusX0;
  const sF = Math.max(0.4, Math.min(1.25, (W * 0.84) / (focusW * F)));
  const r = interpolate(t, [rewindAt, landAt], [0, 1], {
    ...CLAMP,
    easing: EASE_REWIND,
  });
  const zoomAt = (tt: number) =>
    Math.exp(
      Math.log(sF) *
        interpolate(tt, [rewindAt + rewind.beat("zoom"), landAt], [0, 1], {
          ...CLAMP,
          easing: Easing.bezier(0.45, 0, 0.2, 1),
        }),
    );
  const s = zoomAt(t);
  // The zoom eases in and out slowly, so its tail still moves the far words
  // across pixels: compare the scale with the neighbouring frames, weighed by
  // the frame height.
  // One composition frame, on the scene timeline.
  const dt = speed;
  const zooming =
    Math.abs(zoomAt(t + dt) - s) * H > 1e-3 ||
    Math.abs(s - zoomAt(t - dt)) * H > 1e-3;
  const focusCentre = (focusX0 + focusX1) / 2;

  const rewinding = t >= rewindAt;
  const fx = rewinding
    ? centreAtStop + (focusCentre - centreAtStop) * r
    : (W / 2 - left) / F;

  const stripY = H * (portrait ? 0.52 : 0.55);
  const lineTop = stripY + (cap / 2 - baseline) * F;

  const tint = interpolate(
    t,
    [focusEl.start, focusEl.start + focusEl.beat("tint")],
    [0, 1],
    CLAMP,
  );
  const clear = interpolate(
    t,
    [focusEl.start + focusEl.beat("fade"), focusEl.end],
    [1, 0],
    {
      ...CLAMP,
      easing: Easing.bezier(0.4, 0, 0.6, 1),
    },
  );
  const focusColor = interpolateColors(tint, [0, 1], [fg, hi]);

  const cueF = Math.max(16, (portrait ? W : H) * 0.07);
  const cueIn = interpolate(t, [cueEl.start, cueEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const clipTop = (baseline - 1.0) * F;
  const clipH = 1.3 * F;
  const fade = (mx * 0.9).toFixed(1);
  const edgeMask = `linear-gradient(90deg, transparent 0px, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        {cue ? (
          <div
            style={{
              position: "absolute",
              left: mx,
              top: my - (baseline - cap) * cueF,
              height: cueF * 1.3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 400,
                fontSize: cueF,
                lineHeight: `${cueF}px`,
                letterSpacing: "-0.015em",
                whiteSpace: "pre",
                color: fg,
                transform: `translateY(${((1 - cueIn) * 1.2 * cueF).toFixed(2)}px)${glide(midway(cueIn))}`,
              }}
            >
              {cue}
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            maskImage: edgeMask,
            WebkitMaskImage: edgeMask,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              // The tilt pivots on the strip's centre, which is on screen.
              transform: `translate(${(W / 2).toFixed(2)}px, ${stripY.toFixed(2)}px)${glide(zooming)} scale(${s.toFixed(5)}) translate(${(-fx * F).toFixed(2)}px, ${(-stripY).toFixed(2)}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -0.2 * F,
                top: lineTop + clipTop,
                width: (lineW + 0.6) * F,
                height: clipH,
                overflow: "hidden",
              }}
            >
              {words.map((w, i) => {
                const word = tl.get(`word:${i}`);
                const riseAt = (tt: number) =>
                  (
                    (1 -
                      interpolate(tt, [word.start, word.end], [0, 1], {
                        ...CLAMP,
                        easing: EASE_OUT,
                      })) *
                    1.15 *
                    F
                  ).toFixed(2);
                const rise = riseAt(t);
                // The ease-out tail still moves a word this tall by a tenth
                // of a pixel after its progress reads as done: the tilt runs
                // for as long as the printed offset changes.
                const rising =
                  riseAt(t + dt) !== rise || riseAt(t - dt) !== rise;
                return (
                  <div
                    key={`${i}-${w.text}`}
                    style={{
                      position: "absolute",
                      left: (w.x + 0.2) * F,
                      top: -clipTop,
                      height: F,
                      fontFamily,
                      fontWeight: WGHT,
                      fontSize: F,
                      lineHeight: `${F}px`,
                      letterSpacing: `${TRACK}em`,
                      whiteSpace: "pre",
                      color: w.focus ? focusColor : fg,
                      opacity: w.focus ? 1 : clear,
                      transform: `translateY(${rise}px)${glide(rising && !zooming)}`,
                    }}
                  >
                    {w.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
