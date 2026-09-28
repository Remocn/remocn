"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { useId } from "react";
import {
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

export type TypeRepeaterMode = "fan" | "spiral" | "tunnel";

export interface TypeRepeaterProps {
  text?: string;
  copies?: number;
  mode?: TypeRepeaterMode;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  accent?: string;
  outline?: boolean;
  speed?: number;
  className?: string;
}

export const typeRepeaterDefaults = {
  text: "Repeat",
  copies: 12,
  mode: "tunnel",
  fontSize: 110,
  fontWeight: 800,
  fontFamily: INTER,
  color: "#fafafa",
  accent: "#D97757",
  outline: true,
  speed: 1,
} satisfies Required<Omit<TypeRepeaterProps, "className">>;

/** Beats on the 30 fps clock. */
export const typeRepeaterTiming = {
  intro: [0, 10],
  unfold: [10, 34],
  breathe: [34, 70],
  collapse: [70, 90],
} as const;

/** Frame where the copies have folded back into the word. */
export const typeRepeaterLength = typeRepeaterTiming.collapse[1];

/**
 * Per-copy steps for each mode. `fan` alternates sides around a pivot below
 * the word; `spiral` and `tunnel` grow each copy outward behind it.
 */
export const typeRepeaterModes = {
  fan: { rotate: 11, scale: 1, pivot: 2.6, symmetric: true },
  spiral: { rotate: 12, scale: 1.1, pivot: 0, symmetric: false },
  tunnel: { rotate: 0, scale: 1.2, pivot: 0, symmetric: false },
} as const satisfies Record<
  TypeRepeaterMode,
  { rotate: number; scale: number; pivot: number; symmetric: boolean }
>;

const BREATHE = 0.06;
const FADE = 0.85;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOutCubic = Easing.out(Easing.cubic);
const easeInOutCubic = Easing.inOut(Easing.cubic);
const unfoldEase = Easing.out(Easing.back(1.4));

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getTypeRepeaterTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

/** How far the copies have spread, 0 (one word) to about 1. */
export function getTypeRepeaterSpread(t: number) {
  const { unfold, breathe, collapse } = typeRepeaterTiming;
  if (t < breathe[0]) {
    return interpolate(t, [...unfold], [0, 1], {
      ...CLAMP,
      easing: unfoldEase,
    });
  }
  if (t < breathe[1]) {
    const phase = (t - breathe[0]) / (breathe[1] - breathe[0]);
    return 1 + BREATHE * Math.sin(2 * Math.PI * phase);
  }
  return interpolate(t, [...collapse], [1, 0], {
    ...CLAMP,
    easing: easeInOutCubic,
  });
}

/** Entrance of the front word, 0..1. */
export function getTypeRepeaterIntro(t: number) {
  return interpolate(t, [...typeRepeaterTiming.intro], [0, 1], {
    ...CLAMP,
    easing: easeOutCubic,
  });
}

export interface TypeRepeaterCopy {
  rotate: number;
  scale: number;
  opacity: number;
  /** 0 for the word's color, 1 for the accent. */
  tint: number;
}

/** Transform and fade of copy `index` (0 is the word itself). */
export function getTypeRepeaterCopy(
  index: number,
  copies: number,
  spread: number,
  mode: TypeRepeaterMode,
): TypeRepeaterCopy {
  const step = typeRepeaterModes[mode] ?? typeRepeaterModes.spiral;
  const n = Math.max(1, Math.round(copies));
  const steps = step.symmetric ? Math.ceil(index / 2) : index;
  const side = step.symmetric && index % 2 === 0 ? -1 : 1;
  const reach = steps * spread;
  return {
    rotate: side * step.rotate * reach || 0,
    scale: step.scale ** reach,
    opacity:
      index === 0
        ? 1
        : (1 - (FADE * index) / n) * Math.min(1, Math.max(0, spread * 4)),
    tint: n > 1 ? index / (n - 1) : 0,
  };
}

export function TypeRepeater({
  text = typeRepeaterDefaults.text,
  copies = typeRepeaterDefaults.copies,
  mode = typeRepeaterDefaults.mode,
  fontSize = typeRepeaterDefaults.fontSize,
  fontWeight = typeRepeaterDefaults.fontWeight,
  fontFamily = typeRepeaterDefaults.fontFamily,
  color = typeRepeaterDefaults.color,
  accent = typeRepeaterDefaults.accent,
  outline = typeRepeaterDefaults.outline,
  speed = typeRepeaterDefaults.speed,
  className,
}: TypeRepeaterProps) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const outlineId = `type-repeater-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const unit = height / 720;
  const size = fontSize * unit;
  const t = getTypeRepeaterTime(frame, { fps, speed });
  const spread = getTypeRepeaterSpread(t);
  const intro = getTypeRepeaterIntro(t);
  const count = Math.max(1, Math.round(finite(copies, 12)));
  const pivot = (typeRepeaterModes[mode] ?? typeRepeaterModes.spiral).pivot;

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
      {outline ? (
        // Outline from the filled silhouette: the variable font's overlapping
        // contours would show through a text stroke.
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={outlineId}>
              <feMorphology
                in="SourceAlpha"
                operator="erode"
                radius={1.5 * unit}
                result="inner"
              />
              <feComposite in="SourceGraphic" in2="inner" operator="out" />
            </filter>
          </defs>
        </svg>
      ) : null}
      <div
        style={{
          position: "relative",
          opacity: intro,
          transform: `scale(${0.9 + 0.1 * intro})`,
        }}
      >
        {Array.from({ length: count }, (_, i) => count - 1 - i).map((i) => {
          const copy = getTypeRepeaterCopy(i, count, spread, mode);
          if (copy.opacity <= 0) return null;
          return (
            <div
              key={i}
              aria-hidden={i > 0}
              style={{
                position: i === 0 ? "relative" : "absolute",
                inset: i === 0 ? undefined : 0,
                fontFamily,
                fontSize: size,
                lineHeight: 1,
                fontWeight,
                fontVariationSettings: `"wght" ${fontWeight}`,
                whiteSpace: "pre",
                color: interpolateColors(copy.tint, [0, 1], [color, accent]),
                opacity: copy.opacity,
                filter: outline && i > 0 ? `url(#${outlineId})` : undefined,
                transformOrigin: `50% calc(50% + ${pivot}em)`,
                transform: `rotate(${copy.rotate}deg) scale(${copy.scale})`,
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
