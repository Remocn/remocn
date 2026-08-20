"use client";

import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface SlotMachineRollProps {
  from?: string;
  to?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

export function SlotMachineRoll({
  from = "$99",
  to = "$199",
  fontSize = 120,
  color = "#171717",
  fontWeight = 700,
  speed = 1,
  className,
}: SlotMachineRollProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const len = Math.max(from.length, to.length);
  const paddedFrom = from.padStart(len, " ");
  const paddedTo = to.padStart(len, " ");

  const columns = [];
  for (let i = 0; i < len; i++) {
    const raw = spring({
      frame: frame - i * 4,
      fps,
      config: { damping: 14 },
    });
    const t = Math.max(0, Math.min(1, raw));
    columns.push(
      <span
        key={i}
        style={{
          display: "inline-block",
          overflow: "hidden",
          height: "1.1em",
          lineHeight: "1.1em",
          verticalAlign: "top",
          width: "0.7em",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            translate: `0 ${-t * fontSize * 1.1}px`,
          }}
        >
          <span>{paddedFrom[i]}</span>
          <span>{paddedTo[i]}</span>
        </span>
      </span>,
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.03em",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
          lineHeight: 1.1,
        }}
      >
        {columns}
      </span>
    </div>
  );
}
