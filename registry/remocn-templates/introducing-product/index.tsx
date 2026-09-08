"use client";

import { AbsoluteFill } from "remotion";

export interface IntroducingProductProps {
  message?: string;
}

export function IntroducingProduct({
  message = "Template placeholder",
}: IntroducingProductProps) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
        display: "flex",
        fontFamily: "sans-serif",
        fontSize: 64,
        fontWeight: 600,
        justifyContent: "center",
      }}
    >
      {message}
    </AbsoluteFill>
  );
}

export const introducingProductConfig = {
  componentName: "IntroducingProduct",
  importPath: "@/components/remocn/templates/introducing-product",
  controls: {
    message: {
      type: "text-content" as const,
      default: "Template placeholder",
      description: "Placeholder message",
    },
  },
  durationInFrames: 90,
  fps: 30,
  compositionWidth: 1280,
  compositionHeight: 720,
};
