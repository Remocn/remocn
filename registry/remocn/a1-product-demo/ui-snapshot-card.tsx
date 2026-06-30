"use client";

import type { CSSProperties, ReactNode } from "react";

export interface UiSnapshotCardProps {
  header?: string;
  children: ReactNode;
  radius?: number;
  borderColor?: string;
  style?: CSSProperties;
}

export function UiSnapshotCard({
  header,
  children,
  radius = 18,
  borderColor = "rgba(255,255,255,0.12)",
  style,
}: UiSnapshotCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: radius,
        border: `1px solid ${borderColor}`,
        background: "transparent",
        ...style,
      }}
    >
      {header !== undefined ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 18px",
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <span style={dotStyle} />
          <span style={dotStyle} />
          <span style={dotStyle} />
          {header.length > 0 ? (
            <span
              style={{
                marginLeft: 12,
                fontSize: 15,
                fontWeight: 500,
                color: "rgba(255,255,255,0.45)",
                fontFamily:
                  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {header}
            </span>
          ) : null}
        </div>
      ) : null}
      <div style={{ position: "relative", flex: 1, padding: 22 }}>{children}</div>
    </div>
  );
}

const dotStyle: CSSProperties = {
  width: 11,
  height: 11,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.18)",
};
