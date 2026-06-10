"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { SkeletonBlock } from "@/registry/remocn-ui/skeleton-block";

export interface SkeletonBlockPreviewProps {
  width?: number;
  height?: number;
  radius?: number;
  speed?: number;
}

/**
 * Preview-only wrapper for the customizer. The shipped `SkeletonBlock` is a bare
 * inline block; the customizer Player renders its `component` as the composition
 * root, so this thin wrapper centers it on a theme-background stage just for the
 * preview. NOT shipped: not listed in registry.json files.
 */
export function SkeletonBlockPreview({
  width = 240,
  height = 20,
  radius = 6,
  speed,
}: SkeletonBlockPreviewProps) {
  const theme = useRemocnTheme();

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
      <SkeletonBlock width={width} height={height} radius={radius} speed={speed} />
    </div>
  );
}
