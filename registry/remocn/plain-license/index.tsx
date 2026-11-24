"use client";

import { loadFont } from "@remotion/google-fonts/BigShoulders";
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
  clausesOf,
  DEFAULT_CLAUSES,
  type PlainLicenseClause,
  type PlainLicenseElementId,
  plainLicenseTimeline,
  splitWords,
} from "./timeline";

const shoulders = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export type { PlainLicenseClause };

export interface PlainLicenseProps {
  clauses?: PlainLicenseClause[];
  highlight?: number;
  step?: number;
  /** Frames between words of a plain rewrite as they rise in. */
  stagger?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the text. Load it yourself; Big Shoulders by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the legal text rising, and per clause its
   * mark, drop, reflow, single words of the rewrite and the cool-down, and
   * the final zoom, by the ids in `./timeline`. Frames on the scene
   * timeline, after `delay` and `speed`.
   */
  timing?: Timing<PlainLicenseElementId>;
}

const THEMES = {
  dark: { bg: "#26231F", ink: "#F6F0E6", accent: "#2BD96B" },
  light: { bg: "#F5F5F2", ink: "#000000", accent: "#0E9F4B" },
} as const;

const WGHT = 500;
const PX = 200;
const LEAD = 1.04;
const LEGAL_ALPHA = 0.5;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Token {
  id: string;
  text: string;
  clause: number;
  plain: boolean;
}

interface Metrics {
  w: Record<string, number>;
  space: number;
  asc: number;
  desc: number;
  cap: number;
}

function measureAll(texts: string[], family: string, weight: number): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("plain-license: no 2d context");
  ctx.font = `${weight} ${PX}px "${family}"`;
  const w: Record<string, number> = {};
  for (const s of texts) w[s] = ctx.measureText(s).width / PX;
  const fm = ctx.measureText("Hgp");
  const h = ctx.measureText("H");
  return {
    w,
    space: ctx.measureText(" ").width / PX,
    asc: fm.fontBoundingBoxAscent / PX,
    desc: fm.fontBoundingBoxDescent / PX,
    cap: h.actualBoundingBoxAscent / PX,
  };
}

