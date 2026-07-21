"use client";

import { useCurrentFrame } from "remotion";
import {
  DEFAULT_STEP,
  hash01,
  hashRange,
  steppedRamp,
} from "@/lib/remocn/stop-motion";

const SAMPLES_PER_LAP = 48;
const NOISE = 0.035;
const CENTRE = 0.02;
const GRAIN_RATIO = 0.5;

export type ScribblePoint = { x: number; y: number };

export type ScribbleCircleGeometry = {
  width: number;
  height: number;
  strokeWidth: number;
  laps?: number;
  pressure?: number;
  grain?: number;
  seed?: string;
  points?: number;
  progress?: number;
};

export function scribbleCircleCentre(
  width: number,
  height: number,
  seed = "scribble",
): ScribblePoint {
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
}): ScribblePoint[] {
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

export function scribbleCircleHalfWidth(
  strokeWidth: number,
  pressure: number,
  t: number,
): number {
  return (strokeWidth / 2) * (pressure + (1 - pressure) * t);
}

export function scribbleCircleGrainScale(
  strokeWidth: number,
  grain: number,
): number {
  return strokeWidth * GRAIN_RATIO * grain;
}

const normalAt = (points: ScribblePoint[], i: number): ScribblePoint => {
  const before = points[i - 1] ?? points[i];
  const after = points[i + 1] ?? points[i];
  const tx = after.x - before.x;
  const ty = after.y - before.y;
  const length = Math.hypot(tx, ty) || 1;
  return { x: -ty / length, y: tx / length };
};

const curveSegments = (points: ScribblePoint[]): string =>
  points
    .slice(0, -1)
    .map((p1, i) => {
      const p0 = points[i - 1] ?? p1;
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      return `C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
    })
    .join(" ");

export function scribbleCirclePath(args: ScribbleCircleGeometry): {
  d: string;
  viewBox: string;
  marginX: number;
  marginY: number;
} {
  const pressure = args.pressure ?? 0.2;
  const grain = args.grain ?? 1;
  const progress = args.progress ?? 1;
  const spine = scribbleCirclePoints(args);
  const drawn = Math.max(2, Math.round(progress * (spine.length - 1)) + 1);

  const left: ScribblePoint[] = [];
  const right: ScribblePoint[] = [];
  for (let i = 0; i < drawn; i++) {
    const half = scribbleCircleHalfWidth(
      args.strokeWidth,
      pressure,
      i / (spine.length - 1),
    );
    const normal = normalAt(spine, i);
    left.push({
      x: spine[i].x + normal.x * half,
      y: spine[i].y + normal.y * half,
    });
    right.push({
      x: spine[i].x - normal.x * half,
      y: spine[i].y - normal.y * half,
    });
  }
  const back = right.slice().reverse();

  const reach =
    args.strokeWidth / 2 +
    scribbleCircleGrainScale(args.strokeWidth, grain) / 2;
  const marginX = reach + (args.width / 2) * NOISE + args.width * CENTRE;
  const marginY = reach + (args.height / 2) * NOISE + args.height * CENTRE;

  return {
    d: `M ${left[0].x} ${left[0].y} ${curveSegments(left)} L ${back[0].x} ${back[0].y} ${curveSegments(back)} Z`,
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
    grain,
    seed,
    progress,
  });

  const grainScale = scribbleCircleGrainScale(strokeWidth, grain);
  const filterId = `scribble-grain-${Math.floor(hash01(seed) * 1e9)}`;

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
        <defs>
          <filter
            id={filterId}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves={3}
              seed={Math.floor(hash01(`${seed}:grain`) * 1000)}
              result="grain"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="grain"
              scale={grainScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <path
          d={d}
          fill={color}
          opacity={0.85}
          filter={grain > 0 ? `url(#${filterId})` : undefined}
        />
      </svg>
    </div>
  );
}
