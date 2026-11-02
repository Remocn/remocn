"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { AfterEffectsMark } from "./ae-mark";
import {
  aeDuration,
  COMP_SIZE,
  type HeroTilesConfig,
  TILE_SIZE,
} from "./config";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const OFFSET = (COMP_SIZE - TILE_SIZE) / 2;

function bounceAt(frame: number, period: number, height: number) {
  const t = (frame % period) / period;
  const air = 0.62;
  if (t < air) {
    const p = t / air;
    return { lift: height * 4 * p * (1 - p), squash: 0 };
  }
  const land = (t - air) / (1 - air);
  return {
    lift: 0,
    squash: Math.sin(Math.PI * Math.min(land * 2.2, 1)) * 0.06,
  };
}

function Beachball({ frame }: { frame: number }) {
  const size = TILE_SIZE * 0.36;
  return (
    <div
      style={{
        position: "absolute",
        left: OFFSET + TILE_SIZE * 0.66,
        top: OFFSET + TILE_SIZE * 0.62,
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "conic-gradient(from 0deg, #FF3B30, #FF9500, #FFCC00, #34C759, #0A84FF, #BF5AF2, #FF3B30)",
        transform: `rotate(${frame * 16}deg)`,
        boxShadow: "0 0 0 4px #FFFFFF, 0 8px 18px #00000040",
      }}
    />
  );
}

function StallBar({
  frame,
  total,
  stallAt,
}: {
  frame: number;
  total: number;
  stallAt: number;
}) {
  const sprint = interpolate(frame, [0, total * 0.28], [0, stallAt], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const crawl = interpolate(frame, [total * 0.28, total], [0, 0.8], clamp);
  const value = Math.min(sprint + crawl, 99.9);
  return (
    <div
      style={{
        position: "absolute",
        left: TILE_SIZE * 0.14,
        right: TILE_SIZE * 0.14,
        bottom: TILE_SIZE * 0.12,
        height: 14,
        borderRadius: 7,
        background: "#00005B99",
        boxShadow: "inset 0 0 0 2px #9999FF66",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          borderRadius: 7,
          background: "#9999FF",
        }}
      />
    </div>
  );
}

export function AeTileComposition({ config }: { config: HeroTilesConfig }) {
  const raw = useCurrentFrame();
  const total = aeDuration(config);
  const frame = (raw + total - (config.ae.delay % total)) % total;
  const { mode, period, bounce, tilt, stallAt } = config.ae;
  const motion =
    mode === "bounce"
      ? bounceAt(frame, period, bounce * TILE_SIZE)
      : { lift: 0, squash: 0 };
  const dim = mode === "beachball" ? 0.82 : 1;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: OFFSET + TILE_SIZE * 0.1,
          right: OFFSET + TILE_SIZE * 0.1,
          top: OFFSET + TILE_SIZE * 1.04,
          height: 24,
          borderRadius: "50%",
          background: "#00005B",
          filter: "blur(14px)",
          opacity: 0.32 * (1 - motion.lift / (TILE_SIZE * 0.6)),
          transform: `scale(${1 - motion.lift / (TILE_SIZE * 1.2)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: OFFSET,
          top: OFFSET,
          width: TILE_SIZE,
          height: TILE_SIZE,
          borderRadius: TILE_SIZE * 0.18,
          overflow: "hidden",
          transformOrigin: "50% 100%",
          transform: `translateY(${-motion.lift}px) rotate(${tilt}deg) scale(${1 + motion.squash}, ${1 - motion.squash})`,
          filter: dim < 1 ? `brightness(${dim}) saturate(0.7)` : undefined,
        }}
      >
        <AfterEffectsMark className="block size-full" />
        {mode === "stalled" && (
          <StallBar frame={frame} total={total} stallAt={stallAt} />
        )}
      </div>
      {mode === "beachball" && <Beachball frame={frame} />}
    </AbsoluteFill>
  );
}
