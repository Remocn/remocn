"use client";

import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const space = loadSpace("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface BlockSwapProps {
  lines?: string[];
  highlight?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;

const THEMES = {
  dark: { bg: "#0A0A0B", ink: "#F4F3F0" },
  light: { bg: "#F5F4F0", ink: "#111113" },
} as const;

const TRACK = -0.03;
const LEAD = 1.12;
const BLOCK_TOP = 0.86;
const BLOCK_BOT = 0.24;
const PAD_X = 0.08;
const RADIUS = 0.2;

const STAGGER = 2;
const RUN = 10;
const MORPH = 20;
const MORPH_STAGGER = 1;
const TEXT_IN = 6;
const HOLD = 14;
const OPEN_SPAWN = 2;
const END_HOLD = 30;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_WIPE = Easing.bezier(0.45, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Word {
  text: string;
  x: number;
  base: number;
  w: number;
  block: Rect;
}

interface Layout {
  F: number;
  heads: Word[][];
  asc: number;
  desc: number;
}

function measureLayout(lines: string[], W: number, H: number): Layout {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("block-swap: no 2d context");
  const PX = 200;
  ctx.font = `500 ${PX}px "${space.fontFamily}"`;
  const wOf = (s: string) =>
    ctx.measureText(s).width / PX + TRACK * Array.from(s).length;
  const fm = ctx.measureText("Hg");
  const asc = fm.fontBoundingBoxAscent / PX;
  const desc = fm.fontBoundingBoxDescent / PX;
  const sp = wOf(" ");

  const words = lines.map((l) => l.split(/\s+/).filter(Boolean));
  const cuts = words.map((ws) => {
    const n = ws.length;
    const tw = ws.map(wOf);
    const lw = (a: number, b: number) => {
      let s = 0;
      for (let i = a; i < b; i++) s += tw[i] + (i > a ? sp : 0);
      return s;
    };
    const options: { cut: number[]; max: number }[] = [];
    for (let L = 1; L <= Math.min(3, n); L++) {
      let best: { cut: number[]; max: number } | null = null;
      const rec = (start: number, left: number, acc: number[], mx: number) => {
        if (best && mx >= best.max) return;
        if (left === 1) {
          const m = Math.max(mx, lw(start, n));
          if (!best || m < best.max) best = { cut: [...acc], max: m };
          return;
        }
        for (let i = start + 1; i <= n - left + 1; i++)
          rec(i, left - 1, [...acc, i], Math.max(mx, lw(start, i)));
      };
      rec(0, L, [], 0);
      if (best) options.push(best);
    }
    return { tw, lw, options };
  });

  const sizeFor = (max: number, L: number) =>
    Math.min((W * 0.84) / max, (H * 0.56) / (L * LEAD), H * 0.19);
  const pick = cuts.map(({ options }) => {
    let best = options[0];
    let bestF = sizeFor(best.max, 1);
    options.forEach((o, i) => {
      const f = sizeFor(o.max, i + 1);
      if (f > bestF * 1.15) {
        best = o;
        bestF = f;
      }
    });
    return { cut: best.cut, F: bestF };
  });
  const F = Math.min(...pick.map((p) => p.F));

  const heads = words.map((ws, hi) => {
    const { tw, lw } = cuts[hi];
    const bounds = [0, ...pick[hi].cut, ws.length];
    const L = bounds.length - 1;
    const lineH = F * LEAD;
    const top = H * 0.48 - (L * lineH) / 2;
    const out: Word[] = [];
    for (let li = 0; li < L; li++) {
      const a = bounds[li];
      const b = bounds[li + 1];
      let x = W / 2 - (lw(a, b) * F) / 2;
      const base = top + li * lineH + (lineH - (asc + desc) * F) / 2 + asc * F;
      for (let i = a; i < b; i++) {
        const w = tw[i] * F;
        out.push({
          text: ws[i],
          x,
          base,
          w,
          block: {
            x: x - PAD_X * F,
            y: base - BLOCK_TOP * F,
            w: w + 2 * PAD_X * F - TRACK * F,
            h: (BLOCK_TOP + BLOCK_BOT) * F,
          },
        });
        x += w + sp * F;
      }
    }
    return out;
  });
  return { F, heads, asc, desc };
}

function useLayout(lines: string[], W: number, H: number) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("block-swap: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      space.waitUntilDone(),
      document.fonts.load(`500 100px "${space.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setLayout(measureLayout(lines, W, H));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [lines, W, H, handle]);
  return layout;
}

interface Swap {
  to: number;
  from: number | null;
  start: number;
  covered: number;
  morphAt: number;
  textAt: number;
  uncoverAt: number;
  end: number;
}

function plan(counts: number[]): Swap[] {
  const out: Swap[] = [];
  let at = 0;
  counts.forEach((n, i) => {
    if (i === 0) {
      const covered = OPEN_SPAWN + (n - 1) * STAGGER + RUN + 2;
      const textAt = covered;
      const uncoverAt = textAt + TEXT_IN;
      const end = uncoverAt + (n - 1) * STAGGER + RUN;
      out.push({
        to: 0,
        from: null,
        start: 0,
        covered,
        morphAt: 0,
        textAt,
        uncoverAt,
        end,
      });
      at = end + HOLD;
      return;
    }
    const m = counts[i - 1];
    const k = Math.max(m, n);
    const covered = at + (m - 1) * STAGGER + RUN;
    const morphAt = covered - 2;
    const textAt = morphAt + MORPH + (k - 1) * MORPH_STAGGER;
    const uncoverAt = textAt + TEXT_IN;
    const end = uncoverAt + (n - 1) * STAGGER + RUN;
    out.push({
      to: i,
      from: i - 1,
      start: at,
      covered,
      morphAt,
      textAt,
      uncoverAt,
      end,
    });
    at = end + HOLD;
  });
  return out;
}

export function blockSwapDuration(lines: string[] = DEFAULT_LINES) {
  const counts = lines.map((l) => l.split(/\s+/).filter(Boolean).length);
  const p = plan(counts);
  return p[p.length - 1].end + END_HOLD;
}

const DEFAULT_LINES = ["Pick the beats you need.", "Render the launch."];

const lerpRect = (a: Rect, b: Rect, k: number): Rect => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  h: a.h + (b.h - a.h) * k,
});

const bare = (s: string) => s.replace(/[.,!?;:…]+$/, "").toLowerCase();

export function BlockSwap({
  lines = DEFAULT_LINES,
  highlight = "launch",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: BlockSwapProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const safeLines = useMemo(
    () => (lines.length > 0 ? lines : DEFAULT_LINES),
    [lines],
  );
  const layout = useLayout(safeLines, W, H);
  const swaps = useMemo(
    () => plan(safeLines.map((l) => l.split(/\s+/).filter(Boolean).length)),
    [safeLines],
  );

  if (!layout) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const { F, heads } = layout;
  let sw = swaps[0];
  for (const s of swaps) if (t >= s.start) sw = s;
  const isLast = sw.to === heads.length - 1;
  const next = heads[sw.to];
  const prev = sw.from === null ? null : heads[sw.from];
  const k = Math.max(next.length, prev ? prev.length : 0);
  const hiIndex =
    isLast && highlight
      ? next.findIndex((w) => bare(w.text) === bare(highlight))
      : -1;

  const r = RADIUS * F;
  const drift = (t / 30) * 0.18;
  const shimmer = `linear-gradient(90deg, ${FLUTED[0]} 0%, ${FLUTED[1]} 18%, ${accent} 30%, ${FLUTED[2]} 48%, ${FLUTED[3]} 58%, ${FLUTED[1]} 76%, ${FLUTED[0]} 100%)`;
  const pill = `linear-gradient(100deg, ${accent} 0%, ${FLUTED[1]} 45%, ${FLUTED[2]} 100%)`;

  const textStyle = {
    position: "absolute" as const,
    fontFamily: space.fontFamily,
    fontWeight: 500,
    fontSize: F,
    lineHeight: 1,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
  };
  const baseInBox = ((1 - layout.asc - layout.desc) * F) / 2 + layout.asc * F;
  const wordAt = (w: Word, color: string, dx = 0, dy = 0) => (
    <div
      style={{
        ...textStyle,
        left: w.x - dx,
        top: w.base - baseInBox - dy,
        color,
      }}
    >
      {w.text}
    </div>
  );

  const nodes: React.ReactNode[] = [];

  if (prev) {
    prev.forEach((w, i) => {
      const done = sw.start + i * STAGGER + RUN;
      if (t < done) nodes.push(<div key={`old-${i}`}>{wordAt(w, c.ink)}</div>);
    });
  }
  next.forEach((w, i) => {
    if (i === hiIndex) return;
    const off = sw.uncoverAt + i * STAGGER;
    if (t >= off) nodes.push(<div key={`new-${i}`}>{wordAt(w, c.ink)}</div>);
  });

  for (let j = 0; j < k; j++) {
    const target = next[Math.min(j, next.length - 1)];
    const merging = j >= next.length;
    let rect: Rect;
    let fill = 0;
    let inner: { w: Word; o: number } | null = null;
    let alpha = 1;

    if (prev) {
      const source = prev[Math.min(j, prev.length - 1)];
      const splitting = j >= prev.length;
      const cv = splitting
        ? 1
        : interpolate(
            t,
            [sw.start + j * STAGGER, sw.start + j * STAGGER + RUN],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
      const sq = source.block.h;
      const coverRect: Rect = {
        ...source.block,
        w: sq + (source.block.w - sq) * cv,
      };
      const mk = interpolate(
        t,
        [
          sw.morphAt + j * MORPH_STAGGER,
          sw.morphAt + j * MORPH_STAGGER + MORPH,
        ],
        [0, 1],
        { ...CLAMP, easing: EASE_IN_OUT },
      );
      rect = lerpRect(coverRect, target.block, mk);
      if (splitting && t < sw.morphAt) alpha = 0;
      if (!splitting && t < sw.start + j * STAGGER) alpha = 0;
      if (merging && mk >= 1) alpha = 0;
      fill =
        interpolate(t, [sw.morphAt, sw.morphAt + 6], [0, 1], CLAMP) *
        (1 - interpolate(t, [sw.textAt - 2, sw.textAt + 4], [0, 1], CLAMP));
      if (!splitting && t < sw.morphAt + 4) {
        inner = {
          w: source,
          o: 1 - interpolate(t, [sw.morphAt, sw.morphAt + 4], [0, 1], CLAMP),
        };
      }
    } else {
      const at = OPEN_SPAWN + j * STAGGER;
      const run = interpolate(t, [at, at + RUN + 2], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const sq = target.block.h;
      rect = { ...target.block, w: sq + (target.block.w - sq) * run };
      alpha = interpolate(t, [at - 2, at + 2], [0, 1], CLAMP);
      fill = 1 - interpolate(t, [sw.textAt - 2, sw.textAt + 4], [0, 1], CLAMP);
    }

    if (!merging && t >= sw.textAt) {
      inner = {
        w: target,
        o: interpolate(t, [sw.textAt, sw.textAt + TEXT_IN], [0, 1], CLAMP),
      };
    }
    const keep = j === hiIndex;
    if (!merging && !keep && t >= sw.uncoverAt) {
      const off = sw.uncoverAt + j * STAGGER;
      const u = interpolate(t, [off, off + RUN], [0, 1], {
        ...CLAMP,
        easing: EASE_WIPE,
      });
      const right = target.block.x + target.block.w;
      const left = target.block.x + target.block.w * u;
      rect = { ...target.block, x: left, w: right - left };
      if (rect.w < F * 0.03) alpha = 0;
    }
    const pillOn = keep
      ? interpolate(t, [sw.uncoverAt + 2, sw.uncoverAt + 12], [0, 1], {
          ...CLAMP,
          easing: EASE_IN_OUT,
        })
      : 0;
    if (alpha <= 0.001) continue;

    nodes.push(
      <div
        key={`blk-${j}`}
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          borderRadius: Math.min(r, rect.w / 2),
          overflow: "hidden",
          opacity: alpha,
          background: c.ink,
        }}
      >
        {fill > 0 ? (
          <div
            style={{
              position: "absolute",
              left: -rect.x,
              top: -rect.y,
              width: W * 2,
              height: H,
              backgroundImage: shimmer,
              backgroundSize: `${W}px ${H}px`,
              backgroundRepeat: "repeat-x",
              transform: `translateX(${(-((drift * W) % W)).toFixed(2)}px)`,
              opacity: fill,
            }}
          />
        ) : null}
        {pillOn > 0 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: pill,
              opacity: pillOn,
            }}
          />
        ) : null}
        {inner && inner.o > 0 ? (
          <div style={{ opacity: inner.o }}>
            {wordAt(
              inner.w,
              pillOn > 0
                ? interpolateColors(pillOn, [0, 0.3], [c.bg, "#FFFFFF"])
                : c.bg,
              rect.x,
              rect.y,
            )}
          </div>
        ) : null}
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
