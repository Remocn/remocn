"use client";

import { Backdrop, type BackdropFill } from "@/registry/remocn/backdrop";

export interface BackdropDemoProps {
  fillType?: "color" | "gradient" | "image";
  color?: string;
  gradient?: string;
  image?: string;
  padding?: number;
  radius?: number;
  shadow?: string;
}

export function BackdropDemo({
  fillType = "gradient",
  color = "#6366f1",
  gradient = "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  image = "https://picsum.photos/1280/720",
  padding = 4,
  radius = 1,
  shadow = "0 20px 60px rgba(0,0,0,0.4)",
}: BackdropDemoProps) {
  const fill: BackdropFill =
    fillType === "color"
      ? { type: "color", value: color }
      : fillType === "image"
        ? { type: "image", src: image }
        : { type: "gradient", value: gradient };

  return (
    <Backdrop fill={fill} padding={padding} radius={radius} shadow={shadow}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f12",
          color: "#e5e5e5",
          fontFamily: "system-ui, sans-serif",
          fontSize: 48,
          fontWeight: 600,
        }}
      >
        Your content
      </div>
    </Backdrop>
  );
}
