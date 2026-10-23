"use client";

import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type OrbitLockProps = {
  /** Lockup revealed after the moons collide with the core. Falls back to a placeholder "remocn" lockup. */
  children?: React.ReactNode;
  /** Number of moons orbiting the core. */
  moons?: number;
  backgroundColor?: string;
  coreColor?: string;
  moonColor?: string;
  /** Ring flash released on impact. */
  flashColor?: string;
  /** Orbit tilt in degrees: 0 is a flat circle, 80 is nearly edge-on. */
  tilt?: number;
  speed?: number;
};

export const orbitLockDefaults = {
  moons: 3,
  backgroundColor: "#111111",
  coreColor: "#E5322D",
  moonColor: "#FFFFFF",
  flashColor: "#FFFFFF",
  tilt: 64,
  speed: 1,
};

const IMPACT = 30;
const TURNS = 1.9;
const TRAIL = 10;
const TRAIL_STEP = 0.4;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type Moon = { x: number; y: number; z: number };

function moonAt(
  t: number,
  index: number,
  count: number,
  outer: number,
  inner: number,
  tilt: number,
): Moon {
  const p = Math.min(1, Math.max(0, t / IMPACT));
  // Orbit radius collapses late; angular speed ramps up as it tightens.
  const r = inner + (outer - inner) * (1 - Easing.in(Easing.cubic)(p));
  const theta =
    (index / count) * Math.PI * 2 +
    Math.PI * 2 * TURNS * Easing.in(Easing.quad)(p);
  const plane = (index / count) * Math.PI + Math.PI / 9;
  const lx = r * Math.cos(theta);
  const ly = r * Math.sin(theta) * Math.cos(tilt);
  return {
    x: lx * Math.cos(plane) - ly * Math.sin(plane),
    y: lx * Math.sin(plane) + ly * Math.cos(plane),
    z: r * Math.sin(theta) * Math.sin(tilt),
  };
}

const PLACEHOLDER_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";

// Neutral lockup shown when no children are passed.
function PlaceholderLockup({
  mark,
  dot,
  text,
  scale = 1,
}: {
  mark: string;
  dot: string;
  text: string;
  scale?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 * scale }}>
      <div
        style={{
          width: 120 * scale,
          height: 120 * scale,
          borderRadius: 32 * scale,
          backgroundColor: mark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36 * scale,
            height: 36 * scale,
            borderRadius: "50%",
            backgroundColor: dot,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: PLACEHOLDER_FONT,
          fontSize: 104 * scale,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: text,
        }}
      >
        remocn
      </span>
    </div>
  );
}

export function OrbitLock(props: OrbitLockProps) {
  const {
    children,
    moons,
    backgroundColor,
    coreColor,
    moonColor,
    flashColor,
    tilt,
    speed,
  } = { ...orbitLockDefaults, ...props };
  const uid = `orbit-lock-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame * Math.max(0, speed);
  const s = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const count = Math.max(1, Math.round(moons));
  const tiltRad = (Math.min(85, Math.max(0, tilt)) * Math.PI) / 180;

  const core = s * 0.055;
  const outer = s * 0.36;
  const moonR = s * 0.02;
  const p = Math.min(1, t / IMPACT);

  const corePulse = 1 + 0.3 * p ** 4;
  const burst = interpolate(t, [IMPACT, IMPACT + 2, IMPACT + 6], [1, 1.6, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const coreScale = t < IMPACT ? corePulse : corePulse * burst;
  const coreFill = interpolateColors(
    t,
    [IMPACT - 2, IMPACT + 1],
    [coreColor, flashColor],
  );

  const ring = interpolate(t, [IMPACT, IMPACT + 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const ringVisible = t >= IMPACT && ring < 1;
  const orbitOpacity = interpolate(
    t,
    [0, 6, IMPACT - 4, IMPACT],
    [0, 0.16, 0.1, 0],
    clamp,
  );
  const orbitR = core + (outer - core) * (1 - Easing.in(Easing.cubic)(p));

  const pop = spring({
    frame: t - IMPACT - 3,
    fps,
    config: { damping: 11, stiffness: 170, mass: 0.7 },
  });

  const bodies = Array.from({ length: count }, (_, i) => {
    const head = moonAt(t, i, count, outer, core, tiltRad);
    const trail = Array.from({ length: TRAIL }, (_, k) =>
      moonAt(t - (k + 1) * TRAIL_STEP, i, count, outer, core, tiltRad),
    );
    return { i, head, trail };
  });
  const showMoons = t < IMPACT && t >= 0;
  const appear = interpolate(t, [0, 5], [0, 1], clamp);

  const renderMoon = ({ i, head, trail }: (typeof bodies)[number]) => {
    const depth = 1 + (0.18 * head.z) / outer;
    const points = [head, ...trail];
    // Tapered ribbon through the recent positions, fading toward the tail.
    const left: string[] = [];
    const right: string[] = [];
    points.forEach((pt, k) => {
      const prev = points[Math.max(0, k - 1)];
      const next = points[Math.min(points.length - 1, k + 1)];
      const dx = prev.x - next.x;
      const dy = prev.y - next.y;
      const len = Math.hypot(dx, dy) || 1;
      const half = moonR * depth * 0.9 * (1 - k / points.length);
      const nx = (-dy / len) * half;
      const ny = (dx / len) * half;
      left.push(`${cx + pt.x + nx},${cy + pt.y + ny}`);
      right.unshift(`${cx + pt.x - nx},${cy + pt.y - ny}`);
    });
    const tail = points[points.length - 1];
    const gradId = `${uid}-trail-${i}`;
    return (
      <g key={i} opacity={appear}>
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={cx + head.x}
            y1={cy + head.y}
            x2={cx + tail.x}
            y2={cy + tail.y}
          >
            <stop offset="0" stopColor={moonColor} stopOpacity={0.6} />
            <stop offset="1" stopColor={moonColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon
          points={[...left, ...right].join(" ")}
          fill={`url(#${gradId})`}
        />
        <circle
          cx={cx + head.x}
          cy={cy + head.y}
          r={moonR * depth}
          fill={moonColor}
        />
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {Array.from({ length: count }, (_, i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={orbitR}
            ry={orbitR * Math.cos(tiltRad)}
            transform={`rotate(${(i / count) * 180 + 20} ${cx} ${cy})`}
            fill="none"
            stroke={moonColor}
            strokeOpacity={orbitOpacity}
            strokeWidth={1.5}
          />
        ))}
        {showMoons && bodies.filter((b) => b.head.z < 0).map(renderMoon)}
        {coreScale > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={core * coreScale * appear}
            fill={coreFill}
          />
        )}
        {showMoons && bodies.filter((b) => b.head.z >= 0).map(renderMoon)}
        {ringVisible && (
          <circle
            cx={cx}
            cy={cy}
            r={core + ring * s * 0.62}
            fill="none"
            stroke={flashColor}
            strokeWidth={Math.max(1, s * 0.03 * (1 - ring))}
            opacity={1 - ring}
          />
        )}
      </svg>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: interpolate(t, [IMPACT + 3, IMPACT + 6], [0, 1], clamp),
          transform: `scale(${0.55 + 0.45 * pop})`,
        }}
      >
        {children ?? (
          <PlaceholderLockup
            mark={coreColor}
            dot={backgroundColor}
            text={moonColor}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
