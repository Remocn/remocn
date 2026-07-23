"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { iconScatter } from "@/registry/remocn/icon-scatter";

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

interface IconScatterExampleProps {
  count?: number;
  color?: string;
  coverColor?: string;
  flyDistance?: number;
}

export function IconScatterExampleScene({
  count,
  color,
  coverColor,
  flyDistance,
}: IconScatterExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene A" background="#0a0a0a" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 40 })}
        presentation={iconScatter({ count, color, coverColor, flyDistance })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene B" background="#141318" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const iconScatterExampleCode = (
  values: Record<string, unknown>,
): string => {
  const count = (values.count as number) ?? 15;
  const color = (values.color as string) ?? "#fafafa";
  const coverColor = (values.coverColor as string) ?? "#0a0a0a";
  const flyDistance = (values.flyDistance as number) ?? 260;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { iconScatter } from "@/components/remocn/icon-scatter";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 40 })}
      presentation={iconScatter({ count: ${count}, color: "${color}", coverColor: "${coverColor}", flyDistance: ${flyDistance} })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
