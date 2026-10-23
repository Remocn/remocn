"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import {
  type LightLeakProps,
  lightLeak,
  lightLeakDefaults,
} from "@/registry/remocn/light-leak";

const [DEFAULT_LEAK, MID_A, MID_B, DEFAULT_BLOWOUT] = lightLeakDefaults.colors;

// The customizer passes flat props, the presentation takes a palette: the
// first color leads the leak, the last one is the blow-out tint.
function paletteOf(leakColor?: string, blowoutColor?: string) {
  return [
    leakColor ?? DEFAULT_LEAK,
    MID_A,
    MID_B,
    blowoutColor ?? DEFAULT_BLOWOUT,
  ];
}

interface LightLeakExampleProps {
  origin?: LightLeakProps["origin"];
  intensity?: number;
  leakColor?: string;
  blowoutColor?: string;
}

export function LightLeakExampleScene({
  origin,
  intensity,
  leakColor,
  blowoutColor,
}: LightLeakExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 20 })}
        presentation={lightLeak({
          origin,
          intensity,
          colors: paletteOf(leakColor, blowoutColor),
        })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <CanvasSceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const lightLeakExampleCode = (
  values: Record<string, unknown>,
): string => {
  const origin = (values.origin as string) ?? "left";
  const intensity = (values.intensity as number) ?? 1;
  const leakColor = (values.leakColor as string) ?? DEFAULT_LEAK;
  const blowoutColor = (values.blowoutColor as string) ?? DEFAULT_BLOWOUT;
  const customPalette =
    leakColor.toLowerCase() !== DEFAULT_LEAK.toLowerCase() ||
    blowoutColor.toLowerCase() !== DEFAULT_BLOWOUT.toLowerCase();
  const colors = customPalette
    ? `, colors: [${paletteOf(leakColor, blowoutColor)
        .map((c) => `"${c}"`)
        .join(", ")}]`
    : "";
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { lightLeak } from "@/components/remocn/light-leak";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 20 })}
      presentation={lightLeak({ origin: "${origin}", intensity: ${intensity}${colors} })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
