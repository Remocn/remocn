"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import {
  Tooltip,
  type TooltipSide,
  type TooltipState,
} from "@/registry/remocn-ui/tooltip";

export interface TooltipPreviewProps {
  label?: string;
  side?: TooltipSide;
  state?: TooltipState;
  mode?: "light" | "dark";
}

/**
 * Preview-only wrapper for the customizer. The shipped `Tooltip` is a small
 * placement-agnostic bubble in a transparent wrapper — the caller anchors it to
 * a trigger (see the example). The customizer Player renders its `component` as
 * the composition root, so a bare `Tooltip` would sit in normal flow and not
 * center; this thin wrapper centers it on a theme-background stage just for the
 * preview. NOT shipped: not listed in registry.json files.
 */
export function TooltipPreview({
  label = "Add to library",
  side = "top",
  state = "visible",
  mode,
}: TooltipPreviewProps) {
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
      <Tooltip label={label} side={side} state={state} mode={mode} />
    </div>
  );
}
