"use client";

import { type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type RisoPrintProps = {
  /** Subject printed in both inks. Dark tones go to the key plate, warm tones to the accent plate. */
  children?: ReactNode;
  /** [key ink, accent ink]. */
  inks?: [string, string];
  /** Key ink. Overrides `inks[0]` when set. */
  keyInk?: string;
  /** Accent ink. Overrides `inks[1]` when set. */
  accentInk?: string;
  paper?: string;
  /** Final misregistration of the accent plate, in px at 720p. */
  offset?: [number, number];
  /** Ink speckle and paper tooth, 0 to 1. */
  grain?: number;
  /** Stop-motion wobble of the accent plate after it settles, in px at 720p. 0 disables. */
  jitter?: number;
  /** Print registration marks in the corners. */
  marks?: boolean;
  speed?: number;
};

export const risoPrintDefaults = {
  inks: ["#111111", "#E5322D"] as [string, string],
  paper: "#F2F0EA",
  offset: [7, -5] as [number, number],
  grain: 0.5,
  jitter: 1.2,
  marks: true,
  speed: 1,
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// Coverage = A - channel: the key plate takes everything without red (blacks,
// blues), the accent plate everything without green (reds, blacks). Black
// therefore prints in both plates, like a rich black on a real riso.
const plateMatrix = (channel: 0 | 1) => {
  const k = 1.4;
  const r = channel === 0 ? -k : 0;
  const g = channel === 1 ? -k : 0;
  return `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${r} ${g} 0 ${k} -0.2`;
};

function PosterPlate({
  plate,
  width,
  height,
}: {
  plate: 0 | 1;
  width: number;
  height: number;
}) {
  const s = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0 }}
      role="img"
      aria-label="Geometric poster"
    >
      {plate === 0 ? (
        <g fill="#000">
          <rect
            x={cx - 0.42 * s}
            y={cy - 0.1 * s}
            width={0.36 * s}
            height={0.36 * s}
          />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={cx + 0.2 * s}
              y={cy + 0.2 * s + i * 0.045 * s}
              width={(0.3 - i * 0.07) * s}
              height={0.018 * s}
            />
          ))}
        </g>
      ) : (
        <g fill="#000">
          <circle cx={cx + 0.08 * s} cy={cy - 0.04 * s} r={0.26 * s} />
          <rect
            x={cx - 0.46 * s}
            y={cy - 0.34 * s}
            width={0.07 * s}
            height={0.07 * s}
          />
        </g>
      )}
    </svg>
  );
}

function Marks({ width, height }: { width: number; height: number }) {
  const s = Math.min(width, height);
  const m = 0.06 * s;
  const r = 0.018 * s;
  const points = [
    [m, m],
    [width - m, m],
    [m, height - m],
    [width - m, height - m],
  ];
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0 }}
      role="img"
      aria-label="Registration marks"
    >
      {points.map(([x, y]) => (
        <g key={`${x}-${y}`} stroke="#000" strokeWidth={0.0035 * s} fill="none">
          <circle cx={x} cy={y} r={r} />
          <line x1={x - r * 1.7} y1={y} x2={x + r * 1.7} y2={y} />
          <line x1={x} y1={y - r * 1.7} x2={x} y2={y + r * 1.7} />
        </g>
      ))}
    </svg>
  );
}

export function RisoPrint({
  children,
  inks: inksProp = risoPrintDefaults.inks,
  keyInk,
  accentInk,
  paper = risoPrintDefaults.paper,
  offset = risoPrintDefaults.offset,
  grain = risoPrintDefaults.grain,
  jitter = risoPrintDefaults.jitter,
  marks = risoPrintDefaults.marks,
  speed = risoPrintDefaults.speed,
}: RisoPrintProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inks: [string, string] = [
    keyInk ?? inksProp[0],
    accentInk ?? inksProp[1],
  ];
  const unit = Math.min(width, height) / 720;
  const t = (frame / fps) * 30 * speed;
  const g = Math.max(0, Math.min(1, grain));

  // Key plate: the ink hits the paper.
  const press = interpolate(t, [0, 8], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // Accent plate: slides in off-register, wobbles, settles a hair off.
  const slide = spring({
    frame: t - 4,
    fps: 30,
    config: { damping: 9, stiffness: 120, mass: 0.8 },
  });
  const step = Math.floor(t / 4);
  const jitterIn = interpolate(t, [26, 34], [0, 1], clamp);
  const jx = (random(`riso-jx-${step}`) - 0.5) * 2 * jitter * unit * jitterIn;
  const jy = (random(`riso-jy-${step}`) - 0.5) * 2 * jitter * unit * jitterIn;
  const ax = interpolate(slide, [0, 1], [-0.22 * width, offset[0] * unit]) + jx;
  const ay = interpolate(slide, [0, 1], [0.08 * height, offset[1] * unit]) + jy;
  const arot = interpolate(slide, [0, 1], [-4, 0.35]);
  const aopacity = interpolate(t, [4, 8], [0, 1], clamp);

  const speckle = `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-5 * g} 0 0 0 ${1 + 5 * g * 0.56}`;
  const plates = [
    {
      ink: inks[0],
      transform: `scale(${interpolate(press, [0, 1], [1.035, 1])})`,
      opacity: press * 0.94,
    },
    {
      ink: inks[1],
      transform: `translate(${ax}px, ${ay}px) rotate(${arot}deg)`,
      opacity: aopacity * 0.9,
    },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: paper, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          {plates.map((plate, i) => (
            <filter
              key={plate.ink + i}
              id={`${id}-plate-${i}`}
              x="0"
              y="0"
              width="1"
              height="1"
              colorInterpolationFilters="sRGB"
            >
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values={plateMatrix(i as 0 | 1)}
                result="coverage"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency={0.9 / unit}
                numOctaves={2}
                seed={7 + i * 13}
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="matrix"
                values={speckle}
                result="mask"
              />
              <feComposite
                in="coverage"
                in2="mask"
                operator="in"
                result="inked"
              />
              <feFlood floodColor={plate.ink} result="ink" />
              <feComposite in="ink" in2="inked" operator="in" />
            </filter>
          ))}
          <filter
            id={`${id}-paper`}
            x="0"
            y="0"
            width="1"
            height="1"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.65 / unit}
              numOctaves={3}
              seed={3}
            />
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.12  ${0.5 * g} 0 0 0 ${-0.18 * g}`}
            />
          </filter>
        </defs>
      </svg>
      {plates.map((plate, i) => (
        <AbsoluteFill
          key={plate.ink + i}
          style={{
            filter: `url(#${id}-plate-${i})`,
            mixBlendMode: "multiply",
            opacity: plate.opacity,
            transform: plate.transform,
          }}
        >
          {children ? (
            <AbsoluteFill
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              {children}
            </AbsoluteFill>
          ) : (
            <PosterPlate plate={i as 0 | 1} width={width} height={height} />
          )}
          {marks ? <Marks width={width} height={height} /> : null}
        </AbsoluteFill>
      ))}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}
        aria-hidden
      >
        <rect
          width={width}
          height={height}
          fill="#fff"
          filter={`url(#${id}-paper)`}
        />
      </svg>
    </AbsoluteFill>
  );
}
