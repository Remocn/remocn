"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { asciiDissolve } from "@/registry/remocn/ascii-dissolve";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Scene({ label, background }: { label: string; background: string }) {
  return (
    <AbsoluteFill
      style={{
        background,
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

interface AsciiDissolveExampleProps {
  colorBack?: string;
  colorFront?: string;
  cellSize?: number;
}

export function AsciiDissolveExampleScene({
  colorBack,
  colorFront,
  cellSize,
}: AsciiDissolveExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene A" background="#0d0d10" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 40 })}
        presentation={asciiDissolve({ colorBack, colorFront, cellSize })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene B" background="#141318" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const asciiDissolveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const colorBack = (values.colorBack as string) ?? "#0d0d10";
  const colorFront = (values.colorFront as string) ?? "#f2f2f2";
  const cellSize = (values.cellSize as number) ?? 22;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { asciiDissolve } from "@/components/remocn/ascii-dissolve";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 40 })}
      presentation={asciiDissolve({ colorBack: "${colorBack}", colorFront: "${colorFront}", cellSize: ${cellSize} })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
