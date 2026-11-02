"use client";

import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type DollyZoomColors = {
  background: string;
  wall: string;
  wallAlt: string;
  floor: string;
  floorAlt: string;
  line: string;
  light: string;
  door: string;
  figure: string;
};

export type DollyZoomProps = {
  /** Subject held at a constant size. Defaults to a standing figure. */
  children?: React.ReactNode;
  /** How far the camera dollies in while zooming out, 0 to 2. */
  intensity?: number;
  /** Play the move in reverse: background compresses toward the subject. */
  reverse?: boolean;
  colors?: Partial<DollyZoomColors>;
  /** Door color at the end of the corridor. Overrides `colors.door`. */
  doorColor?: string;
  /** Default figure color. Overrides `colors.figure`. */
  figureColor?: string;
  /** Corridor edge line color. Overrides `colors.line`. */
  lineColor?: string;
  speed?: number;
};

export const dollyZoomDefaults = {
  intensity: 1,
  reverse: false,
  colors: {
    background: "#0B0B0B",
    wall: "#1B1B1B",
    wallAlt: "#151515",
    floor: "#262626",
    floorAlt: "#1D1D1D",
    line: "#FFFFFF",
    light: "#FFFFFF",
    door: "#E5322D",
    figure: "#FFFFFF",
  } satisfies DollyZoomColors,
  speed: 1,
};

const START = 4;
const END = 36;
// Corridor in world units. Screen y points down, so the floor is positive.
const HALF_W = 2;
const CEIL = -1.3;
const FLOOR = 1.7;
const SUBJECT_Z = 6;
const DOOR_Z = 14;
const NEAR = 0.25;

type Vec = [number, number, number];

