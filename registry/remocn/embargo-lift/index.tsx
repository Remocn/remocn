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
  DEFAULT_LINES,
  type EmbargoLiftElementId,
  embargoLiftTimeline,
  rowsOf,
} from "./timeline";

const shoulders = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface EmbargoLiftProps {
  lines?: string[];
  slug?: string;
  liftedSlug?: string;
  highlight?: number;
  accent?: string;
  /** Text and bar color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Big Shoulders by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames between one bar lifting and the next. */
  stagger?: number;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single lines, the slug, its flip and single
   * bars, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<EmbargoLiftElementId>;
}

const THEMES = {
  dark: { bg: "#26231F", ink: "#F6F0E6", accent: "#2BD96B" },
  light: { bg: "#F5F5F2", ink: "#000000", accent: "#0E9F4B" },
} as const;

const WGHT = 500;
const PX = 200;
const LEAD = 1.2;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_LIFT = Easing.bezier(0.7, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  w: Record<string, number>;
  asc: number;
  desc: number;
  cap: number;
  dsc: number;
}

function measureAll(texts: string[], font: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("embargo-lift: no 2d context");
  ctx.font = font;
  const w: Record<string, number> = {};
  for (const s of texts) w[s] = ctx.measureText(s).width / PX;
  const fm = ctx.measureText("Hgp");
  const h = ctx.measureText("Hbdl");
  const g = ctx.measureText("gpy");
  return {
    w,
    asc: fm.fontBoundingBoxAscent / PX,
    desc: fm.fontBoundingBoxDescent / PX,
    cap: h.actualBoundingBoxAscent / PX,
    dsc: g.actualBoundingBoxDescent / PX,
  };
}

function useMetrics(texts: string[], fontFamily: string, fontWeight: number) {
  const font = `${fontWeight} ${PX}px "${fontFamily}"`;
  const key = `${font}\u0002${texts.join("\u0001")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("embargo-lift: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      shoulders.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measureAll(key.split("\u0002")[1].split("\u0001"), font),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, font, fontFamily, fontWeight]);
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

export function EmbargoLift(props: EmbargoLiftProps) {
  const {
    lines = DEFAULT_LINES,
    slug = "Embargoed until 9:00 a.m.",
    liftedSlug = "Embargo lifted, 9:00 a.m.",
    highlight,
    accent,
    ink,
    background,
    fontFamily = shoulders.fontFamily,
    fontWeight = WGHT,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  // The pace that fits the bars into the clip counts the clip without
  // `speed`, so the schedule gets `durationInFrames`.
  const tl = useTimeline(embargoLiftTimeline, props, durationInFrames, timing);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const { rows, barCount } = rowsOf(lines);
  const hiBar = highlight ?? barCount - 1;
  const t = frame * speed;

  const texts: string[] = [];
  for (const segs of rows) {
    let prefix = "";
    for (const s of segs) {
      texts.push(prefix, s.text);
      prefix += s.text;
    }
    texts.push(prefix);
  }
  texts.push(slug, liftedSlug);
  const m = useMetrics(texts, fontFamily, fontWeight);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.07 : 0.06);
  const lineTexts = rows.map((segs) => segs.map((s) => s.text).join(""));
  const maxW = Math.max(0.1, ...lineTexts.map((l) => m.w[l]));
  const size = Math.min(
    (W - marginX * 2) / maxW,
    (H * (portrait ? 0.52 : 0.68)) / (rows.length * LEAD),
  );
  const slugSize = Math.max(H * (portrait ? 0.018 : 0.034), size * 0.13);
  const slugGap = slugSize * 1.6;
  const blockH = rows.length * LEAD * size;
  const totalH = slugSize + slugGap + blockH;
  const top = (H - totalH) / 2 + slugSize * 0.2;
  const firstBase = top + slugSize + slugGap + m.cap * size;

  const boxTop = (base: number, s: number) =>
    base - ((1 - m.asc - m.desc) / 2 + m.asc) * s;

  const textStyle = (s: number): React.CSSProperties => ({
    position: "absolute",
    height: s,
    lineHeight: `${s}px`,
    whiteSpace: "pre",
    fontFamily,
    fontWeight,
    fontSize: s,
  });

  const nodes: React.ReactNode[] = [];

  rows.forEach((segs, r) => {
    const lineW = m.w[lineTexts[r]] * size;
    const left = (W - lineW) / 2;
    const base = firstBase + r * LEAD * size;
    const lineEl = tl.get(`line:${r}`);
    const p = interpolate(t, [lineEl.start, lineEl.end], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const dy = (1 - p) * size * 0.22;
    nodes.push(
      <div
        key={`line-${r}`}
        style={{
          ...textStyle(size),
          left,
          top: boxTop(base, size),
          opacity: p,
          transform: `translateY(${dy.toFixed(2)}px)${glide(midway(p))}`,
          color: fg,
        }}
      >
        {segs.map((s, i) => (
          <span
            key={`${r}-${i}`}
            style={{ color: s.hidden && s.bar === hiBar ? hi : fg }}
          >
            {s.text}
          </span>
        ))}
      </div>,
    );
    let prefix = "";
    segs.forEach((s, i) => {
      const x0 = left + m.w[prefix] * size;
      prefix += s.text;
      if (!s.hidden) return;
      const tw = m.w[s.text] * size;
      const padX = size * 0.012;
      const barTop = base - (m.cap + 0.05) * size;
      const barBottom =
        base + (Math.min(Math.max(m.dsc, 0.1), 0.24) + 0.02) * size;
      const bar = tl.get(`bar:${s.bar}`);
      const g = interpolate(t, [bar.start, bar.end], [1, 0], {
        ...CLAMP,
        easing: EASE_LIFT,
      });
      if (g <= 0) return;
      nodes.push(
        <div
          key={`bar-${r}-${i}`}
          style={{
            position: "absolute",
            left: x0 - padX,
            top: barTop,
            width: tw + padX * 2,
            height: barBottom - barTop,
            background: fg,
            opacity: p,
            transform: `translateY(${dy.toFixed(2)}px) scaleX(${g.toFixed(4)})`,
            transformOrigin: "100% 50%",
          }}
        />,
      );
    });
  });

  const slugBase = top + m.cap * slugSize;
  const slugEl = tl.get("slug");
  const flipEl = tl.get("flip");
  const slugIn = interpolate(t, [slugEl.start, slugEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const flip = interpolate(t, [flipEl.start, flipEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_LIFT,
  });
  const slugClipTop = slugBase - (m.cap + 0.2) * slugSize;
  const slugClipH = (m.cap + 0.2 + 0.3) * slugSize;
  const slugLine = (text: string, y: number, o: number, key: string) => (
    <div
      key={key}
      style={{
        ...textStyle(slugSize),
        left: (W - m.w[text] * slugSize) / 2,
        top: boxTop(slugBase, slugSize) - slugClipTop,
        color: fg,
        opacity: o,
        transform: `translateY(${y.toFixed(2)}px)${glide(midway(flip))}`,
      }}
    >
      {text}
    </div>
  );
  const travel = slugClipH;
  nodes.push(
    <div
      key="slug"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: slugClipTop,
        height: slugClipH,
        overflow: "hidden",
        opacity: slugIn,
      }}
    >
      {flip < 1
        ? slugLine(slug, -flip * travel, 0.6 * (1 - flip * 0.5), "old")
        : null}
      {flip > 0
        ? slugLine(liftedSlug, (1 - flip) * travel, 0.6 + 0.4 * flip, "new")
        : null}
    </div>,
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
