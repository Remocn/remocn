"use client";

import { loadFont } from "@remotion/google-fonts/Newsreader";
import type React from "react";
import { useId } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import {
  type ResolvedElement,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  type ColumnReflowElementId,
  columnReflowTimeline,
  DEFAULT_TEXT,
  layout,
  motionEnd,
  NARROW_EM,
  type Placed,
  SERIF_SCALE,
  serifEm,
  TRACK,
  toWords,
  X_START,
} from "./timeline";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadFont("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

// gradients.sh "swirl" palette (bg #07060a): #ffe2c4, #ff9a4d, #d2456b, #3a1f6b.
const SWIRL = ["#ffe2c4", "#ff9a4d", "#d2456b", "#3a1f6b"] as const;

export interface ColumnReflowProps {
  text?: string;
  accentWord?: string;
  direction?: "widen" | "narrow";
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the roman words. Load it yourself; Newsreader by default. */
  fontFamily?: string;
  /** Width of the narrow column, in ems of the type. */
  measure?: number;
  /** Size of the paragraph, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the rows rising in, the slide, the close, the
   * accent and the guides, by the ids in `./timeline`. Frames on the scene
   * timeline, after `delay` and `speed`.
   */
  timing?: Timing<ColumnReflowElementId>;
}

const LEADING = 1.3;
const BASELINE_SANS = 0.735;
const BASELINE_SERIF = 0.735;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_Y = Easing.bezier(0.55, 0, 0.25, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.16)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.9)",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    grain: 0.045,
  },
} as const;

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
          baseFrequency="0.9"
          numOctaves={2}
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/**
 * Motion progress for a word at virtual time v (widen direction), with the
 * slide and the close starting at `slideAt` and `closeAt` in that time.
 */
