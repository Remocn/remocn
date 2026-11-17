"use client";

import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/** gradients.sh "fluted" palette: deep blue, blue, orange, cream. The blue takes the accent. */
const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;

function flutedFill(angle: number, accent: string, flute: number) {
  return [
    `repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0) ${flute * 0.45}px, rgba(0,0,0,0.07) ${flute * 0.9}px, rgba(255,255,255,0.05) ${flute}px)`,
    `linear-gradient(${angle}deg, ${FLUTED[0]} 0%, ${accent} 46%, ${FLUTED[2]} 84%, ${FLUTED[3]} 100%)`,
  ].join(", ");
}

export interface TreemapItem {
  label: string;
  value: number;
}

export interface TreemapSplitProps {
  items?: TreemapItem[];
  highlight?: number;
  accent?: string;
  /** Text color of the cell labels; overrides the theme. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the labels and figure. Load it yourself; Schibsted Grotesk by default. */
  fontFamily?: string;
  /** Frames each split takes to draw its line and open. */
  split?: number;
  /** Corner radius of the cells, in px at 720p. */
  radius?: number;
  grain?: boolean;
  /** Size of the treemap, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_ITEMS: TreemapItem[] = [
  { label: "Captions", value: 38 },
  { label: "Transitions", value: 16 },
  { label: "Text", value: 12 },
  { label: "Backgrounds", value: 9 },
  { label: "Shaders", value: 8 },
  { label: "Icons", value: 6 },
  { label: "Charts", value: 5 },
  { label: "UI", value: 4 },
  { label: "Effects", value: 2 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SLIDE = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    cell: "#1A1A1D",
    edge: "rgba(255,255,255,0.06)",
    hair: "rgba(255,255,255,0.55)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    cell: "#E4E2DC",
    edge: "rgba(18,18,20,0.05)",
    hair: "rgba(18,18,20,0.5)",
    grain: 0.045,
  },
} as const;

const T0 = 12;
const STEP = 16;
const SPLIT = 22;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TNode {
  id: string;
  leaf: number | null;
  depth: number;
  vertical: boolean;
  f: number;
  start: number;
  a: TNode | null;
  b: TNode | null;
}

function worst(idx: number[], vals: number[], w: number, h: number): number {
  if (idx.length === 1) {
    const a = Math.max(w / Math.max(h, 1e-6), h / Math.max(w, 1e-6));
    return vals[idx[0]] * Math.log(a) * (a > 2.2 ? 2 : 1);
  }
  const sum = idx.reduce((s, i) => s + vals[i], 0) || 1;
  const vertical = w >= h;
  let best = Number.POSITIVE_INFINITY;
  let acc = 0;
  for (let j = 0; j < idx.length - 1; j++) {
    acc += vals[idx[j]];
    const ff = acc / sum;
    const s =
      worst(
        idx.slice(0, j + 1),
        vals,
        vertical ? w * ff : w,
        vertical ? h : h * ff,
      ) +
      worst(
        idx.slice(j + 1),
        vals,
        vertical ? w * (1 - ff) : w,
        vertical ? h : h * (1 - ff),
      );
    if (s < best) best = s;
  }
  return best;
}

function build(
  idx: number[],
  vals: number[],
  w: number,
  h: number,
  depth: number,
  id: string,
  stagger: number,
): TNode {
  const start = T0 + depth * STEP + stagger;
  if (idx.length === 1) {
    return {
      id,
      leaf: idx[0],
      depth,
      vertical: true,
      f: 1,
      start,
      a: null,
      b: null,
    };
  }
  const sum = idx.reduce((s, i) => s + vals[i], 0) || 1;
  const vertical = w >= h;
  let k = 1;
  let best = Number.POSITIVE_INFINITY;
  let acc = 0;
  for (let j = 0; j < idx.length - 1; j++) {
    acc += vals[idx[j]];
    const ff = acc / sum;
    const s =
      worst(
        idx.slice(0, j + 1),
        vals,
        vertical ? w * ff : w,
        vertical ? h : h * ff,
      ) +
      worst(
        idx.slice(j + 1),
        vals,
        vertical ? w * (1 - ff) : w,
        vertical ? h : h * (1 - ff),
      );
    if (s < best - 1e-6) {
      best = s;
      k = j + 1;
    }
  }
  const left = idx.slice(0, k);
  const right = idx.slice(k);
  const f = left.reduce((s, i) => s + vals[i], 0) / sum;
  const aw = vertical ? w * f : w;
  const ah = vertical ? h : h * f;
  const bw = vertical ? w - aw : w;
  const bh = vertical ? h : h - ah;
  return {
    id,
    leaf: null,
    depth,
    vertical,
    f,
    start,
    a: build(left, vals, aw, ah, depth + 1, `${id}a`, stagger),
    b: build(right, vals, bw, bh, depth + 1, `${id}b`, stagger + 2),
  };
}

interface Cell {
  key: string;
  rect: Rect;
  leaf: number | null;
  settle: number;
}

interface Line {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  draw: number;
  fade: number;
}

function lastEnd(n: TNode, split: number): number {
  if (!n.a || !n.b) return 0;
  return Math.max(n.start + split, lastEnd(n.a, split), lastEnd(n.b, split));
}

function layout(
  n: TNode,
  r: Rect,
  t: number,
  gap: number,
  cells: Cell[],
  lines: Line[],
  settle: number,
  split: number,
) {
  if (!n.a || !n.b || t < n.start) {
    cells.push({ key: n.id, rect: r, leaf: n.leaf, settle });
    return;
  }
  const p = (t - n.start) / split;
  const draw = interpolate(p, [0, 0.38], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const open = interpolate(p, [0.28, 1], [0, 1], {
    ...CLAMP,
    easing: EASE_SLIDE,
  });
  const f = 0.5 + (n.f - 0.5) * open;
  const g = gap * open;
  const end = n.start + split;
  let ra: Rect;
  let rb: Rect;
  if (n.vertical) {
    const cut = r.x + (r.w - g) * f;
    ra = { x: r.x, y: r.y, w: cut - r.x, h: r.h };
    rb = { x: cut + g, y: r.y, w: r.x + r.w - cut - g, h: r.h };
    lines.push({
      key: n.id,
      x1: cut + g / 2,
      y1: r.y,
      x2: cut + g / 2,
      y2: r.y + r.h,
      draw,
      fade: 1 - open,
    });
  } else {
    const cut = r.y + (r.h - g) * f;
    ra = { x: r.x, y: r.y, w: r.w, h: cut - r.y };
    rb = { x: r.x, y: cut + g, w: r.w, h: r.y + r.h - cut - g };
    lines.push({
      key: n.id,
      x1: r.x,
      y1: cut + g / 2,
      x2: r.x + r.w,
      y2: cut + g / 2,
      draw,
      fade: 1 - open,
    });
  }
  layout(n.a, ra, t, gap, cells, lines, end, split);
  layout(n.b, rb, t, gap, cells, lines, end, split);
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
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

export function TreemapSplit({
  items = DEFAULT_ITEMS,
  highlight,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = sans,
  split = SPLIT,
  radius: corner = 6,
  grain = true,
  scale: zoom = 1,
  delay = 0,
  theme = "dark",
  speed = 1,
}: TreemapSplitProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? p.bg);

  const list = useMemo(
    () =>
      items
        .map((it, i) => ({ ...it, i, value: Math.max(0, it.value) }))
        .filter((it) => it.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [items],
  );
  const total = list.reduce((s, x) => s + x.value, 0) || 1;
  const hl = (() => {
    if (highlight === undefined) return 0;
    const at = list.findIndex((x) => x.i === highlight);
    return at < 0 ? 0 : at;
  })();

  const mx = width * 0.07;
  const my = height * 0.1;
  const root: Rect = { x: mx, y: my, w: width - mx * 2, h: height - my * 2 };
  const gap = 8 * u;
  const radius = corner * u;

  const tree = useMemo(
    () =>
      build(
        list.map((_, i) => i),
        list.map((x) => x.value),
        root.w,
        root.h,
        0,
        "n",
        0,
      ),
    [list, root.w, root.h],
  );
  const splitsDone = Math.max(lastEnd(tree, split), T0);
  const ACC = splitsDone + 8;

  const cells: Cell[] = [];
  const lines: Line[] = [];
  layout(tree, root, t, gap, cells, lines, 0, split);

  const enter = interpolate(t, [0, 14], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const push = interpolate(t, [0, ACC + 50], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = (0.94 + 0.06 * enter) * (0.985 + 0.015 * push);

  const fill = interpolate(t, [ACC, ACC + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const preFill = interpolate(t, [ACC - 8, ACC + 2], [0, 1], CLAMP);
  const heroIn = interpolate(t, [ACC + 10, ACC + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const heroLab = interpolate(t, [ACC + 18, ACC + 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [ACC + 10, ACC + 36], [0.55, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const dimOthers = interpolate(t, [ACC, ACC + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={zoom}>
        <AbsoluteFill
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "50% 50%",
            opacity: enter,
          }}
        >
          {cells.map((c) => {
            const isHl = c.leaf === hl;
            const item = c.leaf !== null ? list[c.leaf] : null;
            const pct = item ? Math.round((item.value / total) * 100) : 0;
            const roomy = c.rect.w >= 120 * u && c.rect.h >= 70 * u;
            const labA =
              item && roomy
                ? interpolate(t, [c.settle - 4, c.settle + 12], [0, 1], {
                    ...CLAMP,
                    easing: EASE_OUT,
                  })
                : 0;
            const smallLab = isHl ? labA * (1 - preFill) : labA;
            const heroFont = Math.min(
              136 * u,
              c.rect.h * 0.42,
              c.rect.w / (String(pct).length * 0.58 + 0.75),
            );
            const cellStyle: React.CSSProperties = {
              position: "absolute",
              left: c.rect.x,
              top: c.rect.y,
              width: Math.max(0, c.rect.w),
              height: Math.max(0, c.rect.h),
              borderRadius: radius,
              background: p.cell,
              boxShadow: `inset 0 0 0 ${Math.max(1, u)}px ${p.edge}`,
              overflow: "hidden",
            };
            return (
              <div key={c.key} style={cellStyle}>
                {isHl ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: flutedFill(10 + 8 * push, accent, 26 * u),
                      clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)`,
                    }}
                  />
                ) : null}
                {item ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 16 * u,
                      top: 14 * u,
                      display: "flex",
                      flexDirection: "column",
                      gap: 3 * u,
                      opacity: smallLab * (isHl ? 1 : 1 - 0.35 * dimOthers),
                      transform: `translateY(${(1 - labA) * 6 * u}px)`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily,
                        fontWeight: 500,
                        fontSize: 18 * u,
                        letterSpacing: "-0.01em",
                        color: fg,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontFamily,
                        fontWeight: 400,
                        fontSize: 15 * u,
                        color: p.muted,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                ) : null}
                {isHl && item ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 26 * u,
                      bottom: 18 * u,
                      display: "flex",
                      flexDirection: "column",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily,
                        fontWeight: 400,
                        fontSize: 28 * u,
                        letterSpacing: "-0.015em",
                        color: "rgba(255,255,255,0.92)",
                        opacity: heroLab,
                        transform: `translateY(${(1 - heroLab) * 8 * u}px)`,
                        marginLeft: 4 * u,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontFamily,
                        fontWeight: 500,
                        fontSize: heroFont,
                        lineHeight: 1,
                        letterSpacing: "-0.05em",
                        color: "#FFFFFF",
                        fontVariantNumeric: "tabular-nums",
                        opacity: heroIn,
                        filter:
                          heroIn < 0.99
                            ? `blur(${(1 - heroIn) * 8 * u}px)`
                            : undefined,
                        transform: `translateY(${(1 - heroIn) * 20 * u}px)`,
                      }}
                    >
                      {Math.round(pct * count)}
                      <span
                        style={{
                          fontSize: heroFont * 0.55,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        %
                      </span>
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            {lines.map((l) => {
              if (l.draw <= 0 || l.fade <= 0) return null;
              const x2 = l.x1 + (l.x2 - l.x1) * l.draw;
              const y2 = l.y1 + (l.y2 - l.y1) * l.draw;
              return (
                <line
                  key={l.key}
                  x1={l.x1}
                  y1={l.y1}
                  x2={x2}
                  y2={y2}
                  stroke={p.hair}
                  strokeWidth={Math.max(1, 1.25 * u)}
                  opacity={l.fade}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      </ScaleLayer>
      {transparent ? null : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 65%, ${stage} 100%)`,
            opacity: 0.5,
          }}
        />
      )}
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
