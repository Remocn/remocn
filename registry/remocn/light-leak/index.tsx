"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, useVideoConfig } from "remotion";

export type LightLeakOrigin = "left" | "right" | "top" | "bottom";

export type LightLeakProps = {
  /** Leak colors, warmest first. The last one is the blow-out tint. */
  colors?: string[];
  /** Edge the leak drifts in from. */
  origin?: LightLeakOrigin;
  /** Strength of the leak and the blow-out, 0 to 1. */
  intensity?: number;
};

export const lightLeakDefaults: Required<LightLeakProps> = {
  colors: ["#FF5A1F", "#E5322D", "#FFB347", "#FFF3E0"],
  origin: "left",
  intensity: 1,
};

// Each flare: offset along the drift axis, position across it, size, strength.
const FLARES = [
  { along: 0, across: 0.3, size: 0.85, alpha: 1 },
  { along: -0.18, across: 0.78, size: 0.7, alpha: 0.85 },
  { along: 0.12, across: 0.55, size: 0.55, alpha: 0.9 },
  { along: -0.32, across: 0.12, size: 0.6, alpha: 0.7 },
  { along: 0.05, across: 0.95, size: 0.5, alpha: 0.6 },
];
// Heat of the leak: ramps into the cut, then cools off more slowly.
function heat(p: number) {
  if (p <= 0.5) return Easing.in(Easing.quad)(p / 0.5);
  return 1 - Easing.out(Easing.quad)((p - 0.5) / 0.5);
}

function Leak({
  p,
  colors,
  origin,
  intensity,
}: {
  p: number;
  colors: string[];
  origin: LightLeakOrigin;
  intensity: number;
}) {
  const { width, height } = useVideoConfig();
  const k = heat(p) * intensity;
  const span = Math.max(width, height);
  const drift = interpolate(p, [0, 1], [-0.25, 1.05], {
    easing: Easing.bezier(0.3, 0.1, 0.5, 0.9),
  });
  const palette = colors.length > 0 ? colors : lightLeakDefaults.colors;
  const blowout = palette[palette.length - 1];
  // A narrow peak right at the cut takes the frame to near-white.
  const flash = Math.exp(-(((p - 0.5) / 0.1) ** 2)) * intensity;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {FLARES.map((f, i) => {
        let along = drift + f.along;
        if (origin === "right" || origin === "bottom") along = 1 - along;
        const horizontal = origin === "left" || origin === "right";
        const x = (horizontal ? along : f.across) * width;
        const y = (horizontal ? f.across : along) * height;
        const color = palette[i % Math.max(1, palette.length - 1)];
        return (
          <AbsoluteFill
            key={f.across}
            style={{
              mixBlendMode: "screen",
              // sqrt keeps the leak hot as it enters; drift, not fade, sells it.
              opacity: Math.min(1, Math.sqrt(k) * f.alpha * 1.1),
              background: `radial-gradient(circle ${span * f.size}px at ${x}px ${y}px, color-mix(in srgb, ${color} 55%, ${blowout}) 0%, ${color} 22%, color-mix(in srgb, ${color} 55%, transparent) 45%, transparent 72%)`,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{ backgroundColor: blowout, opacity: Math.min(0.96, flash) }}
      />
    </AbsoluteFill>
  );
}

const LightLeakPresentation: React.FC<
  TransitionPresentationComponentProps<LightLeakProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { colors, origin, intensity } = {
    ...lightLeakDefaults,
    ...passedProps,
  };
  const p = presentationProgress;
  const k = heat(p) * intensity;
  // Hard cut under the blow-out: the incoming scene owns the frame from 0.5.
  const visible = presentationDirection === "exiting" ? p < 0.5 : p >= 0.5;

  return (
    <AbsoluteFill style={{ opacity: visible ? 1 : 0 }}>
      <AbsoluteFill
        style={{
          // Squared so the picture only burns out close to the cut.
          filter: `brightness(${1 + k * k * 1.6}) saturate(${1 + k * 0.4})`,
        }}
      >
        {children}
      </AbsoluteFill>
      {visible && k > 0.001 ? (
        <Leak p={p} colors={colors} origin={origin} intensity={intensity} />
      ) : null}
    </AbsoluteFill>
  );
};

export function lightLeak(
  props: LightLeakProps = {},
): TransitionPresentation<LightLeakProps> {
  return { component: LightLeakPresentation, props };
}
