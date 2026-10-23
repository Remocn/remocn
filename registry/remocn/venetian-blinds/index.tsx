"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, useVideoConfig } from "remotion";

export type VenetianBlindsDirection = "top-down" | "bottom-up" | "center";

export type VenetianBlindsProps = {
  /** Number of horizontal slats. */
  slats?: number;
  /** Share of the transition spent rippling across slats, 0 to 0.9. */
  stagger?: number;
  /** Which slat turns first. */
  direction?: VenetianBlindsDirection;
  /** Tint a slat picks up as it turns away from the light. */
  shadeColor?: string;
};

export const venetianBlindsDefaults: Required<VenetianBlindsProps> = {
  slats: 12,
  stagger: 0.55,
  direction: "top-down",
  shadeColor: "#000000",
};

const turnEase = Easing.bezier(0.55, 0, 0.35, 1);
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function slatDelay(
  index: number,
  count: number,
  direction: VenetianBlindsDirection,
) {
  if (count <= 1) return 0;
  const t = index / (count - 1);
  if (direction === "bottom-up") return 1 - t;
  if (direction === "center") return Math.abs(t - 0.5) * 2;
  return t;
}

const VenetianBlindsPresentation: React.FC<
  TransitionPresentationComponentProps<VenetianBlindsProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { width, height } = useVideoConfig();
  const { slats, stagger, direction, shadeColor } = {
    ...venetianBlindsDefaults,
    ...passedProps,
  };
  const p = presentationProgress;

  if (presentationDirection === "entering") {
    // The incoming scene settles back a touch as the blinds open on it.
    const scale = interpolate(p, [0, 1], [1.06, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    return (
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {children}
      </AbsoluteFill>
    );
  }

  const count = Math.max(1, Math.round(slats));
  const spread = Math.min(0.9, Math.max(0, stagger));

  return (
    <AbsoluteFill
      style={{
        zIndex: 2,
        perspective: height * 2.2,
        perspectiveOrigin: "50% 50%",
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const top = Math.floor((i * height) / count);
        const bottom = Math.floor(((i + 1) * height) / count);
        const start = slatDelay(i, count, direction) * spread;
        const local = turnEase(
          interpolate(p, [start, start + 1 - spread], [0, 1], clamp),
        );
        const angle = local * 90;
        // Fade out near edge-on so the last sliver never reads as a hairline.
        const fade = interpolate(angle, [76, 88], [1, 0], clamp);
        if (fade <= 0) return null;
        return (
          <div
            key={top}
            style={{
              position: "absolute",
              left: 0,
              top,
              width,
              // 1px overlap hides hairline seams between resting slats.
              height: bottom - top + (i < count - 1 ? 1 : 0),
              overflow: "hidden",
              transformOrigin: "50% 50%",
              transform: `rotateX(${angle}deg)`,
              backfaceVisibility: "hidden",
              opacity: fade,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: -top,
                width,
                height,
              }}
            >
              {children}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: shadeColor,
                opacity: Math.sin((angle * Math.PI) / 180) * 0.75,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export function venetianBlinds(
  props: VenetianBlindsProps = {},
): TransitionPresentation<VenetianBlindsProps> {
  return { component: VenetianBlindsPresentation, props };
}
