"use client";

import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { type IdeaSetElementId, ideaSetTimeline } from "./timeline";

const sans = loadPlexSans("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const sansItalic = loadPlexSans("italic", {
  weights: ["300"],
  subsets: ["latin"],
});
const mono = loadPlexMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface IdeaSetProps {
  lines?: string[];
  highlight?: string;
  hold?: number;
  /** Frames each change of style takes to sweep across the text. */
  wave?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the sketch and final styles. Load it yourself; IBM Plex Sans by default. */
  fontFamily?: string;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the rows' entry and the two waves of style
   * changes, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<IdeaSetElementId>;
}

const THEMES = {
  dark: {
    bg: "#0F1B2D",
    ink: "#F3F5F8",
    rule: "rgba(243, 245, 248, 0.22)",
    accent: "#FF9900",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#0F1B2D",
    rule: "rgba(15, 27, 45, 0.2)",
    accent: "#C76A00",
  },
} as const;

interface Face {
  family: string;
  style: "normal" | "italic";
  weight: number;
}
const FACES: Face[] = [
  { family: sansItalic.fontFamily, style: "italic", weight: 300 },
  { family: mono.fontFamily, style: "normal", weight: 400 },
  { family: sans.fontFamily, style: "normal", weight: 500 },
];
const facesOf = (fontFamily: string): Face[] => [
  { ...FACES[0], family: fontFamily },
  FACES[1],
  { ...FACES[2], family: fontFamily },
];
const TRACK = [0.012, 0, -0.03];
const LINE = 1.34;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Advances = Record<string, [number, number, number]>;
interface Metrics {
  adv: Advances;
  asc: [number, number, number];
  desc: [number, number, number];
}

