"use client";

import { AbsoluteFill, interpolate } from "remotion";
import { CanvasScenePoster } from "@/components/docs/examples/canvas-scenes";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { HalftonePrint } from "@/registry/remocn/halftone-print";

export function HalftoneRegisterExampleScene() {
  const frame = useSceneFrame();
  const misregistration = interpolate(frame, [0, 36, 74, 90], [9, 1.2, 1.2, 9]);

  return (
    <HalftonePrint misregistration={misregistration}>
      <CanvasScenePoster />
    </HalftonePrint>
  );
}

export function HalftoneResolveExampleScene() {
  const frame = useSceneFrame();
  const dotSize = interpolate(frame, [0, 40, 72, 90], [30, 7, 7, 30]);

  return (
    <HalftonePrint dotSize={dotSize}>
      <CanvasScenePoster />
    </HalftonePrint>
  );
}

function PanningPoster() {
  const frame = useSceneFrame();
  const offset = Math.sin((frame / 90) * Math.PI * 2) * 70;

  return (
    <AbsoluteFill style={{ transform: `translateX(${offset}px) scale(1.12)` }}>
      <CanvasScenePoster />
    </AbsoluteFill>
  );
}

export function HalftoneLiveExampleScene() {
  return (
    <HalftonePrint dotSize={12}>
      <PanningPoster />
    </HalftonePrint>
  );
}
