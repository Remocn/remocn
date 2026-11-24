"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
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
  CELL,
  DEFAULT_TITLE,
  type GridCellElementId,
  gridCellTimeline,
} from "./timeline";

const geist = loadGeist("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface GridCellProps {
  /** Typed into the lit cell. */
  title?: string;
  /** Tiny mono label in the cell's top-left corner. */
  label?: string;
  /** Frames between typed characters. */
  stagger?: number;
  /** Grid cell size at 1280 wide; 80 tiles the frame 16 × 9. */
  cellSize?: number;
  /** Caret and the label's marker. */
  accent?: string;
  /** Text color of the headline; overrides the theme. */
  ink?: string;
  background?: string;
  /** Typeface for the headline. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Size of the grid and cell, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the grid, the cell, the label, the typing and
   * the dim, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<GridCellElementId>;
}

const THEMES = {
  dark: {
    bg: "#0A0A0A",
    line: "rgba(255,255,255,0.11)",
    edge: "rgba(255,255,255,0.34)",
    tick: "rgba(255,255,255,0.7)",
    fill: "rgba(255,255,255,0.025)",
    wash: "rgba(255,255,255,0.035)",
    fg: "#EDEDED",
    muted: "#8A8A8F",
  },
  light: {
    bg: "#FAFAF9",
    line: "rgba(10,10,10,0.09)",
    edge: "rgba(10,10,10,0.3)",
    tick: "rgba(10,10,10,0.62)",
    fill: "rgba(10,10,10,0.018)",
    wash: "rgba(255,255,255,0.55)",
    fg: "#0F0F10",
    muted: "#77777C",
  },
} as const;

const FONT_SIZE = 54;
const TRACK = -0.035;
const PAD_X = 0.9; // em of air either side of the headline inside the cell

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

/** Headline width in em, measured once the face is ready. */
function useTitleWidth(title: string, fontFamily: string) {
  const [width, setWidth] = useState<number | null>(null);
  const [handle] = useState(() => delayRender("grid-cell: measuring"));
  const released = useRef(false);

  useEffect(() => {
    let live = true;
    const font = `400 100px "${fontFamily}"`;
    Promise.all([geist.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        let w = [...title].length * 0.52;
        if (ctx) {
          ctx.font = font;
          w = ctx.measureText(title).width / 100 + TRACK * [...title].length;
        }
        setWidth(w);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [title, handle, fontFamily]);

  return width ?? [...title].length * 0.52;
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

export function GridCell(props: GridCellProps) {
  const {
    title = DEFAULT_TITLE,
    label = "v2.0",
    cellSize = CELL,
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = geist.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    gridCellTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const gridEl = tl.get("grid");
  const edgeEl = tl.get("edge");
  const mergeEl = tl.get("merge");
  const labelEl = tl.get("label");
  const titleEl = tl.get("title");
  const dimEl = tl.get("dim");
  const c = THEMES[theme];
  const fg = ink ?? c.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const s = Math.min(W / 1280, H / 720);
  const cell = cellSize * s;
  const fontSize = FONT_SIZE * s;
  const cx = W / 2;
  const cy = H / 2;

  // The lit cell: two rows tall, an even number of columns so it stays centred
  // on the grid's middle line.
  const titleEm = useTitleWidth(title, fontFamily);
  let cols = Math.ceil(((titleEm + PAD_X * 2) * fontSize) / cell);
  if (cols % 2 === 1) cols += 1;
  cols = Math.max(4, cols);
  const cw = cols * cell;
  const ch = 2 * cell;
  const x0 = cx - cw / 2;
  const y0 = cy - ch / 2;

  // Grid lines, symmetric around the centre.
  const kx = Math.ceil(cx / cell);
  const ky = Math.ceil(cy / cell);
  const verticals: number[] = [];
  const horizontals: number[] = [];
  for (let k = -kx; k <= kx; k++) verticals.push(k);
  for (let k = -ky; k <= ky; k++) horizontals.push(k);

  const grow = (k: number) =>
    interpolate(
      frame,
      [
        gridEl.start + Math.abs(k) * gridEl.beat("step"),
        gridEl.start + Math.abs(k) * gridEl.beat("step") + gridEl.beat("grow"),
      ],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );

  const merge = interpolate(frame, [mergeEl.start, mergeEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const edge = interpolate(frame, [edgeEl.start, edgeEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const ticks = interpolate(
    frame,
    [
      labelEl.start + labelEl.beat("ticksIn"),
      labelEl.start + labelEl.beat("ticksDone"),
    ],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const labelIn = interpolate(frame, [labelEl.start, labelEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const dim = interpolate(frame, [dimEl.start, dimEl.end], [1, 0.5], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const chars = [...title];
  const typed = Math.max(
    0,
    Math.min(
      chars.length,
      Math.floor((frame - titleEl.start) / titleEl.beat("perChar")) + 1,
    ),
  );
  const typingDone = titleEl.end;
  const caretOn =
    frame >= titleEl.start + titleEl.beat("caretOn") &&
    (frame < typingDone + 6 || Math.floor((frame - typingDone) / 15) % 2 === 1);
  const caretIn = interpolate(
    frame,
    [
      titleEl.start + titleEl.beat("caretIn"),
      titleEl.start + titleEl.beat("caretFull"),
    ],
    [0, 1],
    CLAMP,
  );

  // Edges of the cell brighten from each edge's midpoint outward.
  const edgeSegs = [
    { x1: cx, y1: y0, dx: cw / 2, dy: 0 },
    { x1: cx, y1: y0 + ch, dx: cw / 2, dy: 0 },
    { x1: x0, y1: cy, dx: 0, dy: ch / 2 },
    { x1: x0 + cw, y1: cy, dx: 0, dy: ch / 2 },
  ];
  const arm = 7 * s;
  const corners = [
    [x0, y0],
    [x0 + cw, y0],
    [x0, y0 + ch],
    [x0 + cw, y0 + ch],
  ];

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <radialGradient
              id={`${uid}-vig`}
              cx={cx}
              cy={cy}
              r={Math.hypot(cx, cy)}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#fff" stopOpacity={1} />
              <stop offset="0.38" stopColor="#fff" stopOpacity={0.8} />
              <stop offset="0.85" stopColor="#fff" stopOpacity={0.14} />
              <stop offset="1" stopColor="#fff" stopOpacity={0.04} />
            </radialGradient>
            <mask
              id={`${uid}-mask`}
              maskUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={W}
              height={H}
            >
              <rect width={W} height={H} fill={`url(#${uid}-vig)`} />
              <rect
                x={x0}
                y={y0}
                width={cw}
                height={ch}
                fill="#000"
                fillOpacity={merge}
              />
            </mask>
            <radialGradient
              id={`${uid}-wash`}
              cx={x0}
              cy={y0}
              r={cw * 0.7}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor={c.wash} />
              <stop offset="1" stopColor={c.wash} stopOpacity={0} />
            </radialGradient>
          </defs>

          <g mask={`url(#${uid}-mask)`} opacity={dim}>
            {verticals.map((k) => {
              const x = cx + k * cell;
              const p = grow(k);
              if (p <= 0) return null;
              const half = (H / 2 + cell) * p;
              return (
                <line
                  key={`v${k}`}
                  x1={x}
                  x2={x}
                  y1={cy - half}
                  y2={cy + half}
                  stroke={c.line}
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
              );
            })}
            {horizontals.map((k) => {
              const y = cy + k * cell;
              const p = grow(k * 1.6);
              if (p <= 0) return null;
              const half = (W / 2 + cell) * p;
              return (
                <line
                  key={`h${k}`}
                  x1={cx - half}
                  x2={cx + half}
                  y1={y}
                  y2={y}
                  stroke={c.line}
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
              );
            })}
          </g>

          {/* The lit cell */}
          <rect
            x={x0}
            y={y0}
            width={cw}
            height={ch}
            fill={c.fill}
            opacity={merge}
          />
          <rect
            x={x0}
            y={y0}
            width={cw}
            height={ch}
            fill={`url(#${uid}-wash)`}
            opacity={merge * (theme === "dark" ? 1 : 0.8)}
          />
          {edgeSegs.map((e) => (
            <line
              key={`${e.x1}-${e.y1}-${e.dx}`}
              x1={e.x1 - e.dx * edge}
              x2={e.x1 + e.dx * edge}
              y1={e.y1 - e.dy * edge}
              y2={e.y1 + e.dy * edge}
              stroke={c.edge}
              strokeWidth={1}
              shapeRendering="crispEdges"
              opacity={edge > 0 ? 1 : 0}
            />
          ))}
          <g opacity={ticks}>
            {corners.map(([x, y]) => (
              <g key={`${x}-${y}`} stroke={c.tick} strokeWidth={1}>
                <line
                  x1={x - arm}
                  x2={x + arm}
                  y1={y}
                  y2={y}
                  shapeRendering="crispEdges"
                />
                <line
                  x1={x}
                  x2={x}
                  y1={y - arm}
                  y2={y + arm}
                  shapeRendering="crispEdges"
                />
              </g>
            ))}
          </g>
        </svg>

        {/* Corner label */}
        <div
          style={{
            position: "absolute",
            left: x0 + 14 * s,
            top: y0 + 12 * s,
            display: "flex",
            alignItems: "center",
            gap: 7 * s,
            fontFamily: geistMono.fontFamily,
            fontWeight: 400,
            fontSize: 12 * s,
            letterSpacing: "0.02em",
            lineHeight: 1,
            color: c.muted,
            opacity: labelIn,
            filter: `blur(${(1 - labelIn) * 6 * s}px)`,
            transform: `translateY(${(1 - labelIn) * 6 * s}px)${glide(midway(labelIn))}`,
          }}
        >
          <span
            style={{
              width: 5 * s,
              height: 5 * s,
              background: accent,
              display: "block",
            }}
          />
          {label}
        </div>

        {/* Headline, typed in place: untyped glyphs keep their slot */}
        <div
          style={{
            position: "absolute",
            left: x0,
            top: y0,
            width: cw,
            height: ch,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: 400,
              fontSize,
              letterSpacing: `${TRACK}em`,
              lineHeight: 1,
              color: fg,
              whiteSpace: "pre",
              fontKerning: "normal",
              transform: `translateY(${4 * s}px)`,
            }}
          >
            <span>{chars.slice(0, typed).join("")}</span>
            <span
              style={{
                position: "relative",
                display: "inline-block",
                width: 0,
                height: "1em",
                verticalAlign: "-0.12em",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0.04 * fontSize,
                  top: 0.02 * fontSize,
                  width: Math.max(2, 2.5 * s),
                  height: 0.96 * fontSize,
                  background: accent,
                  opacity: caretOn ? caretIn : 0,
                }}
              />
            </span>
            <span style={{ visibility: "hidden" }}>
              {chars.slice(typed).join("")}
            </span>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
