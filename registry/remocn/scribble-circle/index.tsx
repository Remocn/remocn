"use client";

import { useCurrentFrame } from "remotion";
import {
  BrushGrain,
  type BrushPoint,
  brushFilterId,
  brushReach,
  brushRibbon,
} from "@/components/remocn/brush";
import { DEFAULT_STEP, hashRange, steppedRamp } from "@/lib/remocn/stop-motion";

const SAMPLES_PER_LAP = 48;
const NOISE = 0.035;
const CENTRE = 0.02;

export type ScribbleCircleGeometry = {
  width: number;
  height: number;
  strokeWidth: number;
  laps?: number;
  pressure?: number;
  release?: number;
  grain?: number;
  seed?: string;
  points?: number;
  progress?: number;
};

export function scribbleCircleCentre(
  width: number,
  height: number,
  seed = "scribble",
): BrushPoint {
  return {
    x: width / 2 + hashRange(`${seed}:cx`, -CENTRE, CENTRE) * width,
    y: height / 2 + hashRange(`${seed}:cy`, -CENTRE, CENTRE) * height,
  };
}

export function scribbleCirclePoints(args: {
  width: number;
  height: number;
  laps?: number;
  seed?: string;
  points?: number;
}): BrushPoint[] {
  const laps = args.laps ?? 1.15;
  const seed = args.seed ?? "scribble";
  const points = args.points ?? SAMPLES_PER_LAP;

  const count = Math.max(2, Math.ceil(laps * points));
  const rx = args.width / 2;
  const ry = args.height / 2;
  const { x: cx, y: cy } = scribbleCircleCentre(args.width, args.height, seed);

  return Array.from({ length: count }, (_, i) => {
    const angle = laps * Math.PI * 2 * (i / (count - 1));
    const scale = 1 + hashRange(`${seed}:r${i}`, -NOISE, NOISE);
    return {
      x: cx + rx * scale * Math.cos(angle),
      y: cy + ry * scale * Math.sin(angle),
    };
  });
}

export function scribbleCirclePath(args: ScribbleCircleGeometry): {
  d: string;
  viewBox: string;
  marginX: number;
  marginY: number;
} {
  const grain = args.grain ?? 1;
  const reach = brushReach(args.strokeWidth, grain);
  const marginX = reach + (args.width / 2) * NOISE + args.width * CENTRE;
  const marginY = reach + (args.height / 2) * NOISE + args.height * CENTRE;

  return {
    d: brushRibbon(scribbleCirclePoints(args), {
      strokeWidth: args.strokeWidth,
      pressure: args.pressure,
      release: args.release,
      progress: args.progress,
    }),
    viewBox: `${-marginX} ${-marginY} ${args.width + marginX * 2} ${args.height + marginY * 2}`,
    marginX,
    marginY,
  };
}

export function scribbleCircleProgress(
  frame: number,
  options?: { delay?: number; durationSteps?: number; step?: number },
): number {
  const delay = options?.delay ?? 0;
  const durationSteps = options?.durationSteps ?? 10;
  const step = options?.step ?? DEFAULT_STEP;
  return steppedRamp(frame, delay, delay + durationSteps * step, { step });
}

export interface ScribbleCircleProps {
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  pressure?: number;
  release?: number;
  grain?: number;
  delay?: number;
  durationSteps?: number;
  laps?: number;
  seed?: string;
  step?: number;
}

export function ScribbleCircle({
  width,
  height,
  color = "#6f7f35",
  strokeWidth = 14,
  pressure = 0.2,
  release = 1,
  grain = 1,
  delay = 0,
  durationSteps = 10,
  laps = 1.15,
  seed = "scribble",
  step = DEFAULT_STEP,
}: ScribbleCircleProps) {
  const frame = useCurrentFrame();
  const progress = scribbleCircleProgress(frame, {
    delay,
    durationSteps,
    step,
  });
  const { d, viewBox, marginX, marginY } = scribbleCirclePath({
    width,
    height,
    strokeWidth,
    laps,
    pressure,
    release,
    grain,
    seed,
    progress,
  });

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        opacity: progress > 0 ? 1 : 0,
      }}
    >
      <svg
        width={width + marginX * 2}
        height={height + marginY * 2}
        viewBox={viewBox}
        style={{
          position: "absolute",
          left: -marginX,
          top: -marginY,
          display: "block",
          overflow: "visible",
        }}
      >
        <title>Scribbled circle</title>
        <BrushGrain seed={seed} strokeWidth={strokeWidth} grain={grain} />
        <path
          d={d}
          fill={color}
          opacity={0.85}
          filter={
            grain > 0
              ? `url(#${brushFilterId(seed, strokeWidth, grain)})`
              : undefined
          }
        />
      </svg>
    </div>
  );
}
