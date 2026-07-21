"use client";

import type React from "react";
import { useCurrentFrame } from "remotion";
import { DEFAULT_STEP, hashRange, qstep } from "@/lib/remocn/stop-motion";

const GRAVITY = 0.9;
const FLIGHT_SHRINK = 0.5;
const EXIT_OPACITY = 0.4;

const FOLD_TILT = 46;
const WAD_REACH = 0.27;
const WAD_SPREAD = 0.07;
const ANGLE_JITTER = 0.22;
const SCALE_SPREAD = 0.25;
const DEFAULT_RANDOMNESS = 0.6;
const DEFAULT_LAYERS = 2;
const LAYER_TILT_FLOOR = 0.45;
const FACET_SIZE = 0.5;
const FACET_CAP = 0.5;

const TONE_PATTERN = [0, 1, 3, 1, 0, 2, 1, 2, 0];

const TONES = [
  { lit: "rgba(255,255,255,0.66)", dark: "rgba(255,255,255,0.18)" },
  { lit: "rgba(255,255,255,0.30)", dark: "rgba(38,36,44,0.10)" },
  { lit: "rgba(255,255,255,0.08)", dark: "rgba(38,36,44,0.20)" },
  { lit: "rgba(38,36,44,0.06)", dark: "rgba(38,36,44,0.30)" },
];

const LIGHT_ANGLE = -55;
const CREASE_BLEND = 9;

export type CrumplePhase = "idle" | "crumple" | "toss" | "gone";

export type CrumplePose = {
  phase: CrumplePhase;
  crush: number;
  scale: number;
  rotate: number;
  x: number;
  y: number;
  opacity: number;
};

export type CrumpleSegment = {
  clip: [number, number][];
  origin: [number, number];
  dx: number;
  dy: number;
  scale: number;
  rotate: number;
  tone: number;
  crease: number;
};

export type CrumpleTossTiming = {
  at: number;
  crumpleSteps?: number;
  tossSteps?: number;
  direction?: number;
  distance?: number;
  spin?: number;
  crushTo?: number;
  seed?: string;
  step?: number;
};

const rayToEdge = (
  angle: number,
  halfWidth: number,
  halfHeight: number,
): [number, number] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const t = Math.min(
    halfWidth / (Math.abs(cos) || 1e-9),
    halfHeight / (Math.abs(sin) || 1e-9),
  );
  return [cos * t, sin * t];
};

const normalize = (angle: number) => {
  const turn = Math.PI * 2;
  return ((angle % turn) + turn) % turn;
};

const shrinkToward = (
  [x, y]: [number, number],
  factor: number,
): [number, number] => [x * factor, y * factor];

const averageOf = (points: [number, number][]): [number, number] => [
  points.reduce((sum, p) => sum + p[0], 0) / points.length,
  points.reduce((sum, p) => sum + p[1], 0) / points.length,
];

export function crumpleSegments(args: {
  width: number;
  height: number;
  segments?: number;
  layers?: number;
  crushTo?: number;
  randomness?: number;
  seed?: string;
}): CrumpleSegment[] {
  const count = Math.max(3, Math.round(args.segments ?? 9));
  const layers = Math.max(1, Math.round(args.layers ?? DEFAULT_LAYERS));
  const crushTo = args.crushTo ?? 0.34;
  const chaos = Math.min(1, Math.max(0, args.randomness ?? DEFAULT_RANDOMNESS));
  const seed = args.seed ?? "toss";
  const halfWidth = args.width / 2;
  const halfHeight = args.height / 2;
  const wad = Math.min(args.width, args.height) * crushTo;

  const angles = Array.from(
    { length: count },
    (_, i) =>
      (i / count) * Math.PI * 2 +
      hashRange(`${seed}:ang${i}`, -ANGLE_JITTER, ANGLE_JITTER) * chaos,
  );

  const corners: [number, number][] = [
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
  ];

  const toPercent = ([x, y]: [number, number]): [number, number] => [
    ((x + halfWidth) / args.width) * 100,
    ((y + halfHeight) / args.height) * 100,
  ];

  const panels: CrumpleSegment[] = [];

  angles.forEach((angle, i) => {
    const nextAngle =
      angles[(i + 1) % count] + (i === count - 1 ? Math.PI * 2 : 0);
    const from = rayToEdge(angle, halfWidth, halfHeight);
    const to = rayToEdge(nextAngle, halfWidth, halfHeight);

    const span = normalize(nextAngle - angle);
    const between = corners
      .map((corner): [[number, number], number] => [
        corner,
        normalize(Math.atan2(corner[1], corner[0]) - angle),
      ])
      .filter(([, spanned]) => spanned > 0 && spanned < span)
      .sort((a, b) => a[1] - b[1])
      .map(([corner]) => corner);

    const rim: [number, number][] = [from, ...between, to];

    for (let layer = 0; layer < layers; layer++) {
      const inner = layer / layers;
      const outer = (layer + 1) / layers;
      const depth = (layer + 1) / layers;
      const shape: [number, number][] =
        layer === 0
          ? [[0, 0], ...rim.map((point) => shrinkToward(point, outer))]
          : [
              ...rim.map((point) => shrinkToward(point, outer)),
              ...[...rim].reverse().map((point) => shrinkToward(point, inner)),
            ];

      const centroid = averageOf(shape);
      const extent =
        Math.max(
          ...shape.map((point) =>
            Math.hypot(point[0] - centroid[0], point[1] - centroid[1]),
          ),
        ) || 1;
      const key = `${seed}:${i}:${layer}`;

      const reach =
        wad *
        (WAD_REACH * depth +
          hashRange(`${key}:reach`, -WAD_SPREAD, WAD_SPREAD) * chaos * depth);
      const heading = Math.atan2(centroid[1], centroid[0]);

      panels.push({
        clip: shape.map(toPercent),
        origin: toPercent(centroid),
        dx: Math.cos(heading) * reach - centroid[0],
        dy: Math.sin(heading) * reach - centroid[1],
        scale:
          Math.min(FACET_CAP, (wad * FACET_SIZE) / extent) *
          (1 + hashRange(`${key}:size`, -SCALE_SPREAD, SCALE_SPREAD) * chaos),
        rotate:
          chaos === 0
            ? 0
            : hashRange(`${seed}:tilt${i}`, -FOLD_TILT, FOLD_TILT) *
              chaos *
              (LAYER_TILT_FLOOR + (1 - LAYER_TILT_FLOOR) * depth),
        tone: Math.min(
          TONES.length - 1,
          TONE_PATTERN[panels.length % TONE_PATTERN.length] +
            Math.ceil((1 - depth) * 2),
        ),
        crease: 0.5 + hashRange(`${key}:crease`, -0.2, 0.2) * chaos,
      });
    }
  });

  return panels;
}

