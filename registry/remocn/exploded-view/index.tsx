"use client";

import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ExplodedViewColors = {
  background: string;
  top: string;
  left: string;
  right: string;
  highlightTop: string;
  highlightLeft: string;
  highlightRight: string;
  line: string;
  label: string;
};

export type ExplodedViewProps = {
  /** Number of slabs, 2 to 6. */
  layers?: number;
  /** One label per slab, top slab first. */
  labels?: string[];
  /** Index of the red slab, counted from the top. */
  highlight?: number;
  colors?: Partial<ExplodedViewColors>;
  /** Background color. Overrides `colors.background`. */
  backgroundColor?: string;
  /** Label text color. Overrides `colors.label`. */
  labelColor?: string;
  speed?: number;
};

export const explodedViewDefaults = {
  layers: 4,
  labels: ["Interface", "Engine", "Storage", "Hardware"],
  highlight: 1,
  colors: {
    background: "#111111",
    top: "#F4F4F4",
    left: "#A6A6A6",
    right: "#747474",
    highlightTop: "#E5322D",
    highlightLeft: "#B5231F",
    highlightRight: "#8A1A17",
    line: "#FFFFFF",
    label: "#FFFFFF",
  } satisfies ExplodedViewColors,
  speed: 1,
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const OPEN = 3;
const CLOSE = 38;
const COS30 = Math.cos(Math.PI / 6);
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function ExplodedView({
  layers = explodedViewDefaults.layers,
  labels = explodedViewDefaults.labels,
  highlight = explodedViewDefaults.highlight,
  colors: colorOverrides,
  backgroundColor,
  labelColor,
  speed = explodedViewDefaults.speed,
}: ExplodedViewProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const baseColors = { ...explodedViewDefaults.colors, ...colorOverrides };
  const colors = {
    ...baseColors,
    background: backgroundColor ?? baseColors.background,
    label: labelColor ?? baseColors.label,
  };
  const n = Math.round(Math.min(6, Math.max(2, layers)));
  const t = (frame * speed * 30) / fps;

  const side = height * 0.36;
  const thick = height * 0.036;
  const gap = (height * 0.27) / (n - 1);
  const cx = width * 0.4;
  const cy = height * 0.5;

  const iso = (X: number, Y: number, Z: number) =>
    [(X - Y) * COS30, (X + Y) * 0.5 - Z] as const;
  const pts = (list: (readonly [number, number])[]) =>
    list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const close = spring({
    frame: t - CLOSE,
    fps: 30,
    config: { damping: 26, stiffness: 320, mass: 0.8 },
  });
  // Top slab leaves first; bottom one barely waits.
  const spread = Array.from({ length: n }, (_, i) => {
    const fromTop = n - 1 - i;
    const open = spring({
      frame: t - OPEN - fromTop * 1.5,
      fps: 30,
      config: { damping: 12, stiffness: 110 },
    });
    return Math.max(0, open * (1 - close));
  });
  const offsets: number[] = [];
  let z = 0;
  for (let i = 0; i < n; i++) {
    offsets.push(z);
    z += thick + (i < n - 1 ? gap * Math.max(spread[i + 1], 0) : 0);
  }
  const total = z;
  // The click: a short downward knock once the slabs meet again.
  const knock =
    interpolate(t, [CLOSE + 5, CLOSE + 7, CLOSE + 12], [0, 1, 0], {
      ...clamp,
      easing: Easing.out(Easing.quad),
    }) *
    height *
    0.008;
  const baseY = cy + side * 0.02 + total / 2 + knock;
  const labelOut = interpolate(t, [CLOSE - 5, CLOSE], [1, 0], clamp);
  const labelX = width * 0.66;
  const fontSize = height * 0.042;

  const slabs: React.ReactNode[] = [];
  const leaders: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const fromTop = n - 1 - i;
    const hot = fromTop === highlight;
    const z0 = offsets[i];
    const z1 = z0 + thick;
    const h = side / 2;
    const top = [
      iso(-h, -h, z1),
      iso(h, -h, z1),
      iso(h, h, z1),
      iso(-h, h, z1),
    ];
    const left = [iso(-h, h, z1), iso(h, h, z1), iso(h, h, z0), iso(-h, h, z0)];
    const right = [
      iso(h, -h, z1),
      iso(h, h, z1),
      iso(h, h, z0),
      iso(h, -h, z0),
    ];
    const inset = h * 0.78;
    const inner = [
      iso(-inset, -inset, z1),
      iso(inset, -inset, z1),
      iso(inset, inset, z1),
      iso(-inset, inset, z1),
    ];
    const ink = hot ? "#FFFFFF" : "#111111";
    slabs.push(
      <g key={i}>
        <polygon
          points={pts(left)}
          fill={hot ? colors.highlightLeft : colors.left}
        />
        <polygon
          points={pts(right)}
          fill={hot ? colors.highlightRight : colors.right}
        />
        <polygon
          points={pts(top)}
          fill={hot ? colors.highlightTop : colors.top}
        />
        <polygon
          points={pts(inner)}
          fill="none"
          stroke={ink}
          strokeOpacity={0.18}
          strokeWidth={height * 0.002}
        />
        {[-0.4, 0, 0.4].map((k) => {
          const a = iso(-inset * 0.7, k * inset, z1);
          const b = iso(inset * (fromTop % 2 ? 0.2 : 0.7), k * inset, z1);
          return (
            <line
              key={k}
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              stroke={ink}
              strokeOpacity={0.22}
              strokeWidth={height * 0.006}
              strokeLinecap="round"
            />
          );
        })}
      </g>,
    );

    const label = labels[fromTop];
    if (!label) continue;
    const anchor = iso(h, -h, (z0 + z1) / 2);
    const draw = interpolate(
      t,
      [14 + fromTop * 2.5, 24 + fromTop * 2.5],
      [0, 1],
      {
        ...clamp,
        easing: Easing.inOut(Easing.cubic),
      },
    );
    const show =
      interpolate(t, [19 + fromTop * 2.5, 27 + fromTop * 2.5], [0, 1], {
        ...clamp,
        easing: Easing.out(Easing.cubic),
      }) * labelOut;
    const ax = cx + anchor[0] + height * 0.012;
    const ay = baseY + anchor[1];
    const length = (labelX - ax) * draw * labelOut;
    leaders.push(
      <g key={`l${i}`}>
        <circle
          cx={ax}
          cy={ay}
          r={height * 0.006}
          fill={colors.line}
          opacity={Math.min(1, draw * 3) * labelOut}
        />
        <line
          x1={ax}
          y1={ay}
          x2={ax + length}
          y2={ay}
          stroke={colors.line}
          strokeOpacity={0.6}
          strokeWidth={Math.max(1, height * 0.0022)}
        />
        <g
          opacity={show}
          transform={`translate(${labelX + height * 0.02 + (1 - show) * height * 0.03} ${ay})`}
        >
          <text
            y={-fontSize * 0.62}
            fill={hot ? colors.highlightTop : colors.label}
            fillOpacity={hot ? 1 : 0.5}
            fontFamily={FONT}
            fontSize={fontSize * 0.5}
            fontWeight={600}
            letterSpacing="0.12em"
          >
            {`0${fromTop + 1}`}
          </text>
          <text
            y={fontSize * 0.42}
            fill={colors.label}
            fontFamily={FONT}
            fontSize={fontSize}
            fontWeight={700}
            letterSpacing="-0.02em"
          >
            {label}
          </text>
        </g>
      </g>,
    );
  }

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
        <ellipse
          cx={cx}
          cy={baseY + side * 0.5 + height * 0.035}
          rx={side * COS30 * 1.05}
          ry={side * 0.16}
          fill="#000000"
          opacity={0.5}
        />
        <g transform={`translate(${cx} ${baseY})`}>{slabs}</g>
        {leaders}
      </svg>
    </AbsoluteFill>
  );
}
