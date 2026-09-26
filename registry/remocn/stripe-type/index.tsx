"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { useEffect, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["100", "900"],
  subsets: ["latin"],
});

export type StripeTypeSettle = "striped" | "solid";

export interface StripeTypeProps {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  stripes?: number;
  gap?: number;
  settle?: StripeTypeSettle;
  exit?: boolean;
  hold?: number;
  speed?: number;
  className?: string;
}

export const stripeTypeDefaults = {
  text: "Launch",
  fontSize: 180,
  fontWeight: 800,
  fontFamily: INTER,
  color: "#fafafa",
  stripes: 8,
  gap: 0.35,
  settle: "striped",
  exit: true,
  hold: 30,
  speed: 1,
} satisfies Required<Omit<StripeTypeProps, "className">>;

/** Beats on the 30 fps clock. */
export const stripeTypeTiming = {
  stagger: 2,
  travel: 16,
  close: 10,
  /** Frames of empty screen after the exit in the preview. */
  tail: 10,
} as const;

/** Ink box of Inter in a `line-height: 1` box, in em from the top, until measured. */
const INTER_INK = { top: 0.136, bottom: 0.864 + 0.24 };
const MEASURE_SIZE = 100;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Expo-shaped curves that land exactly on 0 and 1 (Easing.exp stops 2⁻¹⁰ short).
const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);
const easeInExpo = Easing.bezier(0.7, 0, 0.84, 0);
const easeInOutCubic = Easing.inOut(Easing.cubic);

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getStripeTypeTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

function stripeCount(stripes: number | undefined) {
  return Math.max(1, Math.round(finite(stripes, stripeTypeDefaults.stripes)));
}

export interface StripeBand {
  /** Top of the band as a share of the ink box height. */
  top: number;
  /** Bottom of the band as a share of the ink box height. */
  bottom: number;
}

/**
 * Bands over the ink box. With `n` bands and gap share `g` the pitch is
 * `1 / (n − g)`: the first band starts at the top, the last ends at the
 * bottom.
 */
export function getStripeBands(stripes: number, gap: number): StripeBand[] {
  const n = stripeCount(stripes);
  const g = Math.min(0.95, Math.max(0, finite(gap, 0)));
  const pitch = 1 / (n - g);
  return Array.from({ length: n }, (_, k) => ({
    top: k * pitch,
    bottom: k * pitch + pitch * (1 - g),
  }));
}

export interface StripeTypeTimeline {
  /** Frame where the last band has locked. */
  entered: number;
  /** Frame where the gaps have closed (equals `entered` when striped). */
  settled: number;
  exitStart: number;
  exitEnd: number;
  /** Frames the preview needs. */
  duration: number;
}

export function getStripeTypeTimeline(
  options: Pick<StripeTypeProps, "stripes" | "settle" | "exit" | "hold"> = {},
): StripeTypeTimeline {
  const n = stripeCount(options.stripes);
  const { stagger, travel, close, tail } = stripeTypeTiming;
  const entered = stagger * (n - 1) + travel;
  const settled = options.settle === "solid" ? entered + close : entered;
  const hold = Math.max(0, finite(options.hold, stripeTypeDefaults.hold));
  const exitStart = settled + hold;
  const exitEnd = exitStart + stagger * (n - 1) + travel;
  const exit = options.exit !== false;
  return {
    entered,
    settled,
    exitStart,
    exitEnd,
    duration: exit ? exitEnd + tail : settled + hold,
  };
}

/** Preview length for the given options and speed. */
export function getStripeTypeDuration(
  options: Pick<
    StripeTypeProps,
    "stripes" | "settle" | "exit" | "hold" | "speed"
  > = {},
) {
  const speed = finite(options.speed, 1);
  if (speed <= 0) return 1;
  return Math.ceil(getStripeTypeTimeline(options).duration / speed);
}

/**
 * Horizontal offset of band `k` as a share of its travel distance: −1 or 1
 * off the frame, 0 locked. Even bands enter from the left, odd from the right,
 * and on the exit each band passes on through the other side.
 */
