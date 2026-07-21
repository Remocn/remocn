"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { pageTurn } from "@/registry/remocn/page-turn";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Page({
  label,
  background,
  color,
}: {
  label: string;
  background: string;
  color: string;
}) {
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
          color,
        }}
      >
        {label}
      </span>
    </AbsoluteFill>
  );
}

interface PageTurnExampleProps {
  angle?: number;
  poses?: number;
}

export function PageTurnExampleScene({ angle, poses }: PageTurnExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={76}>
        <Page label="Page one" background="#f1eee7" color="#26242c" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 24 })}
        presentation={pageTurn({ angle, poses })}
      />
      <TransitionSeries.Sequence durationInFrames={76}>
        <Page label="Page two" background="#e6e1d5" color="#6f7f35" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const pageTurnExampleCode = (
  values: Record<string, unknown>,
): string => {
  const angle = (values.angle as number) ?? -7;
  const poses = (values.poses as number) ?? 8;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pageTurn } from "@/components/remocn/page-turn";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={76}>
      <PageOne />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 24 })}
      presentation={pageTurn({ angle: ${angle}, poses: ${poses} })}
    />
    <TransitionSeries.Sequence durationInFrames={76}>
      <PageTwo />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
