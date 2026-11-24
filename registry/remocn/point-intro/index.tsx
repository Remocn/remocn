"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
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
  DEFAULT_TITLE,
  type PointIntroElementId,
  pointIntroTimeline,
  wordsOf,
} from "./timeline";

const face = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface PointIntroProps {
  /** The headline, written out word by word. The point lands after it. */
  title?: string;
  /** Small grey line under the headline. */
  subline?: string;
  /** Colour of the point. */
  accent?: string;
  /** Headline color; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the headline and subline. Load it yourself; Figtree by default. */
  fontFamily?: string;
  /** Frames between words as the point writes them. */
  stagger?: number;
  /** How much larger the point is while it is alone on the stage. */
  soloScale?: number;
  /** Size of the headline, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the point's entrance, breath and glide, single
   * words, the full stop and the subline, by the ids in `./timeline`. Frames
   * on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<PointIntroElementId>;
}

const THEMES = {
  light: { bg: "#FAFAF9", fg: "#0E0E0D", muted: "#8C8C88" },
  dark: { bg: "#0A0A0A", fg: "#F2F2F0", muted: "#7C7C79" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Diameter of the point, in em of the headline. Matches a Figtree full stop. */
const DOT_EM = 0.118;
/** How much larger the point is while it is alone on the stage. */
const SOLO_SCALE = 2.1;
/** Room around the masked words so blur and rise are never clipped, in em. */
const MASK_PAD = 0.4;

interface Layout {
  rowW: number;
  rowH: number;
  baseline: number;
  wordLeft: number[];
  wordRight: number[];
  /** Centre x of the reserved full stop. */
  stopX: number;
}

function sameLayout(a: Layout | null, b: Layout) {
  return (
    a !== null &&
    a.rowW === b.rowW &&
    a.baseline === b.baseline &&
    a.stopX === b.stopX &&
    a.wordRight.join() === b.wordRight.join()
  );
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
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export function PointIntro(props: PointIntroProps) {
  const {
    title = DEFAULT_TITLE,
    subline = "Animated components for Remotion. Free and open source.",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = face.fontFamily,
    soloScale = SOLO_SCALE,
    scale = 1,
    delay = 0,
    theme = "light",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    pointIntroTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const t = THEMES[theme];
  const stage =
    background === "transparent" ? "transparent" : (background ?? t.bg);
  const words = wordsOf(title);
  const dotEl = tl.get("dot");
  const breatheEl = tl.get("breathe");
  const glideEl = tl.get("glide");
  const openEl = tl.get("open");
  const subEl = tl.get("subline");
  const wordEls = tl.lane("Words");

  const fontSize = Math.round(width * 0.052);
  const subSize = Math.round(width * 0.0165);
  const dot = fontSize * DOT_EM;

  const rowRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stopRef = useRef<HTMLSpanElement>(null);
  const baseRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("point-intro: measuring"));
  const released = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the copy or size changes
  useLayoutEffect(() => {
    let live = true;
    face
      .waitUntilDone()
      .catch(() => undefined)
      .then(() => document.fonts.load(`400 100px "${fontFamily}"`))
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!live) return;
        const row = rowRef.current;
        const stop = stopRef.current;
        const base = baseRef.current;
        if (row && stop && base) {
          const els = wordRefs.current.slice(0, words.length);
          const next: Layout = {
            rowW: row.offsetWidth,
            rowH: row.offsetHeight,
            baseline: base.offsetTop,
            wordLeft: els.map((el) => el?.offsetLeft ?? 0),
            wordRight: els.map((el) =>
              el ? el.offsetLeft + el.offsetWidth : 0,
            ),
            stopX: stop.offsetLeft + stop.offsetWidth / 2,
          };
          setLayout((prev) => (sameLayout(prev, next) ? prev : next));
        }
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [title, fontSize, handle, fontFamily]);

  // The point: in, one breath, a glide to the start of the line, then it
  // leads the writing word by word and settles as the full stop.
  const dotIn = interpolate(frame, [dotEl.start, dotEl.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const breath = interpolate(frame, [breatheEl.start, breatheEl.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breathe = Math.sin(EASE_IN_OUT(breath) * Math.PI) * 0.38;
  const lastLand = openEl.start + openEl.beat("land");
  const settle = interpolate(frame, [glideEl.start, lastLand], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });
  const dotScale =
    interpolate(dotIn, [0, 1], [0.6, 1]) *
    interpolate(settle, [0, 1], [soloScale, 1]) *
    (1 + breathe);

  const dotAt = (f: number) => {
    if (!layout) return [0, 0];
    const glide = interpolate(f, [glideEl.start, glideEl.end], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    });
    const stopOffset = layout.stopX - (layout.wordRight.at(-1) ?? 0);
    const startX = (layout.wordLeft[0] ?? 0) - stopOffset;
    const centreX = layout.rowW / 2;
    const centreY = layout.rowH / 2;
    const baseY = layout.baseline - dot / 2;
    let x = interpolate(glide, [0, 1], [centreX, startX]);
    let prev = startX;
    words.forEach((_, i) => {
      const target =
        i === words.length - 1
          ? layout.stopX
          : (layout.wordRight[i] ?? 0) + stopOffset;
      const p = interpolate(
        f,
        [wordEls[i].start, wordEls[i].start + wordEls[i].beat("step")],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_IN_OUT,
        },
      );
      x += (target - prev) * p;
      prev = target;
    });
    return [x, interpolate(glide, [0, 1], [centreY, baseY])];
  };
  const [dotX, dotY] = dotAt(frame);
  // Layout rounds a box's edges to whole pixels, so the point eased by
  // `left`/`top` clicks along pixel by pixel. While it travels it is laid out
  // at the full stop and carried there by a transform; at rest it keeps the
  // plain layout it had.
  const [restX, restY] = layout
    ? [layout.stopX, layout.baseline - dot / 2]
    : [0, 0];
  const [prevX, prevY] = dotAt(frame - speed);
  const [nextX, nextY] = dotAt(frame + speed);
  const dotMoving =
    Math.max(
      Math.abs(nextX - dotX),
      Math.abs(dotX - prevX),
      Math.abs(nextY - dotY),
      Math.abs(dotY - prevY),
    ) > 1e-3;

  // The point writes: text exists only behind it, surfacing through a soft
  // edge that ends just past its left side. Once it lands, the edge opens.
  const pad = MASK_PAD * fontSize;
  const opened = interpolate(frame, [openEl.start, openEl.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const frontier = layout
    ? dotX - dot / 2 + pad + fontSize * 0.06 + opened * fontSize
    : -1e4;
  const mask = `linear-gradient(90deg, #000 ${
    frontier - fontSize * 0.16
  }px, transparent ${frontier}px)`;

  const subP = interpolate(frame, [subEl.start, subEl.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill
      style={{
        background: stage,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <ScaleLayer scale={scale}>
        <div
          ref={rowRef}
          style={{
            position: "relative",
            whiteSpace: "nowrap",
            fontSize,
            fontWeight: 400,
            letterSpacing: "-0.028em",
            lineHeight: 1.2,
            color: ink ?? t.fg,
            // Optical centring: the line sits a touch above the true middle so
            // the subline below balances it.
            marginTop: -height * 0.03,
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: `${MASK_PAD}em`,
              margin: `-${MASK_PAD}em`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          >
            {words.map((w, i) => {
              const word = wordEls[i];
              const p = interpolate(frame, [word.start, word.end], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASE_OUT,
              });
              return (
                <span key={`${w}-${i}`}>
                  <span
                    ref={(el) => {
                      wordRefs.current[i] = el;
                    }}
                    style={{
                      display: "inline-block",
                      opacity: p,
                      filter: `blur(${(1 - p) * 10}px)`,
                      transform: `translateY(${(1 - p) * 0.24}em)${glide(midway(p))}`,
                    }}
                  >
                    {w}
                  </span>
                  {i < words.length - 1 ? " " : null}
                </span>
              );
            })}
          </span>
          <span ref={stopRef} style={{ display: "inline-block", opacity: 0 }}>
            .
          </span>
          <span
            ref={baseRef}
            style={{ display: "inline-block", width: 0, height: 0 }}
          />
          <div
            style={{
              position: "absolute",
              left: (dotMoving ? restX : dotX) - dot / 2,
              top: (dotMoving ? restY : dotY) - dot / 2,
              width: dot,
              height: dot,
              borderRadius: "50%",
              background: accent,
              opacity: layout ? dotIn : 0,
              transform: dotMoving
                ? `translate(${dotX - restX}px, ${dotY - restY}px) scale(${dotScale})`
                : `scale(${dotScale})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "100%",
              marginTop: fontSize * 0.42,
              transform: `translate(-50%, ${(1 - subP) * 12}px)${glide(midway(subP))}`,
              fontSize: subSize,
              letterSpacing: "-0.005em",
              lineHeight: 1.4,
              color: t.muted,
              opacity: subP,
              filter: `blur(${(1 - subP) * 8}px)`,
            }}
          >
            {subline}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
