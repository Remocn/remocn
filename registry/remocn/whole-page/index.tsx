"use client";

import { loadFont } from "@remotion/google-fonts/Gloock";
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
  DEFAULT_BELIEFS,
  type WholePageElementId,
  wholePageTimeline,
} from "./timeline";

const gloock = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export interface WholePageProps {
  beliefs?: string[];
  title?: string;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Gloock by default. */
  fontFamily?: string;
  /** Frames the whole page holds at the end. */
  hold?: number;
  /** Frames of the final pull back to the whole page. */
  pull?: number;
  /** Size of the page, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the intro, each belief and the pull back, by
   * the ids in `./timeline`. Frames on the scene timeline, after `delay` and
   * `speed`.
   */
  timing?: Timing<WholePageElementId>;
}

const THEMES = {
  dark: { bg: "#0A1230", ink: "#FFFFFF", accent: "#FF4436" },
  light: { bg: "#F7F3EC", ink: "#14161F", accent: "#D92B1E" },
} as const;

const TRACK = -0.02;
const LH = 1.12;
const DIM = 0;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

let measureCtx: CanvasRenderingContext2D | null = null;

function em(s: string, fontFamily: string): number {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return s.length * 0.5;
  measureCtx.font = `400 100px "${fontFamily}"`;
  return measureCtx.measureText(s).width / 100 + TRACK * Array.from(s).length;
}

function useFontReady(fontFamily: string) {
  const [ready, setReady] = useState<string | null>(null);
  const [handle] = useState(() => delayRender("whole-page: font"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    gloock
      .waitUntilDone()
      .then(() => document.fonts.load(`400 100px "${fontFamily}"`))
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setReady(fontFamily);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle, fontFamily]);
  return ready !== null;
}

interface Laid {
  words: { text: string; x: number; line: number }[];
  lines: number;
}

function wrapAt(
  words: string[],
  widths: number[],
  maxEm: number,
  fontFamily: string,
): Laid {
  const space = em(" ", fontFamily);
  const out: { text: string; x: number; line: number }[] = [];
  let line = 0;
  let x = 0;
  words.forEach((w, i) => {
    if (x > 0 && x + widths[i] > maxEm) {
      line += 1;
      x = 0;
    }
    out.push({ text: w, x, line });
    x += widths[i] + space;
  });
  return { words: out, lines: line + 1 };
}

function balanced(text: string, maxEm: number, fontFamily: string): Laid {
  const words = text.split(/\s+/).filter(Boolean);
  const widths = words.map((w) => em(w, fontFamily));
  const base = wrapAt(words, widths, maxEm, fontFamily);
  let lo = Math.max(...widths, 0.1);
  let hi = maxEm;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (wrapAt(words, widths, mid, fontFamily).lines <= base.lines) hi = mid;
    else lo = mid;
  }
  return wrapAt(words, widths, hi, fontFamily);
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