export function creaseShading(
  piece: Pick<CrumpleSegment, "tone" | "rotate" | "crease">,
  crush: number,
): string {
  const tone = TONES[piece.tone];
  const fold = piece.crease * 100;
  const lit = Math.max(0, fold - CREASE_BLEND).toFixed(1);
  const dark = Math.min(100, fold + CREASE_BLEND).toFixed(1);
  const angle = (LIGHT_ANGLE - piece.rotate * crush).toFixed(1);
  return `linear-gradient(${angle}deg, ${tone.lit} 0%, ${tone.lit} ${lit}%, ${tone.dark} ${dark}%, ${tone.dark} 100%)`;
}

export function crumpleTossLanding(options?: {
  direction?: number;
  distance?: number;
}): { x: number; y: number } {
  const distance = options?.distance ?? 900;
  const radians = ((options?.direction ?? -35) * Math.PI) / 180;
  return {
    x: distance * Math.cos(radians),
    y: distance * Math.sin(radians) + GRAVITY * distance,
  };
}

export function crumpleTossPose(
  args: CrumpleTossTiming & { frame: number },
): CrumplePose {
  const crumpleSteps = args.crumpleSteps ?? 4;
  const tossSteps = args.tossSteps ?? 5;
  const direction = args.direction ?? -35;
  const distance = args.distance ?? 900;
  const spin = args.spin ?? 220;
  const step = args.step ?? DEFAULT_STEP;

  if (args.frame < args.at) {
    return {
      phase: "idle",
      crush: 0,
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0,
      opacity: 1,
    };
  }

  const pose = qstep(args.frame - args.at, step);

  if (pose < crumpleSteps) {
    return {
      phase: "crumple",
      crush: (pose + 1) / crumpleSteps,
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0,
      opacity: 1,
    };
  }

  if (pose < crumpleSteps + tossSteps) {
    const t = (pose - crumpleSteps + 1) / tossSteps;
    const radians = (direction * Math.PI) / 180;
    return {
      phase: "toss",
      crush: 1,
      scale: 1 - FLIGHT_SHRINK * t,
      rotate: spin * t,
      x: distance * Math.cos(radians) * t,
      y: distance * Math.sin(radians) * t + GRAVITY * distance * t * t,
      opacity: t === 1 ? EXIT_OPACITY : 1,
    };
  }

  return {
    phase: "gone",
    crush: 1,
    scale: 0,
    rotate: 0,
    x: 0,
    y: 0,
    opacity: 0,
  };
}

export interface CrumpleTossProps extends CrumpleTossTiming {
  children: React.ReactNode;
  width: number;
  height: number;
  segments?: number;
  layers?: number;
  randomness?: number;
}

export function CrumpleToss({
  children,
  width,
  height,
  segments,
  layers,
  randomness,
  ...timing
}: CrumpleTossProps) {
  const frame = useCurrentFrame();
  const pose = crumpleTossPose({ frame, ...timing });
  if (pose.phase === "gone") return null;

  const pieces = crumpleSegments({
    width,
    height,
    segments,
    layers,
    randomness,
    crushTo: timing.crushTo,
    seed: timing.seed,
  });
  const c = pose.crush;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        transformOrigin: "center",
        opacity: pose.opacity,
        transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotate}deg) scale(${pose.scale})`,
      }}
    >
      {pieces.map((piece, i) => (
        <div
          key={`piece:${i}`}
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `polygon(${piece.clip.map(([x, y]) => `${x}% ${y}%`).join(", ")})`,
            transformOrigin: `${piece.origin[0]}% ${piece.origin[1]}%`,
            transform: `translate(${piece.dx * c}px, ${piece.dy * c}px) rotate(${piece.rotate * c}deg) scale(${1 + (piece.scale - 1) * c})`,
            filter:
              c > 0
                ? `drop-shadow(0 0 ${0.6 * c}px rgba(38,36,44,0.55))`
                : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>{children}</div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: creaseShading(piece, c),
              opacity: c,
            }}
          />
        </div>
      ))}
    </div>
  );
}
