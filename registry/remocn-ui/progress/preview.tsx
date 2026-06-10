"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { Progress } from "@/registry/remocn-ui/progress";

export interface ProgressPreviewProps {
  value?: number;
  width?: number;
  showLabel?: boolean;
  mode?: "light" | "dark";
}

/**
 * Preview-only wrapper for the customizer. The shipped `Progress` is a
 * placement-agnostic inline bar — the caller positions it. The customizer Player
 * renders its `component` as the composition root, so a bare `Progress` would sit
 * top-left in normal flow; this thin wrapper centers it on a theme-background
 * stage just for the preview. NOT shipped: not listed in registry.json files.
 */
export function ProgressPreview({
  value = 62,
  width = 320,
  showLabel = true,
  mode,
}: ProgressPreviewProps) {
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
      <Progress value={value} width={width} showLabel={showLabel} mode={mode} />
    </div>
  );
}
