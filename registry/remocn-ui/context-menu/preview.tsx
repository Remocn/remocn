"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { ContextMenu, type ContextMenuState } from "@/registry/remocn-ui/context-menu";

export interface ContextMenuPreviewProps {
  state?: ContextMenuState;
  highlightedIndex?: number;
  mode?: "light" | "dark";
}

/**
 * Preview-only wrapper for the customizer. The shipped `ContextMenu` is a
 * placement-agnostic panel that opens at the click point — the caller positions
 * it with an absolute wrapper. The customizer Player renders its `component` as
 * the composition root, so a bare panel would sit top-left; this thin wrapper
 * centers it on a theme-background stage just for the preview. NOT shipped: not
 * listed in registry.json files.
 */
export function ContextMenuPreview({
  state = "opened",
  highlightedIndex = 1,
  mode,
}: ContextMenuPreviewProps) {
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
      <ContextMenu state={state} highlightedIndex={highlightedIndex} mode={mode} />
    </div>
  );
}
