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
  speed?: number;
}

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
        {}
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

export function SkeletonPreview({
  layout = "card",
  state = "loading",
  speed,
}: SkeletonPreviewProps) {
  const theme = useRemocnTheme(undefined, "light");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <Skeleton layout={layout} state={state} speed={speed}>
        <DemoContent layout={layout} theme={theme} />
      </Skeleton>
    </div>
  );
}
