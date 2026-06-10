"use client";

import type { ReactNode } from "react";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import { SkeletonBlock } from "@/components/remocn/skeleton-block";

export type SkeletonState = "loading" | "loaded";

/** Built-in placeholder layouts assembled from SkeletonBlock. */
export type SkeletonLayout = "lines" | "card";

export interface SkeletonProps {
  /** Current visual state (snap path). State changes snap (no enter-tweens). */
  state?: SkeletonState;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `state` — feed it an interpolated `SkeletonStyle` from `useSkeletonTransition`.
   */
  style?: SkeletonStyle;
  /** The real content. It sits in normal flow and DEFINES the box size. */
  children?: ReactNode;
  /**
   * Custom placeholder layer (arbitrary SkeletonBlock arrangement). Overrides
   * `layout` when present.
   */
  placeholder?: ReactNode;
  /** Built-in placeholder when no `placeholder` is given. */
  layout?: SkeletonLayout;
  /** Playhead scale forwarded to the placeholder SkeletonBlocks. */
  speed?: number;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

// ===========================================================================
// Skeleton visual — the COMPLETE animated look for a moment in time. A `state` is
// a named preset of this visual (`skeletonStyle`); the smooth path feeds an
// interpolated `SkeletonStyle` straight through. The component is a pure renderer
// — it reads NO frame (only the composed SkeletonBlock motion atom does). The two
// opacities CROSSFADE and sum to 1 per preset (child crossfade rule §3).
// ===========================================================================

export interface SkeletonStyle {
  /** Placeholder layer opacity. */
  skeletonOpacity: number;
  /** Real-content layer opacity. Always `1 - skeletonOpacity`. */
  contentOpacity: number;
}

/**
 * The COMPLETE resting visual for a state — a pure `(state) => SkeletonStyle` map.
 * The two opacities sum to 1 so the crossfade never dims the box. To change how a
 * state looks, edit one entry.
 */
export function skeletonStyle(state: SkeletonState): SkeletonStyle {
  switch (state) {
    case "loaded":
      return { skeletonOpacity: 0, contentOpacity: 1 };
    default:
      return { skeletonOpacity: 1, contentOpacity: 0 };
  }
}

/** A built-in placeholder layout, assembled from SkeletonBlock motion atoms. */
function LayoutPlaceholder({
  layout,
  speed,
  baseColor,
}: {
  layout: SkeletonLayout;
  speed?: number;
  /** Base shimmer color threaded from the resolved Skeleton theme. */
  baseColor: string;
}) {
  // Pass the resolved base color explicitly so a per-instance Skeleton
  // `theme`/`mode` override reaches the built-in placeholder's blocks
  // (SkeletonBlock would otherwise resolve its own default theme). The highlight
  // is intentionally NOT passed — SkeletonBlock derives a visible contrast band
  // from this base, so a themed Skeleton gets a themed, visible shimmer.
  const shimmer = { speed, baseColor };
  if (layout === "card") {
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {/* flexShrink:0 keeps the avatar a clean 48px circle even if the
            content box is narrower than this placeholder row. */}
        <SkeletonBlock
          width={48}
          height={48}
          radius={24}
          flexShrink={0}
          {...shimmer}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonBlock width={180} height={14} {...shimmer} />
          <SkeletonBlock width={120} height={14} {...shimmer} />
        </div>
      </div>
    );
  }
  // lines — stacked rows of decreasing width.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SkeletonBlock width={260} height={14} {...shimmer} />
      <SkeletonBlock width={240} height={14} {...shimmer} />
      <SkeletonBlock width={160} height={14} {...shimmer} />
    </div>
  );
}

/**
 * A deterministic skeleton→content crossfade. Pure renderer of whatever
 * `SkeletonStyle` it receives — it reads no frame, holds no state, runs no
 * effects (only the composed `SkeletonBlock` reads the frame). The real content
 * sits in normal flow and sets the box; the placeholder is an absolute overlay,
 * so the box does not jump as they crossfade.
 */
export function Skeleton({
  state = "loading",
  style,
  children,
  placeholder,
  layout = "lines",
  speed,
  theme: themeOverride,
  mode,
  className,
}: SkeletonProps) {
  // Resolve the theme so the built-in placeholder's shimmer follows a
  // per-instance theme/mode override (its base = theme.muted; SkeletonBlock
  // derives the contrast highlight from that base).
  const theme = useRemocnTheme(themeOverride, mode);
  const v = style ?? skeletonStyle(state);

  // A custom `placeholder` is the caller's own markup — they theme its blocks.
  // Only the built-in layouts get the resolved base color threaded in.
  const placeholderLayer = placeholder ?? (
    <LayoutPlaceholder layout={layout} speed={speed} baseColor={theme.muted} />
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Real content — normal flow, defines the box. */}
      <div style={{ opacity: v.contentOpacity }}>{children}</div>
      {/* Placeholder — absolute overlay so the box does not jump on crossfade. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: v.skeletonOpacity,
          pointerEvents: "none",
        }}
      >
        {placeholderLayer}
      </div>
    </div>
  );
}
