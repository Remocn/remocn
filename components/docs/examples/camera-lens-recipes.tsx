"use client";

import { interpolate } from "remotion";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { CameraLens } from "@/registry/remocn/camera-lens";
import { Drift } from "@/registry/remocn/drift";

export function LensContributionExampleScene() {
  const frame = useSceneFrame();
  const amount = interpolate(frame, [0, 34, 62, 96], [0, 1, 1, 0]);

  return (
    <CameraLens
      softness={0.5 * amount}
      bloom={0.5 * amount}
      aberration={0.5 * amount}
      vignette={0.5 * amount}
      distortion={0.05 * amount}
    >
      <CanvasSceneB />
    </CameraLens>
  );
}

export function LensHandheldExampleScene() {
  return (
    <CameraLens>
      <Drift grow={0.06}>
        <CanvasSceneA />
      </Drift>
    </CameraLens>
  );
}
