"use client";

import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { rippleZoom } from "@/registry/remocn/ripple-zoom";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Scene({ label }: { label: string }) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 96,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "#f2f2f2",
        }}
      >
        {label}
      </span>
    </AbsoluteFill>
  );
}

interface RippleZoomExampleProps {
  zoom?: number;
  intensity?: number;
  softness?: number;
  colorBack?: string;
  speed?: number;
}

export function RippleZoomExampleScene({
  zoom,
  intensity,
  softness,
  colorBack,
  speed,
}: RippleZoomExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={102}>
        <Scene label="Scene A" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 88 })}
        presentation={rippleZoom({ zoom, intensity, softness, colorBack, speed })}
      />
      <TransitionSeries.Sequence durationInFrames={102}>
        <Scene label="Ripple Zoom" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const rippleZoomExampleCode = (
  values: Record<string, unknown>,
): string => {
  const zoom = (values.zoom as number) ?? 4;
  const intensity = (values.intensity as number) ?? 0.5;
  const softness = (values.softness as number) ?? 0.5;
  const colorBack = (values.colorBack as string) ?? "#141318";
  const speed = (values.speed as number) ?? 1;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { rippleZoom } from "@/components/remocn/ripple-zoom";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={102}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 88 })}
      presentation={rippleZoom({ zoom: ${zoom}, intensity: ${intensity}, softness: ${softness}, colorBack: "${colorBack}", speed: ${speed} })}
    />
    <TransitionSeries.Sequence durationInFrames={102}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
