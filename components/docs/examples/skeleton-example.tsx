"use client";

import { Skeleton } from "@/registry/remocn-ui/skeleton";
import { useSkeletonTransition } from "@/registry/remocn-ui/skeleton/use-skeleton-transition";

export const SkeletonExampleScene = () => {
  // Shimmer for ~3 full sweep cycles (180 frames) as if waiting on data, then
  // crossfade to real content.
  const skeletonStyle = useSkeletonTransition([
    { at: 180, state: "loaded", duration: 16 },
  ]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Skeleton style={skeletonStyle} layout="card">
        {/* Real content — defines the box size; revealed on crossfade. */}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: "oklch(0.92 0 0)",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                width: 180,
                height: 14,
                borderRadius: 6,
                background: "oklch(0.85 0 0)",
              }}
            />
            <div
              style={{
                width: 120,
                height: 14,
                borderRadius: 6,
                background: "oklch(0.9 0 0)",
              }}
            />
          </div>
        </div>
      </Skeleton>
    </div>
  );
};

export const skeletonExampleCode = `import { Skeleton } from "@/components/remocn/skeleton";
import { useSkeletonTransition } from "@/components/remocn/use-skeleton-transition";

export const Scene = () => {
  // Shimmer for ~3 full sweep cycles (180 frames) as if waiting on data, then
  // crossfade to real content.
  const skeletonStyle = useSkeletonTransition([
    { at: 180, state: "loaded", duration: 16 },
  ]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Skeleton style={skeletonStyle} layout="card">
        {/* Real content — defines the box size; revealed on crossfade. */}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: "oklch(0.92 0 0)",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                width: 180,
                height: 14,
                borderRadius: 6,
                background: "oklch(0.85 0 0)",
              }}
            />
            <div
              style={{
                width: 120,
                height: 14,
                borderRadius: 6,
                background: "oklch(0.9 0 0)",
              }}
            />
          </div>
        </div>
      </Skeleton>
    </div>
  );
};`;
