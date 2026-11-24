"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import { useId } from "react";
import { AbsoluteFill, Easing, Img, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_LINES,
  FIRST_PASS,
  linesOf,
  PASS_GAP,
  PASS_LEN,
  type PassSwapElementId,
  passSwapTimeline,
} from "./timeline";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

/**
 * gradients.sh "fluted": ink blue, electric blue, ember orange, cream. The
 * objects carry it (the blue slot takes the accent) and so does the last word.
 */
const FLUTED = {
  bg: "#050507",
  colors: ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"],
} as const;

export interface PassSwapProps {
  /** Headlines in order; each pass of the object swaps to the next one. */
  lines?: string[];
  /** Object when no `src` is given; "mixed" alternates slab and disc per pass. */
  shape?: "slab" | "disc" | "mixed";
  /** A product cutout (transparent PNG) to sweep instead of the shape. */
  src?: string;
  /** Fill the last word of the final line with the object gradient. */
  accentLastWord?: boolean;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the headline. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  /** Frames one pass of the object takes to cross the frame. */
  passLength?: number;
  /** Frames from the start of one pass to the start of the next. */
  passGap?: number;
  /** Size of the headline and object, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the intro and single passes, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<PassSwapElementId>;
}

// Beat sheet (30fps), for three lines / two passes:
//  0–20    first line settles in (rise + unblur)
//  30–60   pass 1, left → right: the object crosses in front of the line;
//          behind its center line the headline has already become line 2
//  60–76   hold on line 2
//  76–106  pass 2, right → left, swaps to the final line
//  106–150 hold on the final line (poster frame)
const FINAL_HOLD = 44;

export function passSwapDuration(lineCount = 3) {
  const passes = Math.max(1, lineCount - 1);
  return FIRST_PASS + (passes - 1) * PASS_GAP + PASS_LEN + FINAL_HOLD;
}

const SWEEP = Easing.bezier(0.62, 0, 0.36, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F2F1EE",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    grain: 0.04,
  },
} as const;

function Grain({ opacity }: { opacity: number }) {
  const id = `ps-grain-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={2}
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** Polygon (px) covering the half-plane on one side of a tilted line. */
function halfPlane(
  cx: number,
  cy: number,
  angleDeg: number,
  side: 1 | -1,
  L: number,
) {
  const th = (angleDeg * Math.PI) / 180;
  const ax = Math.sin(th);
  const ay = -Math.cos(th);
  const nx = Math.cos(th) * side;
  const ny = Math.sin(th) * side;
  const pts = [
    [cx + ax * L, cy + ay * L],
    [cx + ax * L + nx * L, cy + ay * L + ny * L],
    [cx - ax * L + nx * L, cy - ay * L + ny * L],
    [cx - ax * L, cy - ay * L],
  ];
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(", ")})`;
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

export function PassSwap(props: PassSwapProps) {
  const {
    lines = DEFAULT_LINES,
    shape = "mixed",
    src,
    accentLastWord = true,
    accent = "#3B5BFD",
    ink: inkProp,
    background,
    fontFamily = display,
    scale = 1,
    delay = 0,
    grain = true,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    passSwapTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const u = H / 720;
  const c = THEMES[theme];
  const fg = inkProp ?? c.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const blurId = `ps-blur-${uid}`;

  const safeLines = linesOf(lines);
  const passes = Math.max(0, safeLines.length - 1);
  const longest = Math.max(...safeLines.map((l) => l.length), 1);
  // Hanken Grotesk 500 at -0.035em averages ~0.47em per character.
  const fs = Math.min(150 * u, (W * 0.86) / (longest * 0.47));

  // Which pass is live (or last finished).
  const passAt = (i: number) => tl.get(`pass:${i}`);
  let index = 0;
  let passP = -1;
  for (let i = 0; i < passes; i++) {
    const t0 = passAt(i).start;
    if (frame >= t0) {
      index = i;
      passP = (frame - t0) / passAt(i).length;
    }
  }
  const passLength = passes > 0 ? passAt(index).length : 1;
  const passing = passP >= 0 && passP < 1;
  const done = passP >= 1;
  const dir: 1 | -1 = index % 2 === 0 ? 1 : -1;

  // Object size: tall enough to hide the swap line across the whole cap height.
  const isDisc =
    !src && (shape === "disc" || (shape === "mixed" && index % 2 === 1));
  const ow = src ? H * 0.62 : isDisc ? H * 0.7 : H * 0.34;
  const oh = src ? H * 0.82 : isDisc ? H * 0.7 : H * 0.92;
  const radius = isDisc ? oh / 2 : ow / 2;

  const travel = W + ow * 1.6;
  const sweepAt = (p: number) => {
    const e = SWEEP(Math.min(1, Math.max(0, p)));
    const x = -ow * 0.8 + e * travel;
    return dir === 1 ? x : W - x;
  };
  const cx = sweepAt(passP);
  const vel =
    Math.abs(
      sweepAt(passP + 0.5 / passLength) - sweepAt(passP - 0.5 / passLength),
    ) * speed;
  const tilt = dir * interpolate(passP, [0, 1], [11, 4], CLAMP);
  const cy = H / 2 + interpolate(passP, [0, 0.5, 1], [10, 0, -10], CLAMP) * u;

  const fromLine = safeLines[Math.min(index, safeLines.length - 1)];
  const toLine = safeLines[Math.min(index + 1, safeLines.length - 1)];
  const current = passes === 0 ? safeLines[0] : done ? toLine : fromLine;

  // First line arrives.
  const introEl = tl.get("intro");
  const intro = interpolate(frame, [introEl.start, introEl.end], [0, 1], {
    ...CLAMP,
    easing: SETTLE,
  });
  // New line is dragged a touch by the object and settles.
  // Only read once a pass is done, so there is a pass to read.
  const tStart = passes > 0 ? passAt(index).start : 0;
  const settleFor = passes > 0 ? passAt(index).beat("settle") : 0;
  const drag = interpolate(
    frame,
    [tStart + passLength * 0.3, tStart + passLength + settleFor],
    [1, 0],
    { ...CLAMP, easing: SETTLE },
  );
  const toOffset = -dir * 26 * u * drag;

  // The last word takes the palette's warm end on dark, the deep end on light.
  const ink =
    theme === "dark"
      ? [
          FLUTED.colors[2],
          `color-mix(in oklab, ${FLUTED.colors[2]} 50%, ${FLUTED.colors[3]})`,
          FLUTED.colors[3],
        ]
      : [
          FLUTED.colors[0],
          accent,
          `color-mix(in oklab, ${accent} 70%, ${FLUTED.colors[2]})`,
        ];

  const finalIdx = safeLines.length - 1;
  const renderLine = (text: string, lineIdx: number) => {
    const isFinal = lineIdx === finalIdx && accentLastWord && passes > 0;
    const cut = isFinal ? text.trimEnd().lastIndexOf(" ") : -1;
    const head = cut >= 0 ? text.slice(0, cut + 1) : text;
    const tail = cut >= 0 ? text.slice(cut + 1) : "";
    return (
      <div
        style={{
          fontFamily,
          fontWeight: 500,
          fontSize: fs,
          letterSpacing: "-0.035em",
          lineHeight: 1,
          color: fg,
          whiteSpace: "pre",
          textAlign: "center",
        }}
      >
        {head}
        {tail && (
          <span
            style={{
              backgroundImage: `linear-gradient(100deg, ${ink.join(", ")})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              // keeps the clip box wide enough for the final glyph's overhang
              paddingRight: "0.04em",
              marginRight: "-0.04em",
            }}
          >
            {tail}
          </span>
        )}
      </div>
    );
  };

  const lineBox = (
    text: string,
    lineIdx: number,
    extra: React.CSSProperties,
  ) => (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        ...extra,
      }}
    >
      {renderLine(text, lineIdx)}
    </AbsoluteFill>
  );

  const L = W * 3;
  const blur = Math.min(vel * 0.09, 14 * u);

  // One palette, two flat readings: the slab is a blue column warming at its
  // foot, the disc a low sun going from cream to ember to blue. The angle
  // drifts a few degrees with the pass.
  const [f0, , f2, f3] = FLUTED.colors;
  const f1 = accent;
  const drift = passP * 10;
  const slabFill = `linear-gradient(${180 - drift}deg, ${f0} 0%, ${f1} 42%, color-mix(in oklab, ${f1} 50%, ${f2}) 74%, ${f2} 100%)`;
  const discFill = `linear-gradient(${170 + drift}deg, ${f3} 0%, color-mix(in oklab, ${f3} 40%, ${f2}) 26%, ${f2} 52%, color-mix(in oklab, ${f2} 45%, ${f1}) 78%, ${f1} 100%)`;

  const object = src ? (
    <Img
      src={src}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  ) : (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: radius,
        background: isDisc ? discFill : slabFill,
        boxShadow: `inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.08)`,
      }}
    />
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter
          id={blurId}
          x="-40%"
          y="-10%"
          width="180%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>

      <ScaleLayer scale={scale}>
        {passing ? (
          <>
            {lineBox(fromLine, index, {
              clipPath: halfPlane(cx, cy, tilt, dir, L),
            })}
            {lineBox(toLine, index + 1, {
              clipPath: halfPlane(cx, cy, tilt, -dir as 1 | -1, L),
              transform: `translateX(${toOffset}px)`,
            })}
          </>
        ) : (
          lineBox(current, done ? index + 1 : index, {
            opacity: index === 0 && !done ? intro : 1,
            transform: `translateX(${done ? toOffset : 0}px) translateY(${index === 0 && !done ? (1 - intro) * 14 * u : 0}px)${glide(index === 0 && !done && midway(intro))}`,
            filter:
              index === 0 && !done && intro < 1
                ? `blur(${(1 - intro) * 10 * u}px)`
                : undefined,
          })
        )}

        {passing && (
          <div
            style={{
              // Laid out once at the frame's left edge; the sweep is a
              // transform, since layout rounds the object's edges to whole
              // pixels and it would step along unevenly.
              position: "absolute",
              left: -ow / 2,
              top: H / 2 - oh / 2,
              width: ow,
              height: oh,
              transform: `translate(${cx}px, ${cy - H / 2}px) rotate(${tilt}deg)`,
              filter: blur > 0.4 ? `url(#${blurId})` : undefined,
            }}
          >
            {object}
          </div>
        )}
      </ScaleLayer>

      {grain ? <Grain opacity={c.grain} /> : null}
    </AbsoluteFill>
  );
}
