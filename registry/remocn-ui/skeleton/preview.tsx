"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import {
  Skeleton,
  type SkeletonLayout,
  type SkeletonState,
} from "@/registry/remocn-ui/skeleton";

export interface SkeletonPreviewProps {
  layout?: SkeletonLayout;
  state?: SkeletonState;
  mode?: "light" | "dark";
  speed?: number;
}

/** Demo content matching each layout, so the loaded state has something real. */
function DemoContent({
  layout,
  theme,
}: {
  layout: SkeletonLayout;
  theme: RemocnTheme;
}) {
  if (layout === "card") {
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 24,
            background: theme.secondary,
          }}
        />
        {/* width 180 matches the card placeholder's text column, so the loaded
            content box ≈ the placeholder box (avatar 48 + gap 14 + 180): the
            box width is stable between loading and loaded, no overflow/shift. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: 180,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: theme.foreground }}>
            Ada Lovelace
          </span>
          <span style={{ fontSize: 13, color: theme.mutedForeground }}>
            Enchantress of Numbers
          </span>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 260,
        color: theme.foreground,
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <span>The Analytical Engine weaves algebraic patterns.</span>
      <span>Just as the Jacquard loom weaves flowers and leaves.</span>
    </div>
  );
}

/**
 * Preview-only wrapper for the customizer. The shipped `Skeleton` needs real
 * `children` (they define the box) and renders inline; the customizer Player
 * renders its `component` as the composition root, so this wrapper supplies demo
 * content for the chosen layout and centers it on a theme-background stage. NOT
 * shipped: not listed in registry.json files.
 */
export function SkeletonPreview({
  layout = "card",
  state = "loading",
  mode,
  speed,
}: SkeletonPreviewProps) {
  const theme = useRemocnTheme(undefined, mode);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.background,
      }}
    >
      <Skeleton layout={layout} state={state} mode={mode} speed={speed}>
        <DemoContent layout={layout} theme={theme} />
      </Skeleton>
    </div>
  );
}