export function DollyZoom({
  children,
  intensity = dollyZoomDefaults.intensity,
  reverse = dollyZoomDefaults.reverse,
  colors: colorOverrides,
  doorColor,
  figureColor,
  lineColor,
  speed = dollyZoomDefaults.speed,
}: DollyZoomProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const baseColors = { ...dollyZoomDefaults.colors, ...colorOverrides };
  const colors = {
    ...baseColors,
    door: doorColor ?? baseColors.door,
    figure: figureColor ?? baseColors.figure,
    line: lineColor ?? baseColors.line,
  };
  const t = (frame * speed * 30) / fps;
  const move = interpolate(t, [START, END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.3, 1),
  });
  const amount = reverse ? 1 - move : move;

  // Focal length tracks the subject distance so the subject never changes size.
  const k = height * 0.19;
  const d0 = SUBJECT_Z;
  const d1 = d0 / (1 + 1.7 * Math.max(0, intensity));
  const dist = d0 + (d1 - d0) * amount;
  const cam = SUBJECT_Z - dist;
  const f = k * dist;
  const cx = width / 2;
  const cy = height / 2;

  const project = ([x, y, z]: Vec) => {
    const depth = Math.max(NEAR, z - cam);
    return [cx + (f * x) / depth, cy + (f * y) / depth] as const;
  };
  const poly = (pts: Vec[]) =>
    pts
      .map(project)
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");

  const fog = (z: number) =>
    interpolate(z - cam, [1, DOOR_Z - cam], [1, 0.25], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const segments: React.ReactNode[] = [];
  // The corridor runs on behind the camera so its mouth never shows.
  const firstZ = Math.floor(cam);
  for (let z = DOOR_Z - 1; z >= firstZ; z--) {
    const z0 = Math.max(z, cam + NEAR);
    const z1 = z + 1;
    if (z1 <= z0) continue;
    const alt = z % 2 === 0;
    const L = -HALF_W;
    const R = HALF_W;
    segments.push(
      <g key={z}>
        <polygon
          points={poly([
            [L, FLOOR, z0],
            [R, FLOOR, z0],
            [R, FLOOR, z1],
            [L, FLOOR, z1],
          ])}
          fill={alt ? colors.floor : colors.floorAlt}
        />
        <polygon
          points={poly([
            [L, CEIL, z0],
            [R, CEIL, z0],
            [R, CEIL, z1],
            [L, CEIL, z1],
          ])}
          fill={colors.wallAlt}
        />
        <polygon
          points={poly([
            [L, CEIL, z0],
            [L, FLOOR, z0],
            [L, FLOOR, z1],
            [L, CEIL, z1],
          ])}
          fill={alt ? colors.wall : colors.wallAlt}
        />
        <polygon
          points={poly([
            [R, CEIL, z0],
            [R, FLOOR, z0],
            [R, FLOOR, z1],
            [R, CEIL, z1],
          ])}
          fill={alt ? colors.wall : colors.wallAlt}
        />
        <polygon
          points={poly([
            [-0.35, CEIL, z + 0.3],
            [0.35, CEIL, z + 0.3],
            [0.35, CEIL, z + 0.7],
            [-0.35, CEIL, z + 0.7],
          ])}
          fill={colors.light}
          opacity={0.75 * fog(z)}
        />
        {z >= cam + NEAR ? (
          <polygon
            points={poly([
              [L, CEIL, z],
              [R, CEIL, z],
              [R, FLOOR, z],
              [L, FLOOR, z],
            ])}
            fill="none"
            stroke={colors.line}
            strokeOpacity={0.32 * fog(z)}
            strokeWidth={Math.max(1, (f / (z - cam)) * 0.012)}
          />
        ) : null}
      </g>,
    );
  }

  const edges: Vec[][] = [
    [
      [-HALF_W, CEIL, -4],
      [-HALF_W, CEIL, DOOR_Z],
    ],
    [
      [HALF_W, CEIL, -4],
      [HALF_W, CEIL, DOOR_Z],
    ],
    [
      [-HALF_W, FLOOR, -4],
      [-HALF_W, FLOOR, DOOR_Z],
    ],
    [
      [HALF_W, FLOOR, -4],
      [HALF_W, FLOOR, DOOR_Z],
    ],
  ];

  const doorW = 0.85;
  const doorTop = FLOOR - 2.3;
  const [, floorY] = project([0, FLOOR, SUBJECT_Z]);
  const figureH = k * 1.75;

  return (
    <AbsoluteFill
      style={{ backgroundColor: colors.background, overflow: "hidden" }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <polygon
          points={poly([
            [-HALF_W, CEIL, DOOR_Z],
            [HALF_W, CEIL, DOOR_Z],
            [HALF_W, FLOOR, DOOR_Z],
            [-HALF_W, FLOOR, DOOR_Z],
          ])}
          fill={colors.wallAlt}
        />
        <polygon
          points={poly([
            [-doorW, doorTop, DOOR_Z],
            [doorW, doorTop, DOOR_Z],
            [doorW, FLOOR, DOOR_Z],
            [-doorW, FLOOR, DOOR_Z],
          ])}
          fill={colors.door}
        />
        {segments}
        {edges.map((edge, i) => {
          const [a, b] = edge.map((p) =>
            project([p[0], p[1], Math.max(p[2], cam + NEAR)]),
          );
          return (
            <line
              key={i}
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              stroke={colors.line}
              strokeOpacity={0.45}
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {children ? (
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          {children}
        </AbsoluteFill>
      ) : (
        <svg
          viewBox="0 0 60 175"
          height={figureH}
          style={{
            position: "absolute",
            left: cx - (figureH * 60) / 175 / 2,
            top: floorY - figureH,
          }}
          aria-hidden
        >
          <g fill={colors.figure}>
            <circle cx={30} cy={14} r={12} />
            <path d="M12 34 Q30 26 48 34 L54 96 Q54 102 48 102 L44 102 L42 172 L33 172 L30 108 L27 172 L18 172 L16 102 L12 102 Q6 102 6 96 Z" />
          </g>
        </svg>
      )}
    </AbsoluteFill>
  );
}
