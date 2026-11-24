"use client";

import { loadFont } from "@remotion/google-fonts/Gloock";
import type React from "react";
import { useEffect, useState } from "react";
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
  DEFAULT_LINES,
  type FinePrintUpElementId,
  finePrintUpTimeline,
} from "./timeline";

const gloock = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export interface FinePrintUpProps {
  lines?: string[];
  closing?: string;
  /** Frames each word takes to travel from the fine print up to the headline. */
  travel?: number;
  accent?: string;
  /** Text color of the headline; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Gloock by default. */
  fontFamily?: string;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the fade-in, single lines and the closing, by
   * the ids in `./timeline`. Frames on the scene timeline, after `delay` and
   * `speed`.
   */
  timing?: Timing<FinePrintUpElementId>;
}

const THEMES = {
  dark: {
    bg: "#0A1230",
    ink: "#FFFFFF",
    muted: "rgba(255,255,255,0.58)",
    accent: "#FF4436",
  },
  light: {
    bg: "#F7F3EC",
    ink: "#14161F",
    muted: "rgba(20,22,31,0.6)",
    accent: "#D92B1E",
  },
} as const;

const TRACK = -0.02;
const LH = 1.08;
const FINE_LH = 1.3;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

let measureCtx: CanvasRenderingContext2D | null = null;

function em(s: string, family: string): number {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return s.length * 0.5;
  measureCtx.font = `400 100px "${family}"`;
  return measureCtx.measureText(s).width / 100 + TRACK * Array.from(s).length;
}

function useFontReady(fontFamily: string) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("fine-print-up: font"));
  useEffect(() => {
    let live = true;
    gloock
      .waitUntilDone()
      .then(() => document.fonts.load(`400 100px "${fontFamily}"`))
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setReady(true);
        continueRender(handle);
      });
    return () => {
      live = false;
    };
  }, [handle, fontFamily]);
  return ready;
}

interface Laid {
  words: { text: string; x: number; line: number }[];
  lines: number;
}

function wrapAt(
  words: string[],
  maxEm: number,
  family: string,
  indent = 0,
): Laid {
  const space = em(" ", family);
  const out: { text: string; x: number; line: number }[] = [];
  let line = 0;
  let x = indent;
  for (const w of words) {
    const ww = em(w, family);
    if (x > indent && x + ww > maxEm) {
      line += 1;
      x = indent;
    }
    out.push({ text: w, x, line });
    x += ww + space;
  }
  return { words: out, lines: line + 1 };
}

function balanced(words: string[], maxEm: number, family: string): Laid {
  const base = wrapAt(words, maxEm, family);
  let lo = Math.max(...words.map((w) => em(w, family)), 0.1);
  let hi = maxEm;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (wrapAt(words, mid, family).lines <= base.lines) hi = mid;
    else lo = mid;
  }
  return wrapAt(words, hi, family);
}

function fitSize(
  words: string[],
  boxW: number,
  boxH: number,
  maxF: number,
  family: string,
) {
  const widest = Math.max(...words.map((w) => em(w, family)), 0.1);
  let lo = 8;
  let hi = maxF;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const lay = wrapAt(words, boxW / mid, family);
    if (lay.lines * LH * mid <= boxH && widest * mid <= boxW) lo = mid;
    else hi = mid;
  }
  return lo;
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

