"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { type CSSProperties, useEffect, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["100", "900"],
  subsets: ["latin"],
});

export interface SelectionSnapProps {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fromWeight?: number;
  toWeight?: number;
  color?: string;
  accent?: string;
  selectionColor?: string;
  badge?: boolean;
  speed?: number;
  className?: string;
}

export const selectionSnapDefaults = {
  text: "Frame",
  fontSize: 150,
  fontFamily: INTER,
  fromWeight: 100,
  toWeight: 900,
  color: "#fafafa",
  accent: "#D97757",
  selectionColor: "#0d99ff",
  badge: true,
  speed: 1,
} satisfies Required<Omit<SelectionSnapProps, "className">>;

/** Frame on the 30 fps timeline where every channel has come to rest. */
export const selectionSnapLength = 38;

/** Padding around the word, in em: the loose viewfinder and the snapped box. */
export const selectionSnapPadding = {
  loose: { x: 1.1, y: 0.9 },
  tight: { x: 0.12, y: 0 },
} as const;

/** Corners first, then edge midpoints, as fractions of the box. */
export const selectionSnapHandles = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0.5, 0],
  [1, 0.5],
  [0.5, 1],
  [0, 0.5],
] as const;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOutCubic = Easing.out(Easing.cubic);
const easeInOutCubic = Easing.inOut(Easing.cubic);
const snapEase = Easing.bezier(0.34, 1.3, 0.64, 1);
const popEase = Easing.out(Easing.back(1.7));

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Back-eased 0 → 1 over `duration` frames from `start`, never below 0. */
function pop(t: number, start: number, duration: number) {
  return Math.max(
    0,
    interpolate(t, [start, start + duration], [0, 1], {
      ...CLAMP,
      easing: popEase,
    }),
  );
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getSelectionSnapTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

export interface SelectionSnapState {
  /** Word and brackets fading in, 0..1. */
  intro: number;
  /** Viewfinder settle scale. */
  bracketScale: number;
  /** Loose (0) to tight (1) padding. Overshoots past 1 on the snap. */
  snap: number;
  /** Weight progress, 0..1. */
  weight: number;
  /** Color progress toward the accent, 0..1. */
  tint: number;
  /** Bracket arms growing along the edges; 1 closes them into a box. */
  edges: number;
  /** Scale of each handle, in `selectionSnapHandles` order. */
  handles: number[];
  /** Badge entrance, 0..1 with overshoot. */
  badge: number;
  /** Badge readout progress, 0..1. */
  count: number;
}

export function getSelectionSnapState(t: number): SelectionSnapState {
  return {
    intro: interpolate(t, [0, 8], [0, 1], { ...CLAMP, easing: easeOutCubic }),
    bracketScale: interpolate(t, [0, 8], [1.06, 1], {
      ...CLAMP,
      easing: easeOutCubic,
    }),
    snap: interpolate(t, [14, 28], [0, 1], { ...CLAMP, easing: snapEase }),
    weight: interpolate(t, [14, 30], [0, 1], {
      ...CLAMP,
      easing: easeInOutCubic,
    }),
    tint: interpolate(t, [18, 30], [0, 1], {
      ...CLAMP,
      easing: easeInOutCubic,
    }),
    edges: interpolate(t, [16, 26], [0, 1], {
      ...CLAMP,
      easing: easeInOutCubic,
    }),
    handles: selectionSnapHandles.map((_, i) => pop(t, 24 + i, 5)),
    badge: pop(t, 24, 8),
    count: interpolate(t, [24, 38], [0, 1], { ...CLAMP, easing: easeOutCubic }),
  };
}

/** Padding in em for a snap progress. */
export function getSelectionSnapPadding(snap: number) {
  const { loose, tight } = selectionSnapPadding;
  return {
    x: loose.x + (tight.x - loose.x) * snap,
    y: loose.y + (tight.y - loose.y) * snap,
  };
}

/** Size of the snapped box in reference px, from the word's final width. */
export function getSelectionSnapSize(textWidth: number, fontSize: number) {
  const { tight } = selectionSnapPadding;
  return {
    width: Math.round(textWidth + 2 * tight.x * fontSize),
    height: Math.round(fontSize * (1 + 2 * tight.y)),
  };
}

function useTextWidth(text: string, font: string) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const handle = delayRender("selection-snap: measuring the word");
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
        setWidth(ctx.measureText(text).width);
      }
      release();
    };
    document.fonts.load(font, text).then(measure, measure);
    return release;
  }, [text, font]);

  return width;
}

