"use client";

import { useCurrentFrame } from "remotion";
import { mixOklch, useRemocnTheme } from "@/lib/remocn-ui";

export interface SkeletonBlockProps {
  /** Block width in px (or any CSS length via string). */
  width?: number | string;
  /** Block height in px. */
  height?: number;
  /** Corner radius in px. */
  radius?: number;
  /** Playhead scale: a full shimmer sweep takes (SWEEP_FRAMES / speed) frames. */
  speed?: number;
  /** Base (resting) color of the block. Defaults to the theme muted token. */
  baseColor?: string;
  /** Moving highlight color of the sweep. Defaults to a lighter wash. */
  highlightColor?: string;
  /** CSS `flex-shrink`. Set 0 to stop a fixed-size block (e.g. an avatar) from
   * collapsing when it sits in a flex row narrower than its blocks. */
  flexShrink?: number;
  className?: string;
}

/** Frames for one full shimmer sweep at speed 1. The loop is seamless. */
const SWEEP_FRAMES = 60;

/**
 * A deterministic shimmer block — the motion atom behind `Skeleton`'s
 * placeholder. A diagonal highlight gradient sweeps left→right and wraps
 * seamlessly: background-position cycles over exactly one period of the
 * 200%-wide gradient, so frame 0 and frame SWEEP_FRAMES render identically.
 *
 * Pure function of `useCurrentFrame()` — it uses no wall-clock, no randomness,
 * and no animation-frame callbacks — so it renders frame-perfectly on the
 * Remotion timeline. This is a MOTION atom: the only file here allowed to read
 * the frame.
 */
export function SkeletonBlock({
  width = 120,
  height = 16,
  radius = 6,
  speed = 1,
  baseColor,
  highlightColor,
  flexShrink,
  className,
}: SkeletonBlockProps) {
  const theme = useRemocnTheme();
  const base = baseColor ?? theme.muted;
  // Derive the moving highlight from the base toward the high-contrast
  // `foreground` token (dark in light theme, light in dark theme), so the sweep
  // band is visibly different from the base in BOTH themes. We deliberately do
  // NOT use the muted/accent tokens for the highlight — in the default theme
  // those equal the base, giving a zero-contrast (invisible) shimmer. 0.13 is
  // subtle but clearly visible.
  const highlight = highlightColor ?? mixOklch(base, theme.foreground, 0.13);

  // progress 0→1 over one sweep, then wraps. The gradient is 200% wide and we
  // pan background-position from 100% → -100% across the period; because the
  // gradient tiles, position 100% and -100% are visually identical → seamless.
  const frame = useCurrentFrame() * speed;
  const progress = (frame % SWEEP_FRAMES) / SWEEP_FRAMES;
  const positionX = 100 - progress * 200;

  return (
    <div
      className={className}
      style={{
        width,
        height,
        flexShrink,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${base} 20%, ${highlight} 50%, ${base} 80%)`,
        backgroundSize: "200% 100%",
        backgroundPosition: `${positionX}% 0`,
      }}
    />
  );
}
