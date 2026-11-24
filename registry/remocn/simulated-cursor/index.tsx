"use client";

import { interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type CursorPoint,
  DEFAULT_POINTS,
  type SimulatedCursorElementId,
  simulatedCursorTimeline,
} from "./timeline";

export type { CursorPoint };

export interface SimulatedCursorProps {
  points?: CursorPoint[];
  color?: string;
  size?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches each leg of the cursor's path, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<SimulatedCursorElementId>;
}

export function SimulatedCursor(props: SimulatedCursorProps) {
  const {
    points = DEFAULT_POINTS,
    color = "#ffffff",
    size = 32,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    simulatedCursorTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const segments: Array<{
    start: number;
    end: number;
    holdEnd: number;
    from: CursorPoint;
    to: CursorPoint;
    dip: number;
    ripple: number;
  }> = [];

  for (let i = 0; i < points.length - 1; i++) {
    const leg = tl.get(`leg:${i}`);
    segments.push({
      start: leg.start,
      end: leg.start + leg.beat("travel"),
      holdEnd: leg.end,
      from: points[i],
      to: points[i + 1],
      dip: leg.beat("dip"),
      ripple: leg.beat("ripple"),
    });
  }

  // Find current segment
  let x = points[0].x;
  let y = points[0].y;
  let activeClickFrame: number | null = null;
  let clickTarget: CursorPoint | null = null;
  let dipFrames = 14;
  let rippleFrames = 24;

  if (segments.length === 0) {
    x = points[0].x;
    y = points[0].y;
  } else if (frame < segments[0].start + tl.get("leg:0").beat("wait")) {
    x = points[0].x;
    y = points[0].y;
  } else {
    for (const seg of segments) {
      if (frame >= seg.start && frame < seg.holdEnd) {
        if (frame < seg.end) {
          // travelling
          x = interpolate(frame, [seg.start, seg.end], [seg.from.x, seg.to.x], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          y = interpolate(frame, [seg.start, seg.end], [seg.from.y, seg.to.y], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        } else {
          x = seg.to.x;
          y = seg.to.y;
          if (seg.to.click) {
            activeClickFrame = frame - seg.end;
            clickTarget = seg.to;
            dipFrames = seg.dip;
            rippleFrames = seg.ripple;
          }
        }
        break;
      }
      if (frame >= seg.holdEnd) {
        x = seg.to.x;
        y = seg.to.y;
      }
    }
  }

  // Click feedback
  let clickScale = 1;
  let rippleRadius = 0;
  let rippleOpacity = 0;
  if (activeClickFrame !== null && clickTarget) {
    const dip = spring({
      fps,
      frame: activeClickFrame,
      config: { damping: 10, stiffness: 200, mass: 0.6 },
      durationInFrames: dipFrames,
    });
    clickScale = 1 - dip * 0.18;
    rippleRadius = interpolate(activeClickFrame, [0, rippleFrames], [4, 60], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    rippleOpacity = interpolate(activeClickFrame, [0, rippleFrames], [0.6, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {/* Click ripple */}
      {rippleOpacity > 0 && (
        <svg
          style={{
            position: "absolute",
            left: x - 80,
            top: y - 80,
            width: 160,
            height: 160,
            pointerEvents: "none",
          }}
        >
          <circle
            cx={80}
            cy={80}
            r={rippleRadius}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={rippleOpacity}
          />
        </svg>
      )}

      {/* Cursor */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          scale: `${clickScale}`,
          transformOrigin: "top left",
          zIndex: 2147483647,
          pointerEvents: "none",
          willChange: "left, top",
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 3L5 19L9.5 14.5L12.5 21L15 20L12 13.5L18.5 13.5L5 3Z"
            fill={color}
            stroke="#000000"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