function useMetrics(texts: string[], family: string, weight: number) {
  const key = [family, weight, ...texts].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("plain-license: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      shoulders.waitUntilDone(),
      document.fonts.load(`${weight} 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measureAll(key.split("\u0001").slice(2), family, weight),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, family, weight]);
  return state && state.key === key ? state.m : null;
}

interface Block {
  rows: { tokens: Token[]; xs: number[] }[];
  maxW: number;
}

function wrapBlock(tokens: Token[], m: Metrics, s: number, boxW: number) {
  const rows: { tokens: Token[]; xs: number[] }[] = [];
  let cur: Token[] = [];
  let xs: number[] = [];
  let x = 0;
  let maxW = 0;
  for (const tk of tokens) {
    const tw = m.w[tk.text] * s;
    const nx = cur.length === 0 ? 0 : x + m.space * s;
    if (cur.length > 0 && nx + tw > boxW) {
      rows.push({ tokens: cur, xs });
      maxW = Math.max(maxW, x);
      cur = [tk];
      xs = [0];
      x = tw;
    } else {
      cur.push(tk);
      xs.push(nx);
      x = nx + tw;
    }
  }
  if (cur.length > 0) {
    rows.push({ tokens: cur, xs });
    maxW = Math.max(maxW, x);
  }
  return { rows, maxW };
}

function fitSize(blocks: Token[][], m: Metrics, boxW: number, boxH: number) {
  let lo = 4;
  let hi = 400;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    let rows = 0;
    let fits = true;
    for (const b of blocks) {
      for (const tk of b) if (m.w[tk.text] * mid > boxW) fits = false;
      rows += wrapBlock(b, m, mid, boxW).rows.length;
    }
    const h = (m.cap + (rows - 1) * LEAD + 0.24) * mid;
    if (fits && h <= boxH) lo = mid;
    else hi = mid;
  }
  return lo;
}

const midway = (p: number) => p > 0 && p < 1;

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

export function PlainLicense(props: PlainLicenseProps) {
  const {
    clauses = DEFAULT_CLAUSES,
    highlight = 0,
    accent,
    ink,
    background,
    fontFamily = shoulders.fontFamily,
    fontWeight = WGHT,
    scale: layerScale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  // The pace that fits the schedule into the clip counts the clip after
  // `delay`, without `speed`, as before.
  const tl = useTimeline(
    plainLicenseTimeline,
    props,
    durationInFrames - delay,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = clausesOf(clauses);
  const n = list.length;
  const t = frame * speed;

  const legal: Token[][] = list.map((cl, i) =>
    splitWords(cl.legal).map((text, j) => ({
      id: `L${i}-${j}`,
      text,
      clause: i,
      plain: false,
    })),
  );
  const plain: Token[][] = list.map((cl, i) =>
    splitWords(cl.plain).map((text, j) => ({
      id: `P${i}-${j}`,
      text,
      clause: i,
      plain: true,
    })),
  );

  const texts = [...legal.flat(), ...plain.flat()].map((tk) => tk.text);
  const m = useMetrics(texts, fontFamily, fontWeight);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.065);
  const marginY = H * (portrait ? 0.08 : 0.1);
  const boxW = W - marginX * 2;
  const boxH = H * (portrait ? 0.62 : 1) - marginY * 2;
  const maxS = H * (portrait ? 0.12 : 0.3);

  const s0 = Math.min(fitSize(legal, m, boxW, boxH), maxS);
  const legalB: Block[] = legal.map((b) => wrapBlock(b, m, s0, boxW));
  const plainB: Block[] = plain.map((b) => wrapBlock(b, m, s0, boxW));
  const rowH = LEAD * s0;

  const blockAt = (k: number, i: number) => (i < k ? plainB[i] : legalB[i]);
  const tops: number[][] = [];
  const scales: number[] = [];
  for (let k = 0; k <= n; k++) {
    const row: number[] = [];
    let y = 0;
    let maxW = 0;
    for (let i = 0; i < n; i++) {
      row.push(y);
      const b = blockAt(k, i);
      y += b.rows.length * rowH;
      maxW = Math.max(maxW, b.maxW);
    }
    tops.push(row);
    const h = y - rowH + (m.cap + 0.24) * s0;
    scales.push(Math.max(1, Math.min(boxW / maxW, boxH / h, maxS / s0)));
  }

  const moveEls = Array.from({ length: n }, (_, k) => tl.get(`move:${k}`));
  const moveP = (k: number, tt = t) =>
    interpolate(tt, [moveEls[k].start, moveEls[k].end], [0, 1], {
      ...CLAMP,
      easing: EASE_MOVE,
    });
  const lerpState = (get: (k: number) => number, tt = t) => {
    let v = get(0);
    for (let k = 0; k < n; k++) {
      const p = moveP(k, tt);
      if (p <= 0) break;
      v = get(k) + (get(k + 1) - get(k)) * p;
    }
    return v;
  };
  // A block is laid out where it finally rests and reaches each earlier
  // place by a transform: layout rounds a baseline to whole pixels, so text
  // eased by `top` clicks along, and text handed from a transform back to
  // layout jumps by the rounding. The travel is exactly 0 once the last move
  // lands, so the final frame is drawn as it always was.
  const stateAnchor = (get: (k: number) => number) => {
    const at = get(n);
    let travel = get(0) - at;
    for (let k = 0; k < n; k++) {
      const p = moveP(k);
      if (p <= 0) break;
      travel = get(k + 1) - at + (get(k) - get(k + 1)) * (1 - p);
    }
    return { at, travel };
  };
  const reflowing = Array.from({ length: n }, (_, k) => moveP(k)).some(midway);
  const zoomEl = tl.get("zoom");
  const introEl = tl.get("intro");
  const scaleAt = (tt: number) => {
    const zoomP = interpolate(tt, [zoomEl.start, zoomEl.end], [0, 1], {
      ...CLAMP,
      easing: EASE_MOVE,
    });
    const preZoom = lerpState((k) => (k === n ? scales[n - 1] : scales[k]), tt);
    return preZoom + (scales[n] - preZoom) * zoomP;
  };
  const scale = scaleAt(t);
  // The box scales from its top-left corner; a step of 1e-6 moves its far
  // corner, ~1100px out, by a millipixel.
  const zooming =
    Math.abs(scaleAt(t + 1) - scale) > 1e-6 ||
    Math.abs(scale - scaleAt(t - 1)) > 1e-6;

  const boxTop = (base: number) =>
    base - ((1 - m.asc - m.desc) / 2 + m.asc) * s0;

  const mix = (a: string, b: string, p: number) =>
    p <= 0
      ? a
      : p >= 1
        ? b
        : `color-mix(in oklab, ${b} ${(p * 100).toFixed(1)}%, ${a})`;

  const word = (
    key: string,
    text: string,
    x: number,
    base: number,
    color: string,
    opacity: number,
    dy: number,
    moving: boolean,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: boxTop(base),
        height: s0,
        lineHeight: `${s0}px`,
        fontSize: s0,
        fontFamily,
        fontWeight,
        whiteSpace: "pre",
        color,
        opacity,
        transform: `translateY(${dy.toFixed(2)}px)${glide(moving && !zooming)}`,
      }}
    >
      {text}
    </div>
  );

  const nodes: React.ReactNode[] = [];
  let rowIndex = 0;
  for (let i = 0; i < n; i++) {
    const markEl = tl.get(`mark:${i}`);
    const outEl = tl.get(`out:${i}`);
    const { at: top, travel } = stateAnchor((k) => tops[k][i]);
    const mark = interpolate(t, [markEl.start, markEl.end], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const out = interpolate(t, [outEl.start, outEl.end], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    if (out < 1) {
      legalB[i].rows.forEach((row, r) => {
        const ri = rowIndex++;
        const p = interpolate(
          t,
          [
            introEl.start + ri * introEl.beat("row"),
            introEl.end + ri * introEl.beat("row"),
          ],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_OUT,
          },
        );
        const base = top + m.cap * s0 + r * rowH;
        row.tokens.forEach((tk, j) => {
          nodes.push(
            word(
              tk.id,
              tk.text,
              row.xs[j],
              base,
              fg,
              p * (LEGAL_ALPHA + (1 - LEGAL_ALPHA) * mark) * (1 - out),
              (1 - p) * s0 * 0.3 + out * s0 * 0.16 + travel,
              reflowing || midway(p) || midway(out),
            ),
          );
        });
      });
    } else {
      rowIndex += legalB[i].rows.length;
    }
    const keep = i === highlight;
    const coolEl = keep ? null : tl.get(`cool:${i}`);
    const cool = !coolEl
      ? 0
      : interpolate(t, [coolEl.start, coolEl.end], [0, 1], {
          ...CLAMP,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        });
    plainB[i].rows.forEach((row, r) => {
      const base = top + m.cap * s0 + r * rowH;
      row.tokens.forEach((tk, j) => {
        const plainEl = tl.get(`plain:${i}:${j}`);
        const p = interpolate(t, [plainEl.start, plainEl.end], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        if (p <= 0) return;
        nodes.push(
          word(
            tk.id,
            tk.text,
            row.xs[j],
            base,
            mix(hi, fg, cool),
            p,
            (1 - p) * s0 * 0.28 + travel,
            reflowing || midway(p),
          ),
        );
      });
    });
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={layerScale}>
        <div
          style={{
            position: "absolute",
            left: marginX,
            top: marginY,
            width: boxW,
            height: boxH,
            transformOrigin: "0 0",
            // Rounded only at rest: a scale stepped to 1e-4 while it moves
            // would click the far text along by hand. The tilt pivots on
            // the box's centre, not on the far-off origin.
            transform: zooming
              ? `translate(${boxW / 2}px, ${boxH / 2}px)${glide(true)} translate(${-boxW / 2}px, ${-boxH / 2}px) scale(${scale})`
              : `scale(${scale.toFixed(4)})`,
          }}
        >
          {nodes}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
