"use client";

import {
  ContextMenu,
  type ContextMenuState,
} from "@/registry/remocn-ui/context-menu";

export interface ContextMenuPreviewProps {
  state?: ContextMenuState;
  highlightedIndex?: number;
}

export function ContextMenuPreview({
  state = "opened",
  highlightedIndex = 1,
}: ContextMenuPreviewProps) {
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
      <ContextMenu state={state} highlightedIndex={highlightedIndex} />
    </div>
  );
}
