"use client";

import type React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { SecurityCam } from "@/registry/remocn/security-cam";

const MONO =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

const OSD: React.CSSProperties = {
  position: "absolute",
  fontFamily: MONO,
  fontSize: 30,
  letterSpacing: "0.04em",
  color: "#e8ece8",
};

function CameraOsd() {
  const frame = useSceneFrame();
  const seconds = 14 + Math.floor(frame / 30);
  const stamp = `2026-08-02 09:41:${String(seconds).padStart(2, "0")}`;
  const recording = frame % 30 < 20;

  return (
    <AbsoluteFill>
      <span style={{ ...OSD, left: 48, top: 40 }}>CAM 03 — LOBBY</span>
      <span style={{ ...OSD, right: 48, top: 40 }}>{stamp}</span>
      <div
        style={{
          ...OSD,
          left: 48,
          bottom: 40,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#e5484d",
            opacity: recording ? 1 : 0.15,
          }}
        />
        REC
      </div>
    </AbsoluteFill>
  );
}

export function SecurityColdOpenExampleScene() {
  const frame = useSceneFrame();
  const intensity = interpolate(frame, [0, 40, 44, 84, 90], [1, 1, 0, 0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <SecurityCam intensity={intensity}>
      <CanvasSceneA />
    </SecurityCam>
  );
}

export function SecurityFeedExampleScene() {
  return (
    <SecurityCam>
      <AbsoluteFill>
        <CanvasSceneB />
        <CameraOsd />
      </AbsoluteFill>
    </SecurityCam>
  );
}

export function SecurityBitrateExampleScene() {
  const frame = useSceneFrame();
  const starve = interpolate(frame, [0, 36, 62, 96], [0.15, 1, 1, 0.15]);
  const block = interpolate(frame, [0, 36, 62, 96], [6, 26, 26, 6]);

  return (
    <SecurityCam compression={starve} blockSize={block}>
      <CanvasSceneB />
    </SecurityCam>
  );
}
