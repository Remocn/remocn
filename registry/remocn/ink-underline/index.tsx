"use client";

import { useCurrentFrame } from "remotion";
import { DEFAULT_STEP, hashRange, steppedRamp } from "@/lib/remocn/stop-motion";

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export interface InkUnderlineProps {
  width: number;
  color?: string;
  thickness?: number;
  delay?: number;
  durationSteps?: number;
  seed?: string;
  step?: number;
}

export function InkUnderline({
  width,
  color = "#6f7f35",
  thickness = 9,
  delay = 0,
  durationSteps = 5,
  seed = "ink",
  step = DEFAULT_STEP,
}: InkUnderlineProps) {
  const frame = useCurrentFrame();
  const progress = steppedRamp(frame, delay, delay + durationSteps * step, {
    ease: easeOutCubic,
    step,
  });
  const wobble = hashRange(`${seed}:w`, -1.2, 1.2);
  const height = thickness + 4;
  const mid = thickness / 2 + 2;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        opacity: progress > 0 ? 1 : 0,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <path
          d={`M 2 ${mid} C ${width * 0.3} ${mid + wobble}, ${width * 0.7} ${mid - wobble}, ${width - 2} ${mid + wobble * 0.6}`}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          opacity={0.82}
        />
      </svg>
    </div>
  );
}
