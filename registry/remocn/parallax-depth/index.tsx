"use client";

import type React from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ParallaxDepthLayer = {
  /** Full-frame content of the layer. Leave room past the edges for the truck. */
  content: React.ReactNode;
  /** Distance from the camera. 1 is nearest; larger values move less. */
  depth: number;
};

export type ParallaxDepthColors = {
  sky: string;
  sun: string;
  far: string;
  mid: string;
  near: string;
};

export type ParallaxDepthProps = {
  /** Custom layers. Falls back to the built-in sun and hills landscape. */
  layers?: ParallaxDepthLayer[];
  /** Sideways camera travel at depth 1, as a fraction of the frame width. */
  distance?: number;
  /** Push-in toward the scene, in depth units. */
  push?: number;
  /** Truck direction: 1 moves the camera right, -1 left. */
  direction?: 1 | -1;
  colors?: Partial<ParallaxDepthColors>;
  /** Sky color. Overrides `colors.sky`. */
  skyColor?: string;
  /** Sun color. Overrides `colors.sun`. */
  sunColor?: string;
  seed?: number;
  speed?: number;
};

export const parallaxDepthDefaults = {
  distance: 0.5,
  push: 0.16,
  direction: 1 as 1 | -1,
  colors: {
    sky: "#111111",
    sun: "#E5322D",
    far: "#2C2C2C",
    mid: "#555555",
    near: "#8E8E8E",
  } satisfies ParallaxDepthColors,
  seed: 3,
  speed: 1,
};

const DURATION = 60;

// A ridge line built from a few seeded sine octaves, spanning three widths so it
// never runs out while the camera trucks.
function hillPath(
  width: number,
  height: number,
  base: number,
  amp: number,
  waves: number,
  seed: string,
) {
  const octaves = [0, 1, 2].map((o) => ({
    f: (waves * (o + 1) * (0.8 + random(`${seed}-f${o}`) * 0.4)) / width,
    a: amp / (o * 1.7 + 1),
    p: random(`${seed}-p${o}`) * Math.PI * 2,
  }));
  const steps = 120;
  const x0 = -width;
  const x1 = width * 2;
  let d = `M ${x0} ${height * 2}`;
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    let y = base;
    for (const o of octaves)
      y -= o.a * (0.5 + 0.5 * Math.sin(x * o.f * 6.283 + o.p));
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L ${x1} ${height * 2} Z`;
}

function useLandscape(colors: ParallaxDepthColors, seed: number) {
  const { width, height } = useVideoConfig();
  return useMemo<ParallaxDepthLayer[]>(() => {
    const svg = (children: React.ReactNode) => (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
        aria-hidden
      >
        {children}
      </svg>
    );
    const hill = (
      base: number,
      amp: number,
      waves: number,
      fill: string,
      key: string,
    ) => (
      <path
        d={hillPath(
          width,
          height,
          height * base,
          height * amp,
          waves,
          `${seed}-${key}`,
        )}
        fill={fill}
      />
    );
    return [
      {
        depth: 9,
        content: svg(
          <circle
            cx={width * 0.6}
            cy={height * 0.4}
            r={height * 0.17}
            fill={colors.sun}
          />,
        ),
      },
      { depth: 6, content: svg(hill(0.6, 0.24, 2.2, colors.far, "far")) },
      { depth: 2.6, content: svg(hill(0.76, 0.16, 1.2, colors.mid, "mid")) },
      { depth: 1.2, content: svg(hill(0.92, 0.14, 0.9, colors.near, "near")) },
    ];
  }, [width, height, colors.sun, colors.far, colors.mid, colors.near, seed]);
}

export function ParallaxDepth({
  layers,
  distance = parallaxDepthDefaults.distance,
  push = parallaxDepthDefaults.push,
  direction = parallaxDepthDefaults.direction,
  colors: colorOverrides,
  skyColor,
  sunColor,
  seed = parallaxDepthDefaults.seed,
  speed = parallaxDepthDefaults.speed,
}: ParallaxDepthProps) {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const baseColors = { ...parallaxDepthDefaults.colors, ...colorOverrides };
  const colors = {
    ...baseColors,
    sky: skyColor ?? baseColors.sky,
    sun: sunColor ?? baseColors.sun,
  };
  const landscape = useLandscape(colors, seed);
  const stack = [...(layers ?? landscape)].sort((a, b) => b.depth - a.depth);

  const t = (frame * speed * 30) / fps;
  const move = interpolate(t, [0, DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const camX = (move - 0.5) * distance * width * direction;
  const camZ = move * push;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.sky, overflow: "hidden" }}>
      {stack.map((layer, i) => {
        const depth = Math.max(0.2, layer.depth);
        // Pinhole camera: scale and offset both fall off with 1 / depth.
        const scale = depth / Math.max(0.05, depth - camZ);
        const x = (-camX * scale) / depth;
        return (
          <AbsoluteFill
            key={i}
            style={{
              transform: `translateX(${x}px) scale(${scale})`,
              transformOrigin: "50% 55%",
            }}
          >
            {layer.content}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}
