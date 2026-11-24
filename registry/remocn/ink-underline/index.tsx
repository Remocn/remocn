"use client";
import {
  BrushGrain,
  type BrushPoint,
  brushFilterId,
  brushReach,
  brushRibbon,
  sampleCubic,
} from "@/components/remocn/brush";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { DEFAULT_STEP, hashRange, steppedRamp } from "@/lib/remocn/stop-motion";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type InkUnderlineElementId, inkUnderlineTimeline } from "./timeline";

const SAMPLES = 40;

export function inkUnderlineSpine(
  width: number,
  thickness: number,
  seed: string,
): BrushPoint[] {
  const wobble = hashRange(`${seed}:w`, -1.2, 1.2);
  const mid = thickness / 2 + 2;
  return sampleCubic(
    { x: 2, y: mid },
    { x: width * 0.3, y: mid + wobble },
    { x: width * 0.7, y: mid - wobble },
    { x: width - 2, y: mid + wobble * 0.6 },
    SAMPLES,
  );
}

export interface InkUnderlineProps {
  width: number;
  color?: string;
  thickness?: number;
  pressure?: number;
  release?: number;
  grain?: number;
  delay?: number;
  durationSteps?: number;
  seed?: string;
  step?: number;
  /**
   * Moves, trims or stretches the stroke, by the ids in `./timeline`.
   * Frames on the scene timeline.
   */
  timing?: Timing<InkUnderlineElementId>;
}

export function InkUnderline(props: InkUnderlineProps) {
  const {
    width,
    color = "#6f7f35",
    thickness = 9,
    pressure = 1,
    release = 0.15,
    grain = 1,
    seed = "ink",
    step = DEFAULT_STEP,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(inkUnderlineTimeline, props, durationInFrames, timing);
  const stroke = tl.get("stroke");
  const progress = steppedRamp(frame, stroke.start, stroke.end, { step });

  const reach = brushReach(thickness, grain);
  const height = thickness + 4;
  const d = brushRibbon(inkUnderlineSpine(width, thickness, seed), {
    strokeWidth: thickness,
    pressure,
    release,
    progress,
  });

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
        width={width + reach * 2}
        height={height + reach * 2}
        viewBox={`${-reach} ${-reach} ${width + reach * 2} ${height + reach * 2}`}
        style={{
          position: "absolute",
          left: -reach,
          top: -reach,
          display: "block",
          overflow: "visible",
        }}
      >
        <title>Ink underline</title>
        <BrushGrain seed={seed} strokeWidth={thickness} grain={grain} />
        <path
          d={d}
          fill={color}
          opacity={0.85}
          filter={
            grain > 0
              ? `url(#${brushFilterId(seed, thickness, grain)})`
              : undefined
          }
        />
      </svg>
    </div>
  );
}
