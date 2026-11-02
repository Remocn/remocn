"use client";

import { AbsoluteFill, interpolate, Series, useCurrentFrame } from "remotion";
import { LivePlayer } from "../../ui/catalog-card";
import { Clip, nativeDuration } from "../hero/tiles/clips";
import type { ClipSpec } from "../hero/tiles/config";

const STRIP = { width: 1280, height: 300 };
const HOLD = 24;
const FADE = 6;

function beatLength(spec: ClipSpec) {
  return Math.max(nativeDuration(spec.name) - spec.start, 1) + HOLD;
}

function Beat({
  spec,
  length,
  box,
}: {
  spec: ClipSpec;
  length: number;
  box: { width: number; height: number };
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [length - FADE, length], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity }}>
      <Clip
        spec={{ ...spec, end: "hold" }}
        frame={box}
        canvas={STRIP}
        anchor="bottom-left"
      />
    </AbsoluteFill>
  );
}

function RemixScene({
  specs,
  width,
  height,
}: {
  specs: ClipSpec[];
  width: number;
  height: number;
}) {
  return (
    <Series>
      {specs.map((spec, index) => {
        const length = beatLength(spec);
        return (
          <Series.Sequence
            key={`${spec.name}-${index}`}
            durationInFrames={length}
          >
            <Beat spec={spec} length={length} box={{ width, height }} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
}

export function TypeRemix({ specs }: { specs: ClipSpec[] }) {
  const total = specs.reduce((sum, spec) => sum + beatLength(spec), 0);
  return (
    <LivePlayer
      component={RemixScene}
      inputProps={{ specs }}
      durationInFrames={total}
      stillFrame={specs[0] ? beatLength(specs[0]) - HOLD : 0}
    />
  );
}
