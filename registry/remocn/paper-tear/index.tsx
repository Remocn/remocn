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
  spring,
  useVideoConfig,
} from "remotion";

export type PaperTearProps = {
  /** Strength of the impact: shake, flash and debris. 0 turns them off. */
  impact?: number;
  /** Seed for the shape of the rip. */
  seed?: number | string;
  /** Color of the fibrous torn edge. */
  edgeColor?: string;
  /** How jagged the rip is, 0 to 1. */
  roughness?: number;
  /** Shadow the torn halves cast on the incoming scene. */
  shadowColor?: string;
};

export const paperTearDefaults: Required<PaperTearProps> = {
  impact: 1,
  seed: 7,
  edgeColor: "#FFFFFF",
  roughness: 0.5,
  shadowColor: "rgba(0, 0, 0, 0.45)",
};

// Timeline, as shares of the transition: the paper strains, then the rip
// tears through the whole frame in a couple of frames (the impact), then the
// halves are flung apart.
const STRAIN = 0.2;
const IMPACT = 0.28;
const SEGMENTS = 44;
const DEBRIS = 28;
const ripEase = Easing.in(Easing.quad);
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type TearPoint = { x: number; y: number; left: number; right: number };

function buildTear(
  seed: number | string,
  roughness: number,
  width: number,
  height: number,
): TearPoint[] {
  const r = Math.min(1, Math.max(0, roughness));
  const unit = Math.min(width, height);
  const tilt = (random(`tear-tilt-${seed}`) - 0.5) * width * 0.08;
  const phaseA = random(`tear-pa-${seed}`) * Math.PI * 2;
  const phaseB = random(`tear-pb-${seed}`) * Math.PI * 2;
  const fiber = unit * (0.008 + r * 0.012);
  const points: TearPoint[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const wander =
      Math.sin(t * Math.PI * 2.2 + phaseA) * width * 0.025 +
      Math.sin(t * Math.PI * 5.3 + phaseB) * width * 0.012;
    // Alternate the jitter sign so the rip zig-zags instead of drifting.
    const zig = (i % 2 === 0 ? 1 : -1) * random(`tear-z-${seed}-${i}`);
    points.push({
      x:
        width / 2 +
        tilt * (t - 0.5) +
        wander * (0.4 + r) +
        zig * unit * 0.022 * r,
      y: -unit * 0.05 + t * (height + unit * 0.1),
      left: fiber * (0.35 + random(`tear-l-${seed}-${i}`) * 1.3),
      right: fiber * (0.2 + random(`tear-r-${seed}-${i}`) * 0.9),
    });
  }
  return points;
}

type Shard = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  size: number;
  shape: string;
};

// Paper scraps blown out of the seam at the moment of impact.
function buildDebris(
  seed: number | string,
  tear: TearPoint[],
  unit: number,
): Shard[] {
  return Array.from({ length: DEBRIS }, (_, i) => {
    const r = (k: string) => random(`tear-debris-${seed}-${i}-${k}`);
    const at = tear[Math.floor(r("at") * tear.length)];
    const side = r("side") < 0.5 ? -1 : 1;
    const corners = Array.from({ length: 4 }, (_, k) => {
      const a = (k / 4) * Math.PI * 2 + r(`a${k}`) * 1.2;
      const d = 0.55 + r(`d${k}`) * 0.45;
      return `${(50 + Math.cos(a) * 50 * d).toFixed(0)}% ${(50 + Math.sin(a) * 50 * d).toFixed(0)}%`;
    });
    return {
      x: at.x,
      y: at.y,
      vx: side * unit * (0.25 + r("vx") * 0.9),
      vy: -unit * (0.1 + r("vy") * 0.55),
      spin: (r("spin") - 0.5) * 1440,
      size: unit * (0.008 + r("size") ** 2 * 0.026),
      shape: `polygon(${corners.join(",")})`,
    };
  });
}

// Damped camera jolt that starts at the impact.
function shakeAt(p: number, unit: number, impact: number) {
  const t = p - IMPACT;
  if (t < 0 || impact <= 0) return { x: 0, y: 0, amp: 0 };
  const decay = Math.exp(-t * 11);
  const amp = unit * 0.03 * impact * decay;
  return {
    x: Math.sin(t * 95) * amp,
    y: Math.cos(t * 120 + 0.6) * amp * 0.7,
    amp,
  };
}

const px = (x: number, y: number) => `${x}px ${y}px`;