export function FinePrintUp(props: FinePrintUpProps) {
  const {
    lines = DEFAULT_LINES,
    closing = "That’s all the fine print.",
    accent,
    ink,
    background,
    fontFamily = gloock.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const t = frame * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    finePrintUpTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontReady(fontFamily);

  if (!ready || lines.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = lines.length;
  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.08 : 0.07);
  const headTop = H * (portrait ? 0.1 : 0.11);
  const boxW = W * (portrait ? 0.84 : 0.78);
  const boxH = H * (portrait ? 0.42 : 0.56);
  const fs = H * (portrait ? 0.017 : 0.028);
  const fineW = W * (portrait ? 0.62 : 0.34);
  const fineX = W - mx - fineW;
  const fineBottom = H - H * (portrait ? 0.07 : 0.09);

  const words = lines.map((l) => l.split(/\s+/).filter(Boolean));
  const marks = lines.map((_, i) => "*".repeat(i + 1));
  const markW = em("***", fontFamily) + em(" ", fontFamily) * 0.6;
  const fineLays = words.map((ws) =>
    wrapAt(ws, fineW / fs - markW, fontFamily),
  );
  const fineHeights = fineLays.map((l) => l.lines * FINE_LH * fs);
  const fineGap = fs * 0.7;
  const fineTotal =
    fineHeights.reduce((a, b) => a + b, 0) + fineGap * Math.max(0, n - 1);
  const fineTops: number[] = [];
  let acc = fineBottom - fineTotal;
  for (let i = 0; i < n; i++) {
    fineTops.push(acc);
    acc += fineHeights[i] + fineGap;
  }

  const heads = words.map((ws) => {
    const F = fitSize(ws, boxW, boxH, H * (portrait ? 0.1 : 0.15), fontFamily);
    return { F, lay: balanced(ws, boxW / F, fontFamily) };
  });

  const lineEls = tl.lane("Lines");
  const introEl = tl.get("intro");
  const closeEl = tl.get("closing");

  const intro = interpolate(t, [introEl.start, introEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const nodes: React.ReactNode[] = [];
  const text = (
    key: string,
    s: string,
    x: number,
    y: number,
    size: number,
    renderSize: number,
    lh: number,
    color: string,
    opacity: number,
    moving: boolean,
  ) => {
    const k = size / renderSize;
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          fontFamily,
          fontWeight: 400,
          fontSize: renderSize,
          lineHeight: `${lh * renderSize}px`,
          letterSpacing: `${TRACK}em`,
          whiteSpace: "pre",
          color,
          opacity,
          transformOrigin: "0 0",
          transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${k.toFixed(4)})${glide(moving)}`,
        }}
      >
        {s}
      </div>
    );
  };

  lines.forEach((_, i) => {
    const el = lineEls[i];
    const s0 = el.start;
    const u = t - s0;
    const { F, lay } = heads[i];
    const fl = fineLays[i];
    const pick = interpolate(
      u,
      [el.beat("pick"), el.beat("picked")],
      [0, 1],
      CLAMP,
    );
    const exitAt = (tt: number) =>
      i < n - 1
        ? interpolate(
            tt,
            [lineEls[i + 1].start, lineEls[i + 1].start + el.beat("exit")],
            [0, 1],
            {
              ...CLAMP,
              easing: Easing.bezier(0.55, 0, 1, 0.45),
            },
          )
        : 0;
    const exit = exitAt(t);
    if (exit >= 1) return;

    const markOp =
      interpolate(u, [el.beat("markOut"), el.beat("markGone")], [1, 0], CLAMP) *
      intro;
    if (markOp > 0) {
      nodes.push(
        text(
          `m${i}`,
          marks[i],
          fineX,
          fineTops[i],
          fs,
          fs,
          FINE_LH,
          interpolateColors(pick, [0, 1], [c.muted, hi]),
          markOp,
          false,
        ),
      );
    }

    const count = lay.words.length;
    const stagger = Math.min(1.4, el.beat("spread") / Math.max(1, count));
    lay.words.forEach((hw, wi) => {
      const fw = fl.words[wi];
      const fx = fineX + (markW + fw.x) * fs;
      const fy = fineTops[i] + fw.line * FINE_LH * fs;
      const hx = mx + hw.x * F;
      const hy = headTop + hw.line * LH * F;
      const fyScaled = fy + (FINE_LH - LH) * fs * 0.5;
      const geometry = (tt: number) => {
        const mv = interpolate(
          tt - s0,
          [
            el.beat("lift") + wi * stagger,
            el.beat("lift") + wi * stagger + el.beat("travel"),
          ],
          [0, 1],
          { ...CLAMP, easing: EASE_IO },
        );
        return {
          move: mv,
          x: fx + (hx - fx) * mv,
          y: fyScaled + (hy - fyScaled) * mv - exitAt(tt) * F * 0.18,
          size: fs + (F - fs) * mv,
        };
      };
      const { move, x, y, size } = geometry(t);
      // The in-out ease creeps for a few frames at each end, still enough to
      // cross a pixel, so motion is read off the neighbouring frames.
      const moving = [geometry(t - 1), geometry(t + 1)].some(
        (o) =>
          Math.abs(o.x - x) > 1e-3 ||
          Math.abs(o.y - y) > 1e-3 ||
          Math.abs(o.size - size) > 1e-4,
      );
      const land = interpolate(move, [0.7, 1], [0, 1], CLAMP);
      const flyColor = interpolateColors(pick, [0, 1], [c.muted, hi]);
      const baseColor = interpolateColors(land, [0, 1], [flyColor, fg]);
      nodes.push(
        text(
          `w${i}-${wi}`,
          hw.text,
          x,
          y,
          size,
          F,
          LH,
          baseColor,
          intro * (1 - exit),
          moving,
        ),
      );
    });
  });

  const closeIn = interpolate(t, [closeEl.start, closeEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  if (closeIn > 0 && closing) {
    const cl = wrapAt(closing.split(/\s+/), fineW / fs, fontFamily);
    const ch = cl.lines * FINE_LH * fs;
    cl.words.forEach((w, wi) => {
      nodes.push(
        text(
          `c${wi}`,
          w.text,
          fineX + w.x * fs,
          fineBottom - ch + w.line * FINE_LH * fs + (1 - closeIn) * fs * 0.6,
          fs,
          fs,
          FINE_LH,
          c.muted,
          closeIn,
          midway(closeIn),
        ),
      );
    });
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
