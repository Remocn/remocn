"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
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
  mode?: "light" | "dark";
}

/**
 * Preview-only wrapper for the customizer. The shipped `Popover` is a
 * placement-agnostic card in a transparent wrapper — the caller anchors it to a
 * trigger (see the example). The customizer Player renders its `component` as the
 * composition root, so a bare `Popover` would sit in normal flow and not center;
 * this thin wrapper centers it on a theme-background stage just for the preview.
 * NOT shipped: not listed in registry.json files.
 */
export function PopoverPreview({
  title = "Dimensions",
  description = "Set the dimensions for the layer.",
  side = "bottom",
  width = 288,
  state = "opened",
  mode,
}: PopoverPreviewProps) {
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
      <Popover
        title={title}
        description={description}
        side={side}
        width={width}
        state={state}
        mode={mode}
      />
    </div>
  );
}
