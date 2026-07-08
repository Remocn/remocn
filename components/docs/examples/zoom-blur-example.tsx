"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { zoomBlur } from "@/registry/remocn/zoom-blur";

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

interface ZoomBlurExampleProps {
  blur?: number;
  rise?: number;
}

export function ZoomBlurExampleScene({ blur, rise }: ZoomBlurExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 18 })}
        presentation={zoomBlur({ blur, rise })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Zoom Blur" background="#1a1922" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const zoomBlurExampleCode = (values: Record<string, unknown>): string => {
  const blur = (values.blur as number) ?? 16;
  const rise = (values.rise as number) ?? 0;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { zoomBlur } from "@/components/remocn/zoom-blur";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 18 })}
      presentation={zoomBlur({ blur: ${blur}, rise: ${rise} })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