export function SelectionSnap({
  text = selectionSnapDefaults.text,
  fontSize = selectionSnapDefaults.fontSize,
  fontFamily = selectionSnapDefaults.fontFamily,
  fromWeight = selectionSnapDefaults.fromWeight,
  toWeight = selectionSnapDefaults.toWeight,
  color = selectionSnapDefaults.color,
  accent = selectionSnapDefaults.accent,
  selectionColor = selectionSnapDefaults.selectionColor,
  badge = selectionSnapDefaults.badge,
  speed = selectionSnapDefaults.speed,
  className,
}: SelectionSnapProps) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const unit = height / 720;
  const t = getSelectionSnapTime(frame, { fps, speed });
  const state = getSelectionSnapState(t);

  const size = fontSize * unit;
  const pad = getSelectionSnapPadding(state.snap);
  const weight = fromWeight + (toWeight - fromWeight) * state.weight;
  const stroke = Math.max(1, 1.5 * unit);
  const arm = 0.16 * size;
  const handleSize = 9 * unit;
  const finalWidth = useTextWidth(
    text,
    `${toWeight} ${fontSize}px ${fontFamily}`,
  );
  const readout =
    finalWidth === null ? null : getSelectionSnapSize(finalWidth, fontSize);

  // Percentages resolve against the box width for `width` and its height for
  // `height`, so one expression grows every arm to its edge's midpoint.
  const along = `calc(${arm}px + (50% - ${arm}px) * ${state.edges})`;
  const arms: CSSProperties[] = [
    { top: 0, left: 0, width: along, height: stroke },
    { top: 0, right: 0, width: along, height: stroke },
    { bottom: 0, left: 0, width: along, height: stroke },
    { bottom: 0, right: 0, width: along, height: stroke },
    { top: 0, left: 0, width: stroke, height: along },
    { bottom: 0, left: 0, width: stroke, height: along },
    { top: 0, right: 0, width: stroke, height: along },
    { bottom: 0, right: 0, width: stroke, height: along },
  ];

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
      <div
        style={{
          position: "relative",
          display: "inline-block",
          padding: `${pad.y * size}px ${pad.x * size}px`,
        }}
      >
        <span
          style={{
            display: "block",
            whiteSpace: "pre",
            fontFamily,
            fontSize: size,
            lineHeight: 1,
            fontWeight: Math.round(weight / 100) * 100,
            fontVariationSettings: `"wght" ${weight.toFixed(2)}`,
            color: interpolateColors(state.tint, [0, 1], [color, accent]),
            opacity: state.intro,
          }}
        >
          {text}
        </span>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: state.intro,
            transform: `scale(${state.bracketScale})`,
          }}
        >
          {arms.map((style, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                background: selectionColor,
                ...style,
              }}
            />
          ))}
          {selectionSnapHandles.map(([x, y], i) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                width: handleSize,
                height: handleSize,
                boxSizing: "border-box",
                background: "#ffffff",
                border: `${stroke}px solid ${selectionColor}`,
                transform: `translate(-50%, -50%) scale(${state.handles[i]})`,
              }}
            />
          ))}
        </div>
        {badge && readout ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `calc(100% + ${12 * unit}px)`,
              padding: `${3 * unit}px ${7 * unit}px`,
              borderRadius: 4 * unit,
              background: selectionColor,
              color: "#ffffff",
              fontFamily: INTER,
              fontSize: 14 * unit,
              lineHeight: 1.2,
              fontWeight: 600,
              fontVariationSettings: '"wght" 600',
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              opacity: Math.min(1, state.badge),
              transform: `translate(-50%, ${(1 - state.badge) * 8 * unit}px) scale(${0.6 + 0.4 * state.badge})`,
              transformOrigin: "50% 0",
            }}
          >
            {Math.round(readout.width * state.count)} ×{" "}
            {Math.round(readout.height * state.count)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
