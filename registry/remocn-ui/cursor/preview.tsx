"use client";

import { Cursor, type CursorVariant } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";

export interface CursorPreviewProps {
  variant?: CursorVariant;
  size?: number;
  rippleColor?: string;
  mode?: "light" | "dark";
  speed?: number;
}

export function CursorPreview({
  variant = "arrow",
  size = 28,
  rippleColor,
  mode,
  speed = 1,
}: CursorPreviewProps) {
  const style = useCursorPath(
    [
      { at: 0, x: 360, y: 220 },
      { at: 24, x: 720, y: 300, click: true },
      { at: 60, x: 720, y: 300, press: true },
      { at: 90, x: 540, y: 420 },
    ],
    { speed },
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: mode === "dark" ? "#0a0a0a" : "#ffffff",
      }}
    >
      <Cursor
        style={style}
        variant={variant}
        size={size}
        rippleColor={rippleColor}
        mode={mode}
      />
    </div>
  );
}
