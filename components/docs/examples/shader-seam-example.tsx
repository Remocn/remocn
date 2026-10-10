"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import {
  type ShaderSeamProps,
  shaderSeam,
} from "@/registry/remocn/shader-seam";

function Scene({ next = false }: { next?: boolean }) {
  const color = next ? "#25212d" : "#f0ecf5";
  return (
    <AbsoluteFill
      style={{
        background: next ? "#e9e5ee" : "#14121c",
        color,
        padding: 72,
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
        <span style={{ opacity: 0.5 }}>
          {next ? "02 / Next scene" : "01 / Current scene"}
        </span>
      </div>
      <div style={{ position: "absolute", left: 72, top: 252 }}>
        <div
          style={{
            fontSize: 108,
            letterSpacing: "-6px",
            lineHeight: 1.05,
            fontWeight: 600,
          }}
        >
          {next ? "A new chapter." : "Let it dissolve."}
        </div>
        <div style={{ fontSize: 25, marginTop: 26, opacity: 0.5 }}>
          {next
            ? "Same frame. Another perspective."
            : "A moment between two scenes."}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: -100,
          bottom: -170,
          width: 560,
          height: 560,
          border: `1px solid ${next ? "#b9afc8" : "#393040"}`,
          borderRadius: "50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 58,
            border: "inherit",
            borderRadius: "inherit",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 116,
            border: "inherit",
            borderRadius: "inherit",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: 72,
          fontSize: 16,
          opacity: 0.45,
        }}
      >
        {next ? "Shader Seam" : "OpenShaders × remocn"}
      </div>
    </AbsoluteFill>
  );
}

export function ShaderSeamExampleScene(props: ShaderSeamProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={108}>
        <Scene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 60 })}
        presentation={shaderSeam(props)}
      />
      <TransitionSeries.Sequence durationInFrames={108}>
        <Scene next />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export function shaderSeamExampleCode(values: Record<string, unknown>) {
  const props = {
    softness: values.softness ?? 0.18,
    detail: values.detail ?? 0.65,
    speed: values.speed ?? 0,
    timeOffset: values.timeOffset ?? 0,
  };
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { shaderSeam } from "@/components/remocn/shader-seam";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={108}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 60 })}
      presentation={shaderSeam(${JSON.stringify(props, null, 2).replace(/\n/g, "\n      ")})}
    />
    <TransitionSeries.Sequence durationInFrames={108}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
}