export function getStripeBandOffset(
  t: number,
  k: number,
  options: Pick<StripeTypeProps, "stripes" | "settle" | "exit" | "hold"> = {},
) {
  const { stagger, travel } = stripeTypeTiming;
  const timeline = getStripeTypeTimeline(options);
  const side = k % 2 === 0 ? -1 : 1;
  const inStart = stagger * k;
  const enter = interpolate(t, [inStart, inStart + travel], [1, 0], {
    ...CLAMP,
    easing: easeOutExpo,
  });
  // `|| 0` folds −0 into 0 for a locked band.
  if (options.exit === false) return side * enter || 0;
  const outStart = timeline.exitStart + stagger * k;
  const leave = interpolate(t, [outStart, outStart + travel], [0, 1], {
    ...CLAMP,
    easing: easeInExpo,
  });
  return side * enter - side * leave || 0;
}

/** Gap share over time: the set gap, closing to 0 when `settle` is solid. */
export function getStripeGap(
  t: number,
  gap: number,
  options: Pick<StripeTypeProps, "stripes" | "settle"> = {},
) {
  if (options.settle !== "solid") return gap;
  const { entered, settled } = getStripeTypeTimeline(options);
  return interpolate(t, [entered, settled], [gap, 0], {
    ...CLAMP,
    easing: easeInOutCubic,
  });
}

/** Ink box of the word in its `line-height: 1` box, and its width, in em. */
function useInkBox(text: string, font: string) {
  const [ink, setInk] = useState<{
    top: number;
    bottom: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    const handle = delayRender("stripe-type: measuring the word");
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      continueRender(handle);
    };
    const measure = () => {
      if (released) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        ctx.font = font;
        const m = ctx.measureText(text);
        const ascent = m.fontBoundingBoxAscent / MEASURE_SIZE;
        const descent = m.fontBoundingBoxDescent / MEASURE_SIZE;
        const baseline = (1 - (ascent + descent)) / 2 + ascent;
        if (ascent > 0) {
          setInk({
            top: baseline - m.actualBoundingBoxAscent / MEASURE_SIZE,
            bottom: baseline + m.actualBoundingBoxDescent / MEASURE_SIZE,
            width: m.width / MEASURE_SIZE,
          });
        }
      }
      release();
    };
    document.fonts.load(font, text).then(measure, measure);
    return release;
  }, [text, font]);

  return ink;
}

export function StripeType({
  text = stripeTypeDefaults.text,
  fontSize = stripeTypeDefaults.fontSize,
  fontWeight = stripeTypeDefaults.fontWeight,
  fontFamily = stripeTypeDefaults.fontFamily,
  color = stripeTypeDefaults.color,
  stripes = stripeTypeDefaults.stripes,
  gap = stripeTypeDefaults.gap,
  settle = stripeTypeDefaults.settle,
  exit = stripeTypeDefaults.exit,
  hold = stripeTypeDefaults.hold,
  speed = stripeTypeDefaults.speed,
  className,
}: StripeTypeProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const unit = height / 720;
  const size = fontSize * unit;
  const t = getStripeTypeTime(frame, { fps, speed });
  const measured = useInkBox(
    text,
    `${fontWeight} ${MEASURE_SIZE}px ${fontFamily}`,
  );
  const ink = measured ?? {
    ...INTER_INK,
    width: 0.6 * Array.from(text).length,
  };
  const options = { stripes, settle, exit, hold };
  const bands = getStripeBands(stripes, getStripeGap(t, gap, options));
  const inkHeight = ink.bottom - ink.top;
  // Far enough that a band starting on either side is fully off the frame.
  const travel = (width + ink.width * size) / 2 + 0.2 * size;

  const type = {
    fontFamily,
    fontSize: size,
    lineHeight: 1,
    fontWeight,
    fontVariationSettings: `"wght" ${fontWeight}`,
    color,
    whiteSpace: "pre",
  } as const;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative" }}>
        <div aria-hidden style={{ ...type, visibility: "hidden" }}>
          {text}
        </div>
        {bands.map((band, k) => {
          const top = (ink.top + band.top * inkHeight) * 100;
          // Each band reaches a pixel into the next gap, so closed gaps leave
          // no antialiased seam between bands.
          const bleed = k < bands.length - 1 ? Math.max(1, unit) / size : 0;
          const bottom =
            (1 - (ink.top + band.bottom * inkHeight) - bleed) * 100;
          const offset = getStripeBandOffset(t, k, options);
          return (
            <div
              key={k}
              aria-hidden={k > 0}
              style={{
                ...type,
                position: "absolute",
                inset: 0,
                clipPath: `inset(${top}% -1% ${bottom}% -1%)`,
                transform: `translateX(${offset * travel}px)`,
              }}
            >
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
