"use client";

import type { ReactNode } from "react";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import { SkeletonBlock } from "@/components/remocn/skeleton-block";

export type SkeletonState = "loading" | "loaded";

export type SkeletonLayout = "lines" | "card";

export interface SkeletonProps {
  state?: SkeletonState;
  style?: SkeletonStyle;
  children?: ReactNode;
  placeholder?: ReactNode;
  layout?: SkeletonLayout;
  speed?: number;
  theme?: Partial<RemocnTheme>;
  className?: string;
}

export interface SkeletonStyle {
  skeletonOpacity: number;
  contentOpacity: number;
}

export function skeletonStyle(state: SkeletonState): SkeletonStyle {
  switch (state) {
    case "loaded":
      return { skeletonOpacity: 0, contentOpacity: 1 };
    default:
      return { skeletonOpacity: 1, contentOpacity: 0 };
  }
}

function LayoutPlaceholder({
  layout,
  speed,
  baseColor,
}: {
  layout: SkeletonLayout;
  speed?: number;
  baseColor: string;
}) {
  const shimmer = { speed, baseColor };
  if (layout === "card") {
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {}
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SkeletonBlock width={260} height={14} {...shimmer} />
      <SkeletonBlock width={240} height={14} {...shimmer} />
      <SkeletonBlock width={160} height={14} {...shimmer} />
    </div>
  );
}

export function Skeleton({
  state = "loading",
  style,
  children,
  placeholder,
  layout = "lines",
  speed,
  theme: themeOverride,
  className,
}: SkeletonProps) {
  const theme = useRemocnTheme(themeOverride, "light");
  const v = style ?? skeletonStyle(state);

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
      {}
      <div style={{ opacity: v.contentOpacity }}>{children}</div>
      {}
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
