"use client";

import { loadFont } from "@remotion/google-fonts/Afacad";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const afacad = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface StoryBeat {
  slug: string;
  line: string;
}

export interface CrunchProps {
  setup?: StoryBeat;
  snag?: StoryBeat;
  resolution?: StoryBeat;
  accent?: string;
  /** Text color of the first two lines; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Color of the walls that close in; overrides the theme. */
  wall?: string;
  /** Typeface for the copy. Load it yourself; Afacad by default. */
  fontFamily?: string;
  /** Weight of the story lines; the slugs keep 500. */
  fontWeight?: number;
  /** Size of the copy, around the frame's center; the walls stay put. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#3A1F1A",
    ink: "#FBF3EA",
    accent: "#F2B544",
    wall: "#241210",
    edge: "#4F2C25",
  },
  light: {
    bg: "#FBF6EE",
    ink: "#3B2414",
    accent: "#B07A00",
    wall: "#3B2414",
    edge: "#E9DCC8",
  },
} as const;

const DEFAULT_SETUP: StoryBeat = {
  slug: "Monday, 10:00 AM",
  line: "Maya had a launch on Friday.",
};
const DEFAULT_SNAG: StoryBeat = {
  slug: "Thursday, 11:40 PM",
  line: "Nine hours left, and still no video.",
};
const DEFAULT_RESOLUTION: StoryBeat = {
  slug: "Friday, 9:00 AM",
  line: "It shipped, with time to spare.",
};

const LINE_TRACK = -0.02;
const SLUG_TRACK = 0.08;
const LH = 1.04;
const SLUG_RATIO = 0.3;
const PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SQUEEZE = Easing.bezier(0.55, 0, 0.75, 1);
const EASE_IN = Easing.bezier(0.5, 0, 0.75, 0);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function words(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

function useWidths(strings: string[], family: string) {
  const key = strings.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("crunch: measuring"));
  const released = useRef(false);
  const ref = useRef(strings);
  ref.current = strings;
  useEffect(() => {
    let live = true;
    Promise.all([
      afacad.waitUntilDone(),
      document.fonts.load(`500 ${PX}px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        if (ctx) ctx.font = `500 ${PX}px "${family}"`;
        for (const s of ref.current) {
          w[s] = ctx ? ctx.measureText(s).width / PX : s.length * 0.45;
        }
        setState({ key, w });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, family]);
  return state && state.key === key ? state.w : null;
}

interface Laid {
  x: number[];
  line: number[];
  widths: number[];
  lines: number;
}

function greedy(ws: number[], space: number, max: number): Laid {
  const x: number[] = [];
  const line: number[] = [];
  const widths: number[] = [0];
  let l = 0;
  let cx = 0;
  ws.forEach((w, i) => {
    if (i > 0 && cx + space + w > max) {
      l++;
      widths.push(0);
      cx = 0;
    } else if (i > 0) {
      cx += space;
    }
    x.push(cx);
    line.push(l);
    cx += w;
    widths[l] = cx;
  });
  return { x, line, widths, lines: l + 1 };
}

function balanced(ws: number[], space: number, max: number): Laid {
  const base = greedy(ws, space, max);
  if (base.lines <= 1) return base;
  let lo = Math.max(...ws);
  let hi = max;
  for (let k = 0; k < 18; k++) {
    const mid = (lo + hi) / 2;
    if (greedy(ws, space, mid).lines <= base.lines) hi = mid;
    else lo = mid;
  }
  return greedy(ws, space, hi);
}

interface Block {
  lineWords: string[];
  slugWords: string[];
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

export function Crunch({
  setup = DEFAULT_SETUP,
  snag = DEFAULT_SNAG,
  resolution = DEFAULT_RESOLUTION,
  accent,
  ink,
  background,
  wall,
  fontFamily = afacad.fontFamily,
  fontWeight = 400,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: CrunchProps) {
  const glide = useGlide();
  const frame = Math.max(0, useCurrentFrame() - delay);
  const t = frame * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const blocks: Block[] = [setup, snag, resolution].map((b) => ({
    lineWords: words(b.line),
    slugWords: words(b.slug.toUpperCase()),
  }));
  const strings = Array.from(
    new Set([" ", ...blocks.flatMap((b) => [...b.lineWords, ...b.slugWords])]),
  );
  const w = useWidths(strings, fontFamily);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const space = w[" "] ?? 0.22;
  const lineAdv = (s: string) =>
    (w[s] ?? 0) + LINE_TRACK * Array.from(s).length;
  const slugAdv = (s: string) =>
    (w[s] ?? 0) + SLUG_TRACK * Array.from(s).length;

  const wideCol = W * (portrait ? 0.86 : 0.8);
  const pad = unit * 0.05;

  let F = portrait ? W * 0.14 : H * 0.17;
  const fitWide = () =>
    blocks.every(
      (b) =>
        balanced(b.lineWords.map(lineAdv), space, wideCol / F).lines <=
        (portrait ? 4 : 2),
    );
  for (let k = 0; k < 60 && !fitWide(); k++) F *= 0.96;

  const room = H * (portrait ? 0.8 : 0.86);
  const snagStack = (size: number, col: number) => {
    const ss = Math.max(14, size * SLUG_RATIO);
    const a = balanced(
      blocks[1].slugWords.map((s) => slugAdv(s) * ss),
      space * ss,
      col,
    );
    const b = balanced(
      blocks[1].lineWords.map((s) => lineAdv(s) * size),
      space * size,
      col,
    );
    return a.lines * ss * 1.25 + ss * 0.9 + b.lines * size * LH;
  };
  for (let k = 0; k < 60 && snagStack(F, wideCol) > room; k++) F *= 0.96;
  const S = Math.max(14, F * SLUG_RATIO);
  const minWord =
    Math.max(
      ...blocks[1].lineWords.map((s) => lineAdv(s) * F),
      ...blocks[1].slugWords.map((s) => slugAdv(s) * S),
    ) * 1.02;
  let lo = minWord;
  let hiCol = Math.max(minWord, wideCol);
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hiCol) / 2;
    if (snagStack(F, mid) <= room) hiCol = mid;
    else lo = mid;
  }
  const tightCol = hiCol;

  const k = Math.min(1.6, Math.max(0.75, T / 180));
  const at = (f: number) => f * k;
  const setupIn = at(4);
  const setupOut = at(44);
  const snagIn = at(52);
  const squeezeA = at(74);
  const squeezeB = at(122);
  const release = at(134);
  const resIn = at(140);

  const maxInset = Math.max(0, (W - tightCol) / 2 - pad);
  const squeeze = interpolate(t, [squeezeA, squeezeB], [0, 1], {
    ...CLAMP,
    easing: EASE_SQUEEZE,
  });
  const open = interpolate(t, [release, release + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const inset = maxInset * squeeze * (1 - open);
  const colAt = (tt: number) => {
    const sq = interpolate(tt, [squeezeA, squeezeB], [0, 1], {
      ...CLAMP,
      easing: EASE_SQUEEZE,
    });
    return Math.max(
      tightCol,
      Math.min(wideCol, W - 2 * maxInset * sq - 2 * pad),
    );
  };

  const centreY = H * (portrait ? 0.5 : 0.52);

  const layout = (b: Block, col: number) => {
    const sw = b.slugWords.map((s) => slugAdv(s) * S);
    const lw = b.lineWords.map((s) => lineAdv(s) * F);
    const a = balanced(sw, space * S, col);
    const l = balanced(lw, space * F, col);
    const slugLH = S * 1.25;
    const gap = S * 0.9;
    const total = a.lines * slugLH + gap + l.lines * F * LH;
    const top = centreY - total / 2;
    const pts: { x: number; y: number }[] = [];
    b.slugWords.forEach((_, i) => {
      pts.push({
        x: W / 2 - a.widths[a.line[i]] / 2 + a.x[i],
        y: top + a.line[i] * slugLH,
      });
    });
    b.lineWords.forEach((_, i) => {
      pts.push({
        x: W / 2 - l.widths[l.line[i]] / 2 + l.x[i],
        y: top + a.lines * slugLH + gap + l.line[i] * F * LH,
      });
    });
    return pts;
  };

  const wideFor = (b: Block) => layout(b, wideCol);

  const snagStart = Math.floor(squeezeA);
  const snagAt = (tt: number) => {
    const end = Math.min(Math.floor(tt), Math.floor(release));
    let pos = layout(blocks[1], colAt(snagStart));
    for (let f = snagStart + 1; f <= end; f++) {
      const target = layout(blocks[1], colAt(f));
      pos = pos.map((p, i) => ({
        x: p.x + (target[i].x - p.x) * 0.75,
        y: p.y + (target[i].y - p.y) * 0.75,
      }));
    }
    return pos;
  };
  const snagPts = snagAt(t);
  // The snag words are laid out where the squeeze starts and ride to their
  // live place by transform for as long as they are up: layout rounds a
  // baseline to whole pixels, so words eased by `left`/`top` click along pixel
  // by pixel, and a word handed back to layout between moves jumps by the
  // rounding.
  const snagHome = snagAt(snagStart);
  const snagPrev = snagAt(t - speed);
  const snagMoving = snagPts.map(
    (p, i) =>
      Math.abs(p.x - snagPrev[i].x) > 1e-3 ||
      Math.abs(p.y - snagPrev[i].y) > 1e-3,
  );

  const renderBlock = (
    b: Block,
    pts: { x: number; y: number }[],
    key: string,
    inAt: number,
    outAt: number | null,
    lineColor: string,
    slugColor: string,
    home?: { x: number; y: number }[],
    riding?: boolean[],
  ) => {
    const n = b.slugWords.length;
    const all = [...b.slugWords, ...b.lineWords];
    return all.map((word, i) => {
      const isSlug = i < n;
      const s0 = inAt + i * Math.min(2.2, 16 / all.length);
      const e = interpolate(t, [s0, s0 + 16], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      let o = e;
      let dy = (1 - e) * (isSlug ? S : F) * 0.45;
      let moving = midway(e);
      if (outAt !== null) {
        const x0 = outAt + i * 0.8;
        const x = interpolate(t, [x0, x0 + 9], [0, 1], {
          ...CLAMP,
          easing: EASE_IN,
        });
        o *= 1 - x;
        dy -= x * F * 0.35;
        moving ||= midway(x);
      }
      if (o <= 0.001) return null;
      const size = isSlug ? S : F;
      const ride = home ? home[i] : null;
      const pos = ride ?? pts[i];
      const rideX = ride ? `translateX(${pts[i].x - ride.x}px) ` : "";
      const rideY = ride ? pts[i].y - ride.y : 0;
      return (
        <div
          key={`${key}${i}`}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            fontSize: size,
            lineHeight: `${isSlug ? size * 1.25 : size * LH}px`,
            whiteSpace: "pre",
            fontWeight: isSlug ? 500 : fontWeight,
            letterSpacing: `${isSlug ? SLUG_TRACK : LINE_TRACK}em`,
            color: isSlug ? slugColor : lineColor,
            opacity: o,
            transform: `${rideX}translateY(${(Number(dy.toFixed(2)) + rideY).toString()}px)${glide(moving || !!riding?.[i])}`,
          }}
        >
          {word}
        </div>
      );
    });
  };

  const wallW = inset + pad * 0.35 * squeeze * (1 - open);
  const wallStyle = (side: "left" | "right") => ({
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    [side]: 0,
    width: Math.max(0, wallW),
    background: wall ?? c.wall,
    boxShadow:
      wallW > 1
        ? `inset ${side === "left" ? -1 : 1}px 0 0 ${c.edge}`
        : undefined,
  });

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily,
      }}
    >
      <ScaleLayer scale={scale}>
        {renderBlock(
          blocks[0],
          wideFor(blocks[0]),
          "a",
          setupIn,
          setupOut,
          fg,
          hi,
        )}
        {renderBlock(
          blocks[1],
          snagPts,
          "b",
          snagIn,
          release - 4,
          fg,
          hi,
          snagHome,
          snagMoving,
        )}
      </ScaleLayer>
      <div style={wallStyle("left")} />
      <div style={wallStyle("right")} />
      <ScaleLayer scale={scale}>
        {renderBlock(blocks[2], wideFor(blocks[2]), "c", resIn, null, hi, hi)}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