export function WholePage(props: WholePageProps) {
  const {
    beliefs = DEFAULT_BELIEFS,
    title = "What we believe",
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
  // The beliefs are fitted to what is left of the scene after `delay`.
  const tl = useTimeline(
    wholePageTimeline,
    props,
    Math.max(0, durationInFrames - delay) * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontReady(fontFamily);

  if (!ready || beliefs.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = beliefs.length;
  const portrait = H > W * 1.1;
  const cols = Math.min(n, portrait ? 2 : 3);
  const rows = Math.ceil(n / cols);
  const mx = W * (portrait ? 0.08 : 0.07);
  const top = H * (portrait ? 0.08 : 0.1);
  const Ft = H * (portrait ? 0.022 : 0.04);
  const gridTop = title ? top + Ft * 2.6 : top;
  const gutter = W * (portrait ? 0.06 : 0.04);
  const colW = (W - mx * 2 - gutter * (cols - 1)) / cols;
  const gridH = H * (portrait ? 0.9 : 0.9) - gridTop;

  const layoutAt = (F: number) => {
    const lays = beliefs.map((b) => balanced(b, colW / F, fontFamily));
    const rowLines = Array.from({ length: rows }, (_, r) =>
      Math.max(...lays.slice(r * cols, r * cols + cols).map((l) => l.lines), 1),
    );
    const total =
      rowLines.reduce((s, l) => s + l * LH * F, 0) + (rows - 1) * F * 1.1;
    return { lays, rowLines, total };
  };

  const widestWord = Math.max(
    ...beliefs.flatMap((b) => b.split(/\s+/).map((w) => em(w, fontFamily))),
  );
  const fits = (F: number) =>
    layoutAt(F).total <= gridH && widestWord * F <= colW;
  const orphaned = (F: number) =>
    layoutAt(F).lays.some(
      (l) =>
        l.lines > 1 && l.words.filter((w) => w.line === l.lines - 1).length < 2,
    );
  let Fp = 0;
  let firstFit = 0;
  for (let F = H * 0.12; F > 6 && Fp === 0; F *= 0.985) {
    if (!fits(F)) continue;
    if (firstFit === 0) firstFit = F;
    if (!orphaned(F) || F < firstFit * 0.9) Fp = F;
  }
  if (Fp === 0) Fp = firstFit || 6;
  const { lays, rowLines } = layoutAt(Fp);
  const rowTop: number[] = [];
  let acc = gridTop;
  for (let r = 0; r < rows; r++) {
    rowTop.push(acc);
    acc += rowLines[r] * LH * Fp + Fp * 1.1;
  }
  const slack = portrait ? Math.max(0, (H * 0.9 - (acc - Fp * 1.1)) / 2) : 0;
  const paras = lays.map((l, i) => ({
    x: mx + (i % cols) * (colW + gutter),
    y: rowTop[Math.floor(i / cols)] + slack,
    h: l.lines * LH * Fp,
    lay: l,
  }));
  const zoomOf = paras.map((p) => {
    const lineW = Math.max(
      ...p.lay.words.map((w) => w.x + em(w.text, fontFamily)),
      0.1,
    );
    return Math.max(
      1,
      Math.min(
        (W - mx * 2) / (lineW * Fp),
        (H * (portrait ? 0.6 : 0.78)) / p.h,
        (H * (portrait ? 0.1 : 0.16)) / Fp,
      ),
    );
  });
  const ax = mx;
  const ay = H * (portrait ? 0.1 : 0.1);

  const belief = (i: number) => tl.get(`belief:${i}`);
  const pullEl = tl.get("pull");
  const introEl = tl.get("intro");

  const pullOf = (tt: number) =>
    interpolate(tt, [pullEl.start, pullEl.end], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  const cameraAt = (tt: number) => {
    let qx = paras[0].x;
    let qy = paras[0].y;
    let S = zoomOf[0];
    for (let i = 1; i < n; i++) {
      const bi = belief(i);
      const p = interpolate(tt, [bi.start - bi.beat("pan"), bi.start], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      if (p > 0) {
        qx = paras[i - 1].x + (paras[i].x - paras[i - 1].x) * p;
        qy = paras[i - 1].y + (paras[i].y - paras[i - 1].y) * p;
        S = zoomOf[i - 1] * (zoomOf[i] / zoomOf[i - 1]) ** p;
      }
    }
    const z = S ** (1 - pullOf(tt));
    const zp = (S - z) / Math.max(0.0001, S - 1);
    const cx = qx + (ax - qx) * zp;
    const cy = qy + (ay - qy) * zp;
    return `translate(${(ax - cx * z).toFixed(2)}px, ${(ay - cy * z).toFixed(2)}px) scale(${z.toFixed(5)})`;
  };
  const pull = pullOf(t);
  const camera = cameraAt(t);
  const cameraMoving =
    cameraAt(t + speed) !== camera || cameraAt(t - speed) !== camera;

  const intro = interpolate(t, [introEl.start, introEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settle = interpolate(pull, [0.35, 1], [0, 1], CLAMP);

  const nodes: React.ReactNode[] = [];
  paras.forEach((para, i) => {
    const own = belief(i);
    const arrive = own.start;
    const pan = own.beat("pan");
    const next = i < n - 1 ? belief(i + 1) : null;
    const leaveAt = next ? next.start - next.beat("pan") : 0;
    const leave = next
      ? interpolate(t, [leaveAt, leaveAt + next.beat("pan") * 0.55], [0, 1], {
          ...CLAMP,
          easing: Easing.bezier(0.55, 0, 1, 0.45),
        })
      : 0;
    const isLast = i === n - 1;
    const wordsN = para.lay.words.length;
    const stagger = Math.min(1.6, 14 / Math.max(1, wordsN));
    para.lay.words.forEach((w, wi) => {
      const on = interpolate(
        t,
        [
          arrive - pan * 0.5 + wi * stagger,
          arrive - pan * 0.5 + own.beat("word") + wi * stagger,
        ],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const focus = on * (1 - leave);
      const read =
        t >= arrive - pan * 0.5 + own.beat("word") + wi * stagger ? 1 : 0;
      const base = DIM + (1 - DIM) * focus;
      const finalOp = read ? 1 : DIM;
      const opacity = (base + (finalOp - base) * settle) * intro;
      const color = isLast
        ? interpolateColors(Math.max(focus, settle * read), [0, 1], [fg, hi])
        : fg;
      // The first paragraph rises in by transform, not `top`: layout rounds a
      // baseline to whole pixels, so words eased by `top` click into place.
      const rise = i === 0 ? (1 - intro) * Fp * 0.3 : 0;
      nodes.push(
        <div
          key={`p${i}w${wi}`}
          style={{
            position: "absolute",
            left: para.x + w.x * Fp,
            top: para.y + w.line * LH * Fp,
            fontFamily,
            fontWeight: 400,
            fontSize: Fp,
            lineHeight: `${LH * Fp}px`,
            letterSpacing: `${TRACK}em`,
            whiteSpace: "pre",
            color,
            opacity,
            transform:
              i === 0
                ? `translateY(${rise > 1e-3 ? rise : 0}px)${glide(intro > 0 && intro < 1)}`
                : undefined,
          }}
        >
          {w.text}
        </div>,
      );
    });
  });

  const titleOp = interpolate(pull, [0.4, 1], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transformOrigin: "0 0",
            transform: `${camera}${glide(cameraMoving)}`,
          }}
        >
          {title ? (
            <div
              style={{
                position: "absolute",
                left: mx,
                top: top + slack,
                fontFamily,
                fontWeight: 400,
                fontSize: Ft,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                whiteSpace: "pre",
                color: fg,
                opacity: 0.6 * titleOp,
              }}
            >
              {title}
            </div>
          ) : null}
          {nodes}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
