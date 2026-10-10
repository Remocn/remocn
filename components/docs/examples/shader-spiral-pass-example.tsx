"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  type ShaderSpiralPassProps,
  shaderSpiralPass,
} from "@/registry/remocn/shader-spiral-pass";

function Scene({ next = false }: { next?: boolean }) {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: next ? "#f1edf4" : "#15111c",
        color: next ? "#211a2c" : "#f4eefb",
        padding: 64,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
        }}
      >
        <span>remocn</span>
        <span style={{ opacity: 0.45 }}>
          {next ? "02 / Arrival" : "01 / Departure"}
        </span>
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize: Math.min(106, width * 0.083),
            fontWeight: 600,
            letterSpacing: -5,
          }}
        >
          {next ? "On the other side." : "Through the center."}
        </div>
        <div style={{ fontSize: 24, opacity: 0.5, marginTop: 24 }}>
          {next ? "A new scene comes into view." : "One continuous journey."}
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 64,
          right: 64,
          height: 2,
          background: next ? "#c8bbd4" : "#463351",
        }}
      />
    </AbsoluteFill>
  );
}

export function ShaderSpiralPassExampleScene(props: ShaderSpiralPassProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 72 })}
        presentation={shaderSpiralPass(props)}
      />
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene next />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export function shaderSpiralPassExampleCode(values: Record<string, unknown>) {
  const props = {
    speed: values.speed ?? 1,
    spirals: values.spirals ?? 3,
    twist: values.twist ?? 0.7,
    zoom: values.zoom ?? 14,
    softness: values.softness ?? 0.12,
    timeOffset: values.timeOffset ?? 0,
  };
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { shaderSpiralPass } from "@/components/remocn/shader-spiral-pass";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 72 })}
      presentation={shaderSpiralPass(${JSON.stringify(props, null, 2).replace(/\n/g, "\n      ")})}
    />
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
}
