"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { Caret } from "@/registry/remocn-ui/caret";

export interface CaretPreviewProps {
  height?: number;
  width?: number;
  radius?: number;
  blink?: boolean;
  blinkPerSecond?: number;
  color?: string;
}

export function CaretPreview({
  height = 28,
  width = 3,
  radius = 1,
  blink = true,
  blinkPerSecond = 1,
  color,
}: CaretPreviewProps) {
  const theme = useRemocnTheme();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.background,
        color: theme.foreground,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 28,
        letterSpacing: "-0.01em",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        <span>Type something</span>
        <Caret
          color={color ?? theme.foreground}
          height={height}
          width={width}
          radius={radius}
          blink={blink}
          blinkPerSecond={blinkPerSecond}
          marginLeft={4}
        />
      </span>
    </div>
  );
}
