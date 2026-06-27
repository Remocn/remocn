"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { TypingIndicator } from "@/registry/remocn-ui/typing-indicator";

export interface TypingIndicatorPreviewProps {
  dotCount?: number;
  size?: number;
  amplitude?: number;
  speed?: number;
}

export function TypingIndicatorPreview({
  dotCount = 3,
  size = 8,
  amplitude = 5,
  speed = 1,
}: TypingIndicatorPreviewProps) {
  const theme = useRemocnTheme(undefined, "light");

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
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "16px 20px",
          background: theme.muted,
          borderRadius: 18,
          color: theme.mutedForeground,
        }}
      >
        <TypingIndicator
          dotCount={dotCount}
          size={size}
          amplitude={amplitude}
          speed={speed}
        />
      </div>
    </div>
  );
}