function measure(chars: string[], faces: Face[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("idea-set: no 2d context");
  const fonts = faces.map((f) => `${f.style} ${f.weight} 100px "${f.family}"`);
  const adv: Advances = {};
  for (const ch of chars) {
    adv[ch] = fonts.map((font) => {
      ctx.font = font;
      return ctx.measureText(ch).width / 100;
    }) as [number, number, number];
  }
  const asc = fonts.map((font) => {
    ctx.font = font;
    return ctx.measureText("Hg").fontBoundingBoxAscent / 100;
  }) as [number, number, number];
  const desc = fonts.map((font) => {
    ctx.font = font;
    return ctx.measureText("Hg").fontBoundingBoxDescent / 100;
  }) as [number, number, number];
  return { adv, asc, desc };
}

function useMetrics(chars: string[], fontFamily: string) {
  const key = chars.join("");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("idea-set: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const faces = facesOf(fontFamily);
    Promise.all([
      sans.waitUntilDone(),
      sansItalic.waitUntilDone(),
      mono.waitUntilDone(),
      ...faces.map((f) =>
        document.fonts.load(`${f.style} ${f.weight} 100px "${f.family}"`),
      ),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(Array.from(key), faces) });
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

export function IdeaSet(props: IdeaSetProps) {
  const {
    lines = ["Napkin sketch.", "Keynote opener."],
    highlight = "Keynote opener.",
    accent,
    ink,
    background,
    fontFamily = sans.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    ideaSetTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const faces = facesOf(fontFamily);
  const portrait = H > W * 1.1;
  const rows = useMemo(() => {
    const r = lines.map((l) => l.trim()).filter((l) => l.length > 0);
    const base = r.length > 0 ? r : ["remocn"];
    return portrait ? base.flatMap((l) => l.split(/\s+/)) : base;
  }, [lines, portrait]);
  const chars = useMemo(
    () => Array.from(new Set(Array.from(rows.join("")))).sort(),
    [rows],
  );
  const m = useMetrics(chars, fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const enterEl = tl.get("enter");
  const draft = tl.get("draft");
  const final = tl.get("final");

  const joined = rows.join("\n");
  const hlStart = highlight ? rows.join(" ").indexOf(highlight) : -1;
  const hlEnd = hlStart >= 0 ? hlStart + highlight.length : -1;

  const total = Array.from(joined).filter((ch) => ch !== "\n").length;
  // A wave spreads its glyphs over what its turn leaves of it.
  const spread = (e: typeof draft) =>
    Math.min(1.4, (e.length - e.beat("turn")) / Math.max(1, total - 1));
  const staggerA = spread(draft);
  const staggerB = spread(final);

  const widthIn = (row: string, s: number) => {
    const g = Array.from(row);
    let w = 0;
    for (const ch of g) w += m.adv[ch][s];
    return w + TRACK[s] * Math.max(0, g.length - 1);
  };
  const widest = Math.max(
    ...rows.flatMap((r) => [widthIn(r, 0), widthIn(r, 1), widthIn(r, 2)]),
  );
  const margin = Math.min(W, H) * (portrait ? 0.08 : 0.09);
  const F = Math.min(
    (W - margin * 2) / widest,
    (H * (portrait ? 0.62 : 0.66)) / (rows.length * LINE),
    H * 0.2,
  );
  const lineH = F * LINE;
  const baseIn = lineH * 0.78;
  const visH = (rows.length - 1) * lineH + F * 1.02;
  const top = (H - visH) / 2 - (baseIn - F * 0.72);

  const stateOf = (i: number, tt = t) => {
    const a = interpolate(
      tt,
      [
        draft.start + i * staggerA,
        draft.start + i * staggerA + draft.beat("turn"),
      ],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
    const b = interpolate(
      tt,
      [
        final.start + i * staggerB,
        final.start + i * staggerB + final.beat("turn"),
      ],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
    return { a, b };
  };

  const faceOf = (a: number, b: number) => (b >= 0.5 ? 2 : a >= 0.5 ? 1 : 0);
  const advOf = (ch: string, a: number, b: number) => {
    const A = m.adv[ch];
    return b > 0 ? A[1] + (A[2] - A[1]) * b : A[0] + (A[1] - A[0]) * a;
  };
  const trackOf = (a: number, b: number) =>
    b > 0
      ? TRACK[1] + (TRACK[2] - TRACK[1]) * b
      : TRACK[0] + (TRACK[1] - TRACK[0]) * a;

  const els: React.ReactNode[] = [];
  let gi = 0;
  let ci = 0;
  rows.forEach((row, r) => {
    const g = Array.from(row);
    const rowAt = enterEl.start + r * enterEl.beat("rowGap");
    const enter = interpolate(t, [rowAt, rowAt + enterEl.beat("row")], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const ruleAt = enterEl.start + r * enterEl.beat("ruleGap");
    const ruleP = interpolate(
      t,
      [ruleAt, ruleAt + enterEl.beat("rule")],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
    const baseY = top + r * lineH + baseIn;
    // Where each glyph of the row is laid out at a time: a neighbour that
    // changes face pushes it along by layout.
    const lefts = (tt: number) => {
      let at = 0;
      return g.map((ch, k) => {
        const { a, b } = stateOf(gi + k, tt);
        const left = at;
        at += advOf(ch, a, b) + trackOf(a, b);
        return left;
      });
    };
    const xs = lefts(t);
    const xsNext = lefts(t + speed);
    const xsPrev = lefts(t - speed);
    const rowGlyphs: React.ReactNode[] = [];
    g.forEach((ch, k) => {
      const x = xs[k];
      const { a, b } = stateOf(gi + k);
      const fi = faceOf(a, b);
      const face = faces[fi];
      const lift = Math.sin(Math.PI * a) + Math.sin(Math.PI * b);
      const hopping = midway(a) || midway(b);
      // The lean comes and goes with any move of the glyph, its own hop or
      // the push of a neighbour, so it never switches while layout carries it.
      const moving =
        hopping ||
        Math.abs(xsNext[k] - x) * F > 1e-3 ||
        Math.abs(x - xsPrev[k]) * F > 1e-3;
      // Rounding the hop to 0.01px is fine at rest but steps it while it
      // moves, so the raw value rides there.
      const hop = -lift * F * 0.08;
      const inHl = hlStart >= 0 && ci >= hlStart && ci < hlEnd;
      const color = inHl && fi === 2 ? (accent ?? c.accent) : fg;
      rowGlyphs.push(
        <span
          key={`g${r}-${k}`}
          style={{
            position: "absolute",
            left: margin + x * F,
            top: baseIn - m.asc[fi] * F,
            lineHeight: 1,
            height: (m.asc[fi] + m.desc[fi]) * F,
            whiteSpace: "pre",
            fontFamily: face.family,
            fontStyle: face.style,
            fontWeight: face.weight,
            fontSize: F,
            color,
            transform: `translateY(${hopping ? hop : hop.toFixed(2)}px)${glide(moving)}`,
          }}
        >
          {ch}
        </span>,
      );
      ci++;
    });
    gi += g.length;
    ci++;
    els.push(
      <div
        key={`rule${r}`}
        style={{
          position: "absolute",
          left: margin,
          top: baseY + F * 0.3,
          width: (W - margin * 2) * ruleP,
          height: Math.max(1, F * 0.012),
          background: c.rule,
        }}
      />,
    );
    els.push(
      <div
        key={`row${r}`}
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: top + r * lineH,
          height: baseIn + F * 0.28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            // The row slides up by transform, not `top`: layout rounds a
            // baseline to whole pixels, so text eased by `top` clicks.
            top: 0,
            width: W,
            height: lineH,
            // Kept at 0 once the row is in: the lean rides on it.
            transform: `translateY(${(1 - enter) * lineH > 1e-3 ? (1 - enter) * lineH : 0}px)${glide(midway(enter))}`,
          }}
        >
          {rowGlyphs}
        </div>
      </div>,
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{els}</ScaleLayer>
    </AbsoluteFill>
  );
}