const PaperTearPresentation: React.FC<
  TransitionPresentationComponentProps<PaperTearProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { width, height, fps } = useVideoConfig();
  const { seed, edgeColor, roughness, shadowColor, impact } = {
    ...paperTearDefaults,
    ...passedProps,
  };
  const tear = useMemo(
    () => buildTear(seed, roughness, width, height),
    [seed, roughness, width, height],
  );
  const unit = Math.min(width, height);
  const debris = useMemo(
    () => buildDebris(seed, tear, unit),
    [seed, tear, unit],
  );
  const p = presentationProgress;
  const shake = shakeAt(p, unit, impact);

  if (presentationDirection === "entering") {
    // The next scene is punched toward camera by the hit and settles back.
    const scale = interpolate(p, [IMPACT, 1], [1 + 0.1 * impact, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    return (
      <AbsoluteFill
        style={{
          transform: `translate(${shake.x}px, ${shake.y}px) scale(${scale})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  // Strain: the sheet trembles and leans toward camera before it gives way.
  const strain = interpolate(p, [0, STRAIN, IMPACT], [0, 1, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const tremble =
    p < IMPACT ? Math.sin(p * 260) * unit * 0.004 * strain * impact : 0;
  const lean = 1 + 0.025 * strain * (p < IMPACT ? 1 : 0);
  const front =
    -unit * 0.1 +
    ripEase(interpolate(p, [STRAIN, IMPACT], [0, 1], clamp)) *
      (height + unit * 0.25);
  // The torn fibres open up a short distance behind the running rip front.
  const open = (y: number) =>
    interpolate(front - y, [0, unit * 0.12], [0, 1], clamp);

  const pad = unit;
  const edge = tear.map((t) => px(t.x, t.y));
  const leftInk = tear.map((t) => px(t.x - t.left * open(t.y), t.y));
  const rightInk = tear.map((t) => px(t.x + t.right * open(t.y), t.y));
  const leftOuter = [px(-pad, height + pad), px(-pad, -pad)];
  const rightOuter = [px(width + pad, height + pad), px(width + pad, -pad)];
  const poly = (pts: string[]) => `polygon(${pts.join(",")})`;
  const leftPaper = poly([...edge, ...leftOuter]);
  const rightPaper = poly([...edge, ...rightOuter]);
  const leftPrint = poly([...leftInk, ...leftOuter]);
  const rightPrint = poly([...rightInk, ...rightOuter]);

  const peelFrames = 30;
  // A stiff spring right after the impact flings the halves apart.
  const peel = spring({
    frame: Math.max(0, (p - IMPACT) / (1 - IMPACT)) * peelFrames,
    fps,
    durationInFrames: peelFrames,
    config: { damping: 15, stiffness: 150, mass: 0.8 },
  });
  const maxX = Math.max(...tear.map((t) => t.x));
  const minX = Math.min(...tear.map((t) => t.x));
  // The inner edges swing toward camera as the halves part, so travel gets
  // headroom for the perspective growth. Pivoting on the outer edges keeps
  // the frame border sealed (a flat rotate would expose the top or bottom).
  const leftTravel = (maxX + unit * 0.12) * 1.3;
  const rightTravel = (width - minX + unit * 0.12) * 1.3;
  const curl = peel * 24;
  const lens = `perspective(${unit * 2.6}px)`;
  // Grow the shadow from zero so the closed rip shows no dark seam.
  const cast = interpolate(p, [IMPACT, IMPACT + 0.1], [0, 1], clamp);
  const shadow = `drop-shadow(0 ${unit * 0.012 * cast}px ${unit * 0.04 * cast}px ${shadowColor})`;

  const half = (
    paper: string,
    print: string,
    transform: string,
    origin: string,
  ) => (
    <AbsoluteFill
      style={{
        transform,
        transformOrigin: origin,
        filter: cast > 0 ? shadow : undefined,
      }}
    >
      <AbsoluteFill style={{ clipPath: paper, backgroundColor: edgeColor }} />
      <AbsoluteFill style={{ clipPath: print }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );

  // Flash along the seam and scraps of paper blown out of it.
  const flash =
    impact > 0
      ? interpolate(p, [IMPACT - 0.03, IMPACT, IMPACT + 0.14], [0, 1, 0], {
          ...clamp,
        }) * Math.min(1, impact)
      : 0;
  const seam = tear.map((t) => `${t.x},${t.y}`).join(" ");
  const age = p - IMPACT;
  const gravity = unit * 2.6;
  // Debris time runs in "seconds" of the transition so it reads physical.
  const dt = age * 1.1;

  return (
    <AbsoluteFill
      style={{
        zIndex: 2,
        // Overscan just enough that the jolt never exposes the frame edge.
        transform: `translate(${shake.x + tremble}px, ${shake.y}px) scale(${
          lean + (2.2 * shake.amp) / unit
        })`,
      }}
    >
      {front < height + unit * 0.05 ? (
        // Below the running rip the sheet is still whole. Cover the seam with
        // an intact copy so the split halves never show an anti-aliased hairline.
        <AbsoluteFill
          style={{
            clipPath: poly([
              px(-pad, front),
              px(width + pad, front),
              px(width + pad, height + pad),
              px(-pad, height + pad),
            ]),
            zIndex: 1,
          }}
        >
          {children}
        </AbsoluteFill>
      ) : null}
      {half(
        leftPaper,
        leftPrint,
        `${lens} translateX(${-peel * leftTravel}px) rotateY(${-curl}deg)`,
        "0% 50%",
      )}
      {half(
        rightPaper,
        rightPrint,
        `${lens} translateX(${peel * rightTravel}px) rotateY(${curl}deg)`,
        "100% 50%",
      )}
      {flash > 0.01 ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <polyline
            points={seam}
            fill="none"
            stroke={edgeColor}
            strokeOpacity={flash * 0.35}
            strokeWidth={unit * 0.06 * flash}
            strokeLinejoin="round"
          />
          <polyline
            points={seam}
            fill="none"
            stroke={edgeColor}
            strokeOpacity={flash}
            strokeWidth={unit * 0.012}
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {impact > 0 && age > 0
        ? debris.map((shard, i) => {
            const fade = interpolate(age, [0.35, 0.6], [1, 0], clamp);
            if (fade <= 0) return null;
            const x = shard.x + shard.vx * dt * impact;
            const y =
              shard.y + shard.vy * dt * impact + 0.5 * gravity * dt * dt;
            const size = shard.size * (0.5 + 0.5 * Math.min(1, impact));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x - size / 2,
                  top: y - size / 2,
                  width: size,
                  height: size,
                  backgroundColor: edgeColor,
                  clipPath: shard.shape,
                  opacity: fade,
                  transform: `rotate(${shard.spin * dt}deg)`,
                }}
              />
            );
          })
        : null}
    </AbsoluteFill>
  );
};

export function paperTear(
  props: PaperTearProps = {},
): TransitionPresentation<PaperTearProps> {
  return { component: PaperTearPresentation, props };
}
