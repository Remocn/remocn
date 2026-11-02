"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useVideoConfig,
} from "remotion";

export type PixelSortProps = {
  /** Number of vertical columns the frame is sliced into. */
  columns?: number;
  /** Seed for per-column melt amount and timing. */
  seed?: number | string;
  /** Color of the bright smeared streaks. */
  streakColor?: string;
};

export const pixelSortDefaults: Required<PixelSortProps> = {
  columns: 40,
  seed: 5,
  streakColor: "#FFFFFF",
};

// Outgoing columns melt over MELT; incoming ones drop in (DROP) and snap (SNAP).
const MELT = 0.42;
const DROP = 0.14;
const SNAP = 0.12;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const meltEase = Easing.in(Easing.cubic);
const snapEase = Easing.out(Easing.back(1.6));

type Column = {
  left: number;
  width: number;
  meltAt: number;
  amount: number;
  glow: number;
  streakFrom: number;
  snapAt: number;
};

const PixelSortPresentation: React.FC<
  TransitionPresentationComponentProps<PixelSortProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { width, height } = useVideoConfig();
  const { columns, seed, streakColor } = {
    ...pixelSortDefaults,
    ...passedProps,
  };
  const count = Math.max(2, Math.round(columns));

  const layout = useMemo<Column[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (key: string) => random(`pixel-sort-${seed}-${key}-${i}`);
        const left = Math.floor((i * width) / count);
        const right = Math.floor(((i + 1) * width) / count);
        return {
          left,
          // 1px overlap keeps resting columns seamless.
          width: right - left + (i < count - 1 ? 1 : 0),
          meltAt: r("m") * 0.2,
          amount: 0.25 + r("a") ** 2 * 1.6,
          glow: 0.15 + r("g") * 0.75,
          streakFrom: 10 + r("s") * 50,
          snapAt: 0.5 + r("t") * (1 - 0.5 - DROP - SNAP) + DROP,
        };
      }),
    [count, seed, width],
  );

  const p = presentationProgress;
  const exiting = presentationDirection === "exiting";

  return (
    <AbsoluteFill>
      {layout.map((c) => {
        let stretch: number;
        let shift: number;
        let streak: number;
        let opacity = 1;
        let origin = "50% 0%";
        if (exiting) {
          const m = meltEase(
            interpolate(p, [c.meltAt, c.meltAt + MELT], [0, 1], clamp),
          );
          // Stretch around the streak start so the column never tears open.
          stretch = 1 + m * c.amount * 4;
          shift = 0;
          origin = `50% ${c.streakFrom}%`;
          streak = m * c.glow;
        } else {
          const drop = interpolate(
            p,
            [c.snapAt - DROP, c.snapAt],
            [0, 1],
            clamp,
          );
          const snap = snapEase(
            interpolate(p, [c.snapAt, c.snapAt + SNAP], [0, 1], clamp),
          );
          if (drop <= 0) return null;
          // A smeared streak falls in from above, then snaps to the real image.
          stretch = interpolate(snap, [0, 1], [1 + c.amount * 3, 1]);
          shift = -(1 - Easing.out(Easing.cubic)(drop)) * height * 1.1;
          streak = (1 - Math.min(1, Math.max(0, snap))) * Math.max(0.5, c.glow);
          opacity = interpolate(drop, [0, 0.3], [0, 1], clamp);
        }
        return (
          <div
            key={c.left}
            style={{
              position: "absolute",
              left: c.left,
              top: 0,
              width: c.width,
              height,
              overflow: "hidden",
              opacity,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -c.left,
                top: 0,
                width,
                height,
                transformOrigin: origin,
                transform: `translateY(${shift}px) scaleY(${stretch})`,
              }}
            >
              {children}
            </div>
            {streak > 0.002 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: streak,
                  background: `linear-gradient(to bottom, transparent ${c.streakFrom}%, ${streakColor} ${c.streakFrom + 30}%, transparent 100%)`,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export function pixelSort(
  props: PixelSortProps = {},
): TransitionPresentation<PixelSortProps> {
  return { component: PixelSortPresentation, props };
}
