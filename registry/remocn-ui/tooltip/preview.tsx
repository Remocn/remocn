"use client";

import {
  Tooltip,
  type TooltipSide,
  type TooltipState,
} from "@/registry/remocn-ui/tooltip";

export interface TooltipPreviewProps {
  label?: string;
  side?: TooltipSide;
  state?: TooltipState;
}

export function TooltipPreview({
  label = "Add to library",
  side = "top",
  state = "visible",
}: TooltipPreviewProps) {
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
      <Tooltip label={label} side={side} state={state} />
    </div>
  );
}
