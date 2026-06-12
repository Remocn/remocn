"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { ContextMenu, type ContextMenuState } from "@/registry/remocn-ui/context-menu";

export interface ContextMenuPreviewProps {
  state?: ContextMenuState;
  highlightedIndex?: number;
  mode?: "light" | "dark";
}

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
