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