function progress(
  p: Placed,
  R: number,
  v: number,
  slide: ResolvedElement<ColumnReflowElementId>,
  slideAt: number,
  close: ResolvedElement<ColumnReflowElementId>,
  closeAt: number,
) {
  const order = p.dir < 0 ? p.slot : p.rowLen - 1 - p.slot;
  const xs = slideAt + p.row * slide.beat("row") + order * slide.beat("word");
  const px = interpolate(v, [xs, xs + slide.beat("move")], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const ys = closeAt + Math.abs(p.row - (R - 1) / 2) * close.beat("row");
  const py = interpolate(v, [ys, ys + close.beat("move")], [0, 1], {
    ...CLAMP,
    easing: EASE_Y,
  });
  return { px, py };
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

export function ColumnReflow(props: ColumnReflowProps) {
  const {
    text = DEFAULT_TEXT,
    accentWord = "room",
    direction = "widen",
    ink,
    background,
    fontFamily = sans,
    measure = NARROW_EM,
    scale = 1,
    delay = 0,
    grain = true,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    columnReflowTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const u = H / 720;
  const c = THEMES[theme];
  const fg = ink ?? c.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const words = toWords(text, accentWord);
  const { placed, R, T, wide, narrow } = layout(words, measure);
  const F = Math.min(56 * u, (W * 0.86) / wide, (H * 0.74) / (R * LEADING));
  const L = F * LEADING;
  const cx = W / 2;
  const cy = H / 2 + 0.28 * F;

  const narrowing = direction === "narrow";
  // Narrowing plays the widening reflow backwards: virtual time v = K - t.
  // Every motion in v lies inside [X_START, end], so v needs no clamp.
  const K = X_START + motionEnd(R);
  const v = narrowing ? K - t : t;
  const slide = tl.get("slide");
  const close = tl.get("close");
  const slideAt = narrowing ? K - slide.end : slide.start;
  const closeAt = narrowing ? K - close.end : close.start;
  const accentEl = tl.get("accent");
  const hazeEl = tl.get("haze");

  const settle = interpolate(t, [accentEl.start, accentEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  // The accent word develops into a swirl gradient as the paragraph lands;
  // the warm core drifts a few percent across the hold.
  const drift = interpolate(
    t,
    [accentEl.start, accentEl.start + accentEl.beat("drift")],
    [0, 1],
    CLAMP,
  );
  const haze = interpolate(t, [hazeEl.start, hazeEl.end], [0.35, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const swirl =
    theme === "dark"
      ? `linear-gradient(100deg, ${SWIRL[0]} ${6 + 8 * drift}%, ${SWIRL[1]} ${44 + 8 * drift}%, ${SWIRL[2]} 96%)`
      : `linear-gradient(100deg, ${SWIRL[1]} ${4 + 8 * drift}%, ${SWIRL[2]} ${48 + 8 * drift}%, ${SWIRL[3]} 100%)`;

  // Measure guides follow the column edges.
  const edge = interpolate(
    v,
    [slideAt, slideAt + (R - 1) * slide.beat("row") + slide.beat("move")],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );
  const tall = interpolate(v, [closeAt, closeAt + close.length], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const halfW = interpolate(edge, [0, 1], [narrow / 2, wide / 2]) * F;
  const halfW0 = interpolate(0, [0, 1], [narrow / 2, wide / 2]) * F;
  const halfH =
    (interpolate(tall, [0, 1], [(R - 1) / 2, (T - 1) / 2]) + 0.95) * L;
  const guidesIn = tl.get("guides-in");
  const guidesOut = tl.get("guides-out");
  const guideIn = interpolate(t, [guidesIn.start, guidesIn.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const guideOut = interpolate(t, [guidesOut.start, guidesOut.end], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const hair = Math.max(1, u);

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 40% 35%, ${c.key}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(70% 60% at ${88 - 6 * drift}% 112%, color-mix(in oklab, ${SWIRL[2]} ${theme === "dark" ? 30 : 16}%, transparent) 0%, transparent 70%)`,
            `radial-gradient(60% 55% at ${8 + 4 * drift}% -12%, color-mix(in oklab, ${theme === "dark" ? SWIRL[3] : SWIRL[0]} ${theme === "dark" ? 55 : 60}%, transparent) 0%, transparent 70%)`,
          ].join(", "),
          opacity: haze,
        }}
      />

      <ScaleLayer scale={scale}>
        {[-1, 1].map((side) => {
          // Eased by `left`, a guide stepped along in uneven whole pixels;
          // layout holds it at the narrow column and the travel is a
          // transform.
          const shift = side * (halfW - halfW0);
          return (
            <div
              key={`g${side}`}
              style={{
                position: "absolute",
                left: cx + side * (halfW0 + 0.55 * F) - hair / 2,
                top: cy - 0.36 * F - halfH * guideIn,
                width: hair,
                height: halfH * 2 * guideIn,
                transform:
                  Math.abs(shift) < 1e-3 ? undefined : `translateX(${shift}px)`,
                background: c.hair,
                opacity: guideOut,
              }}
            />
          );
        })}

        {words.map((w, i) => {
          const p = placed[i];
          const { px, py } = progress(p, R, v, slide, slideAt, close, closeAt);
          const x = cx + interpolate(px, [0, 1], [p.x0, p.x1]) * F;
          const y = cy + interpolate(py, [0, 1], [p.y0, p.y1]) * L;
          const startRow = narrowing ? Math.round(p.y1 + (T - 1) / 2) : p.row;
          const rise = tl.get(`enter:${startRow}`);
          const enter = interpolate(t, [rise.start, rise.end], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const lift = (1 - enter) * 0.35 * F;
          // Each word is laid out where it lands and rides there by a
          // transform: layout rounds a baseline to whole pixels, so a word
          // eased by `left`/`top` clicks along pixel by pixel.
          const rest = progress(
            p,
            R,
            narrowing ? -1e9 : 1e9,
            slide,
            slideAt,
            close,
            closeAt,
          );
          const restX = cx + interpolate(rest.px, [0, 1], [p.x0, p.x1]) * F;
          const restY = cy + interpolate(rest.py, [0, 1], [p.y0, p.y1]) * L;
          const dx = x - restX;
          const dy = y - restY + lift;
          // The transform stays on at rest too: it carries the mark, and a
          // word that drops it snaps to the nearest pixel when shown smaller.
          const travel = `translate(${dx}px, ${dy}px)${glide(
            (px > 0 && px < 1) ||
              (py > 0 && py < 1) ||
              (enter > 0 && enter < 1),
          )}`;
          if (!w.serif) {
            return (
              <div
                key={`${i}-${w.core}`}
                style={{
                  position: "absolute",
                  left: restX,
                  top: restY - BASELINE_SANS * F,
                  transform: travel,
                  fontFamily,
                  fontWeight: 400,
                  fontSize: F,
                  lineHeight: 1,
                  letterSpacing: `${TRACK}em`,
                  whiteSpace: "pre",
                  color: fg,
                  opacity: enter,
                }}
              >
                {w.core}
              </div>
            );
          }
          const sF = F * SERIF_SCALE;
          const serifType = {
            position: "absolute",
            left: restX - 0.2 * sF,
            top: restY - BASELINE_SERIF * sF,
            transform: travel,
            paddingLeft: 0.2 * sF,
            paddingRight: 0.2 * sF,
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: sF,
            lineHeight: 1,
            whiteSpace: "pre",
          } as const;
          return (
            <div key={`${i}-${w.core}`}>
              <div
                style={{
                  ...serifType,
                  color: fg,
                  opacity: enter * (1 - settle),
                }}
              >
                {w.core}
              </div>
              <div
                style={{
                  ...serifType,
                  color: "transparent",
                  backgroundImage: swirl,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  opacity: enter * settle,
                }}
              >
                {w.core}
              </div>
              {w.tail ? (
                <div
                  style={{
                    position: "absolute",
                    left: restX + (serifEm(w.core) + 0.04) * F,
                    top: restY - BASELINE_SANS * F,
                    transform: travel,
                    fontFamily,
                    fontWeight: 400,
                    fontSize: F,
                    lineHeight: 1,
                    letterSpacing: `${TRACK}em`,
                    whiteSpace: "pre",
                    color: fg,
                    opacity: enter,
                  }}
                >
                  {w.tail}
                </div>
              ) : null}
            </div>
          );
        })}
      </ScaleLayer>

      {grain ? <Grain opacity={c.grain} /> : null}
    </AbsoluteFill>
  );
}
