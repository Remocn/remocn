"use client";

import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type PuzzleSnapProps = {
  /** Wordmark revealed beside the assembled mark. */
  children?: React.ReactNode;
  backgroundColor?: string;
  /** Fill of the quarter circle and the small square. */
  primaryColor?: string;
  /** Fill of the dot and the wedge. */
  secondaryColor?: string;
  /** Spark burst color. */
  sparkColor?: string;
  /** Include the small square piece. */
  square?: boolean;
  /** Seed for the scattered start positions. */
  seed?: number;
  speed?: number;
};

export const puzzleSnapDefaults = {
  backgroundColor: "#111111",
  primaryColor: "#E5322D",
  secondaryColor: "#FFFFFF",
  sparkColor: "#FFFFFF",
  square: true,
  seed: 3,
  speed: 1,
};

const STAGGER = 3;
const DRIFT = 10;
const SNAP = 3;
const SPARK = 8;
const SLIDE = 11;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type Piece = {
  key: string;
  /** Pivot / contact point in mark units (0..2). */
  px: number;
  py: number;
  render: (c: number) => React.ReactNode;
};

export function PuzzleSnap(props: PuzzleSnapProps) {
  const {
    children,
    backgroundColor,
    primaryColor,
    secondaryColor,
    sparkColor,
    square,
    seed,
    speed,
  } = { ...puzzleSnapDefaults, ...props };
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame * Math.max(0, speed);
  const s = Math.min(width, height);
  const size = Math.round(s * 0.2);
  const c = size / 2;
  const gap = c * 0.08;

  const pieces: Piece[] = [
    {
      key: "quarter",
      px: 0.6,
      py: 0.6,
      render: (u) => (
        <path
          d={`M ${u - gap} ${u - gap} L 0 ${u - gap} A ${u - gap} ${u - gap} 0 0 1 ${u - gap} 0 Z`}
          fill={primaryColor}
        />
      ),
    },
    {
      key: "dot",
      px: 1.5,
      py: 0.5,
      render: (u) => (
        <circle cx={u * 1.5} cy={u * 0.5} r={u * 0.36} fill={secondaryColor} />
      ),
    },
    {
      key: "wedge",
      px: 0.65,
      py: 1.35,
      render: (u) => (
        <path
          d={`M ${u - gap} ${u + gap} L ${u - gap} ${2 * u} L 0 ${2 * u} Z`}
          fill={secondaryColor}
        />
      ),
    },
    ...(square
      ? [
          {
            key: "square",
            px: 1.5,
            py: 1.5,
            render: (u: number) => (
              <rect
                x={u * 1.18}
                y={u * 1.18}
                width={u * 0.64}
                height={u * 0.64}
                rx={u * 0.08}
                fill={primaryColor}
              />
            ),
          },
        ]
      : []),
  ];
  const lastContact = (pieces.length - 1) * STAGGER + DRIFT + SNAP;

  const punch = spring({
    frame: t - lastContact,
    fps,
    config: { damping: 9, stiffness: 260, mass: 0.5 },
  });
  const markScale = t < lastContact ? 1 : 1 + 0.08 * (1 - punch);
  const slide = interpolate(
    t,
    [lastContact + 2, lastContact + 2 + SLIDE],
    [0, 1],
    {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const reveal = interpolate(
    t,
    [lastContact + 4, lastContact + 4 + SLIDE],
    [0, 1],
    { ...clamp, easing: Easing.out(Easing.cubic) },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: size * 0.24,
          // Shift the row so the mark sits dead center until it slides over.
          transform: `translateX(calc((50% - ${size / 2}px) * ${children ? 1 - slide : 0}))`,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            flexShrink: 0,
            overflow: "visible",
            transform: `scale(${markScale})`,
          }}
        >
          {pieces.map((piece, i) => {
            const local = t - i * STAGGER;
            const angle = random(`puzzle-snap-${seed}-${i}-a`) * Math.PI * 2;
            const dist =
              s * (0.42 + 0.22 * random(`puzzle-snap-${seed}-${i}-d`));
            const spin =
              (random(`puzzle-snap-${seed}-${i}-r`) > 0.5 ? 1 : -1) *
              (120 + 160 * random(`puzzle-snap-${seed}-${i}-s`));
            // Drift most of the way in, then get yanked onto the slot.
            const remain =
              local < DRIFT
                ? interpolate(local, [0, DRIFT], [1, 0.2], {
                    ...clamp,
                    easing: Easing.out(Easing.cubic),
                  })
                : interpolate(local, [DRIFT, DRIFT + SNAP], [0.2, 0], {
                    ...clamp,
                    easing: Easing.in(Easing.quad),
                  });
            const ox = Math.cos(angle) * dist * remain;
            const oy = Math.sin(angle) * dist * remain;
            const pivotX = piece.px * c;
            const pivotY = piece.py * c;
            const opacity = interpolate(local, [0, 3], [0, 1], clamp);
            const sparkT = (local - DRIFT - SNAP) / SPARK;
            return (
              <g key={piece.key}>
                <g
                  opacity={opacity}
                  transform={`translate(${ox} ${oy}) rotate(${spin * remain} ${pivotX} ${pivotY})`}
                >
                  {piece.render(c)}
                </g>
                {sparkT >= 0 &&
                  sparkT < 1 &&
                  Array.from({ length: 6 }, (_, k) => {
                    const a =
                      (k / 6) * Math.PI * 2 +
                      random(`puzzle-snap-${seed}-${i}-spark`) * Math.PI;
                    const e = Easing.out(Easing.cubic)(sparkT);
                    const r0 = c * (0.45 + 0.4 * e);
                    const r1 = r0 + c * 0.28 * (1 - 0.5 * e);
                    return (
                      <line
                        key={k}
                        x1={pivotX + Math.cos(a) * r0}
                        y1={pivotY + Math.sin(a) * r0}
                        x2={pivotX + Math.cos(a) * r1}
                        y2={pivotY + Math.sin(a) * r1}
                        stroke={sparkColor}
                        strokeWidth={Math.max(1, c * 0.05 * (1 - sparkT))}
                        strokeLinecap="round"
                        opacity={1 - sparkT}
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>
        {children && (
          <div
            style={{
              opacity: reveal,
              clipPath: `inset(-30% ${(1 - reveal) * 100}% -30% -5%)`,
              transform: `translateX(${(1 - reveal) * -size * 0.3}px)`,
            }}
          >
            {children}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
