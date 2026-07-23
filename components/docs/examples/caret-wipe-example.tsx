"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { caretWipe } from "@/registry/remocn/caret-wipe";

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

interface CaretWipeExampleProps {
  direction?: "left" | "right";
  caretColor?: string;
  caretWidth?: number;
}

export function CaretWipeExampleScene({
  direction,
  caretColor,
  caretWidth,
}: CaretWipeExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene A" background="#0d0d10" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 40 })}
        presentation={caretWipe({ direction, caretColor, caretWidth })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene B" background="#141318" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const caretWipeExampleCode = (
  values: Record<string, unknown>,
): string => {
  const direction = (values.direction as string) ?? "right";
  const caretColor = (values.caretColor as string) ?? "#C3E88D";
  const caretWidth = (values.caretWidth as number) ?? 3;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { caretWipe } from "@/components/remocn/caret-wipe";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 40 })}
      presentation={caretWipe({ direction: "${direction}", caretColor: "${caretColor}", caretWidth: ${caretWidth} })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
