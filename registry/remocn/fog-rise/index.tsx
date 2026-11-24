"use client";

import { interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type FogRiseElementId,
  fogRiseTimeline,
  RESOLVE_FRAMES,
  rings,
  STAGGER,
} from "./timeline";

export interface FogRiseProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  stagger?: number;
  blur?: number;
  tilt?: number;
  depth?: number;
  lift?: number;
  drift?: number;
  exitAt?: number;
  exitAccel?: number;
  mass?: number;
  stiffness?: number;
  damping?: number;
  spreadGap?: number;
  tracking?: number;
  resolveFrames?: number;
  fadeFrames?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the rise, single letters and the fall, by the
   * ids in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<FogRiseElementId>;
}

export function fogRiseLength(
  text: string,
  stagger = STAGGER,
  resolveFrames = RESOLVE_FRAMES,
): number {
  const { chars, maxRing } = rings(text);
  if (chars.length === 0) return 0;
  return maxRing * stagger + resolveFrames;
}

export function FogRise(props: FogRiseProps) {
  const {
    text,
    fontSize = 304,
    color = "#004CFF",
    fontWeight = 400,
    blur = 0.17,
    tilt = 55,
    depth = 5,
    lift = 0.85,
    drift = 0.005,
    exitAccel = 0.04,
    mass = 1.3,
    stiffness = 60,
    damping = 13,
    spreadGap = 0.07,
    tracking = -0.07,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    fogRiseTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const { chars } = rings(text);
  const rise = tl.get("rise");
  const fall = tl.elements.find((e) => e.id === "exit");

  const converge = spring({
    frame: frame - rise.start,
    fps,
    config: { mass, stiffness, damping },
  });
  const angle = tilt * (1 - converge);
  const liftY = lift * fontSize * (1 - converge);
  const driftY = drift * fontSize * frame;
  const exitT = fall ? Math.max(frame - fall.start, 0) : 0;
  const exitY = 0.5 * exitAccel * exitT * exitT * fontSize;
  const gap = spreadGap * fontSize * (1 - converge);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: "6%",
        whiteSpace: "nowrap",
        perspective: `${depth * fontSize}px`,
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          transform: `translateY(${liftY - driftY - exitY}px) rotateX(${-angle}deg)`,
          transformOrigin: "50% 100%",
          fontSize,
          fontWeight,
          color,
          letterSpacing: `${tracking}em`,
          lineHeight: 1.15,
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        }}
      >
        {chars.map((char, j) => {
          const letter = tl.get(`char:${j}`);

          const opacity = interpolate(
            frame,
            [letter.start, letter.end],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const charBlur =
            blur *
            fontSize *
            interpolate(frame, [rise.start, rise.end], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

          return (
            <span
              key={j}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                marginRight: j < chars.length - 1 ? gap : undefined,
                opacity,
                filter: charBlur > 0.05 ? `blur(${charBlur}px)` : undefined,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </div>
  );
}
