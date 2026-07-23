"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";

// ===========================================================================
// icon-scatter — a scene change made of icons.
//
// The outgoing scene shatters into a deterministic field of line-icons that
// draw themselves on, spin, and scatter outward; at mid-transition the field
// is densest and covers the swap; then the icons fly off and draw away as the
// incoming scene resolves through them. Motion-forward and self-contained —
// the paths are inlined, the draw-on is CSS `pathLength` only, so the
// transition ships as one file with no icon dependencies.
//
// Pace it with `linearTiming`/`springTiming` like any presentation. Reads
// best over ~16–26 frames.
// ===========================================================================

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// Single-path Lucide-style glyphs (viewBox 0 0 24 24) — each draws cleanly
// from one continuous stroke via a normalized dashoffset.
const ICON_PATHS: string[] = [
  // star
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
  // heart
  "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
  // zap
  "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
  // sparkles
  "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
  // moon
  "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
  // play
  "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
  // crown
  "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",
  // circle
  "M12 2 A10 10 0 0 1 22 12 A10 10 0 0 1 12 22 A10 10 0 0 1 2 12 A10 10 0 0 1 12 2",
  // square (rounded)
  "M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z",
  // triangle
  "M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z",
  // plus
  "M12 5v14 M5 12h14",
];

export type IconScatterProps = {
  /** How many icons populate the field. Default 15. */
  count?: number;
  /** Icon stroke color. Default near-white ink. */
  color?: string;
  /** The fill that hides the swap at the field's peak. Default warm obsidian. */
  coverColor?: string;
  /** Peak opacity of the cover fill (0–1). Lower = more of the swap shows. */
  coverOpacity?: number;
  /** Stroke width of the icons, in their 24px viewBox units. Default 2. */
  strokeWidth?: number;
  /** How far icons fly on scatter, in px. Default 260. */
  flyDistance?: number;
  /** Seed so two scatters in one video can differ. Default "icon-scatter". */
  seed?: string;
};

type Placed = {
  path: string;
  xPct: number;
  yPct: number;
  size: number;
  spin: number; // degrees swept over the whole transition
  dir: number; // outward scatter angle offset
  strokeOpacity: number;
  pStart: number; // when this icon begins drawing (p-space)
  pOut: number; // when this icon begins flying out (p-space)
};

// Jittered grid so the field reads as scattered but never clumps or overlaps.
function placeIcons(count: number, seed: string): Placed[] {
  const cols = Math.ceil(Math.sqrt((count * 16) / 9));
  const rows = Math.ceil(count / cols);
  const out: Placed[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    const jx = (random(`${seed}-jx-${i}`) - 0.5) * cellW * 0.7;
    const jy = (random(`${seed}-jy-${i}`) - 0.5) * cellH * 0.7;
    out.push({
      path: ICON_PATHS[
        Math.floor(random(`${seed}-p-${i}`) * ICON_PATHS.length)
      ],
      xPct: cellW * (col + 0.5) + jx,
      yPct: cellH * (row + 0.5) + jy,
      size: 34 + random(`${seed}-s-${i}`) * 40,
      spin: (random(`${seed}-r-${i}`) - 0.5) * 320,
      dir: (random(`${seed}-d-${i}`) - 0.5) * 1.2,
      strokeOpacity: 0.5 + random(`${seed}-o-${i}`) * 0.5,
      pStart: random(`${seed}-a-${i}`) * 0.16,
      pOut: 0.52 + random(`${seed}-b-${i}`) * 0.16,
    });
  }
  return out;
}

const IconField: React.FC<{
  p: number;
  placed: Placed[];
  color: string;
  strokeWidth: number;
  flyDistance: number;
}> = ({ p, placed, color, strokeWidth, flyDistance }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {placed.map((icon, i) => {
      // Draw on over ~0.34 of p from the icon's start, then fly out.
      const draw = interpolate(p, [icon.pStart, icon.pStart + 0.34], [0, 1], {
        ...clampOpts,
        easing: Easing.out(Easing.cubic),
      });
      const scaleIn = interpolate(
        p,
        [icon.pStart, icon.pStart + 0.3],
        [0.4, 1],
        {
          ...clampOpts,
          easing: Easing.out(Easing.back(1.6)),
        },
      );
      const outP = interpolate(p, [icon.pOut, 1], [0, 1], {
        ...clampOpts,
        easing: Easing.in(Easing.cubic),
      });

      // Scatter outward from the frame center, along the icon's own radial.
      const cx = icon.xPct - 50;
      const cy = icon.yPct - 50;
      const angle = Math.atan2(cy, cx) + icon.dir;
      const fly = outP * flyDistance;
      const tx = Math.cos(angle) * fly;
      const ty = Math.sin(angle) * fly;

      const spin =
        icon.spin * interpolate(p, [icon.pStart, 1], [0, 1], clampOpts);
      const opacity = Math.min(draw, 1 - outP) * icon.strokeOpacity;
      if (opacity <= 0.001) return null;

      return (
        <svg
          key={i}
          width={icon.size}
          height={icon.size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: `${icon.xPct}%`,
            top: `${icon.yPct}%`,
            opacity,
            overflow: "visible",
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${
              scaleIn * (1 - outP * 0.3)
            }) rotate(${spin}deg)`,
          }}
        >
          <path
            d={icon.path}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        </svg>
      );
    })}
  </AbsoluteFill>
);

const IconScatterPresentation: React.FC<
  TransitionPresentationComponentProps<IconScatterProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    count = 15,
    color = "#fafafa",
    coverColor = "#0a0a0a",
    coverOpacity = 0.92,
    strokeWidth = 2,
    flyDistance = 260,
    seed = "icon-scatter",
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  if (!entering) {
    // The outgoing scene sinks back and blurs as the field rises over it.
    const exitStyle: React.CSSProperties = {
      opacity: interpolate(p, [0.28, 0.5], [1, 0], clampOpts),
      transform: `scale(${interpolate(p, [0, 0.5], [1, 0.94], {
        ...clampOpts,
        easing: Easing.in(Easing.cubic),
      })})`,
      filter: `blur(${interpolate(p, [0.1, 0.45], [0, 10], clampOpts)}px)`,
    };
    return <AbsoluteFill style={exitStyle}>{children}</AbsoluteFill>;
  }

  const placed = placeIcons(count, seed);

  // The incoming scene resolves once the field starts clearing.
  const childStyle: React.CSSProperties = {
    opacity: interpolate(p, [0.5, 0.68], [0, 1], clampOpts),
    transform: `scale(${interpolate(p, [0.5, 1], [1.06, 1], {
      ...clampOpts,
      easing: Easing.out(Easing.cubic),
    })})`,
    filter: `blur(${interpolate(p, [0.5, 0.72], [8, 0], clampOpts)}px)`,
  };

  // The cover fill hides the swap while the field is densest.
  const cover = interpolate(p, [0, 0.3, 0.62, 0.9], [0, 1, 1, 0], clampOpts);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          background: coverColor,
          opacity: cover * coverOpacity,
          pointerEvents: "none",
        }}
      />
      <IconField
        p={p}
        placed={placed}
        color={color}
        strokeWidth={strokeWidth}
        flyDistance={flyDistance}
      />
    </AbsoluteFill>
  );
};

export function iconScatter(
  props: IconScatterProps = {},
): TransitionPresentation<IconScatterProps> {
  return {
    component: IconScatterPresentation,
    props,
  };
}
