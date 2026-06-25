"use client";

import {
  Popover,
  type PopoverSide,
  type PopoverState,
} from "@/registry/remocn-ui/popover";

export interface PopoverPreviewProps {
  title?: string;
  description?: string;
  side?: PopoverSide;
  width?: number;
  state?: PopoverState;
}

export function PopoverPreview({
  title = "Dimensions",
  description = "Set the dimensions for the layer.",
  side = "bottom",
  width = 288,
  state = "opened",
}: PopoverPreviewProps) {
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
      <Popover
        title={title}
        description={description}
        side={side}
        width={width}
        state={state}
      />
    </div>
  );
}
