"use client";

import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type SynthwaveColors = {
  skyTop: string;
  skyHorizon: string;
  sunTop: string;
  sunBottom: string;
  grid: string;
  floor: string;
  mountainsBack: string;
  mountainsFront: string;
};

export type SynthwaveProps = {
  colors?: Partial<SynthwaveColors>;
  /** Grid line color. Overrides `colors.grid` when set. */
  grid?: string;
  /** Top of the sun gradient. Overrides `colors.sunTop` when set. */
  sunTop?: string;
  /** Bottom of the sun gradient. Overrides `colors.sunBottom` when set. */
  sunBottom?: string;
  /** Sky glow at the horizon. Overrides `colors.skyHorizon` when set. */
  skyHorizon?: string;
  /** Grid rows that pass the viewer per second. */
  gridSpeed?: number;
  /** Horizon height as a fraction of the frame. */
  horizon?: number;
  /** Scroll the sun stripes downward. */
  sunStripes?: boolean;
  speed?: number;
};

export const synthwaveDefaults = {
  colors: {
    skyTop: "#08080B",
    skyHorizon: "#3B0C10",
    sunTop: "#FFC46B",
    sunBottom: "#E5322D",
    grid: "#E5322D",
    floor: "#0A0A0C",
    mountainsBack: "#2A0A0E",
    mountainsFront: "#111111",
  } as SynthwaveColors,
  gridSpeed: 2,
  horizon: 0.6,
  sunStripes: true,
  speed: 1,
};

/** Frames until the sun and mountains are in place; the grid loops forever. */
export const synthwaveLength = 40;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function ridge(
  seed: string,
  width: number,
  base: number,
  peak: number,
  count: number,
) {
  // Spans well past both edges so the slide never exposes an end.
  const points: string[] = [`${-0.4 * width},${base}`];
  for (let i = 0; i <= count; i++) {
    const x = -0.4 * width + (i / count) * 1.8 * width;
    const center = Math.min(1, Math.abs(x - width / 2) / (0.45 * width));
    const valley = 0.18 + 0.82 * center * center;
    const jag = 0.45 + 0.55 * random(`${seed}-${i}`);
    const y = base - peak * valley * (i % 2 === 0 ? jag : jag * 0.45);
    points.push(`${x},${y}`);
  }
  points.push(`${1.4 * width},${base}`);
  return points.join(" ");
}

export function Synthwave({
  colors,
  grid,
  sunTop,
  sunBottom,
  skyHorizon,
  gridSpeed = synthwaveDefaults.gridSpeed,
  horizon = synthwaveDefaults.horizon,
  sunStripes = synthwaveDefaults.sunStripes,
  speed = synthwaveDefaults.speed,
}: SynthwaveProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const merged = { ...synthwaveDefaults.colors, ...colors };
  const c: SynthwaveColors = {
    ...merged,
    grid: grid ?? merged.grid,
    sunTop: sunTop ?? merged.sunTop,
    sunBottom: sunBottom ?? merged.sunBottom,
    skyHorizon: skyHorizon ?? merged.skyHorizon,
  };
  const u = Math.min(W, H) / 720;
  const t = (frame / fps) * 30 * speed;
  const cx = W / 2;
  const yh = horizon * H;
  const floorDepth = H - yh;

  // Floor: screen y = yh + floorDepth / z, so z = 1 is the bottom edge.
  const rowGap = 0.5;
  const phase = ((((t / 30) * gridSpeed) % 1) + 1) % 1;
  const rows: { y: number; o: number }[] = [];
  for (let k = 0; k < 70; k++) {
    const z = 0.7 + (k + 1 - phase) * rowGap;
    const y = yh + floorDepth / z;
    if (y > H + 4 * u) continue;
    rows.push({ y, o: interpolate(z, [1, 14, 30], [1, 0.35, 0], clamp) });
  }
  const columns = Array.from({ length: 23 }, (_, i) => i - 11);
  const colSpread = W * 0.16;
  const nearZ = 0.35;

  const rise = interpolate(t, [0, 40], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const R = 0.27 * H;
  const sunY = interpolate(rise, [0, 1], [yh + R * 1.05, yh - R * 0.42]);
  const stripePhase = sunStripes ? (((t / 36) % 1) + 1) % 1 : 0;
  const stripes = Array.from({ length: 7 }, (_, i) => {
    const p = (i + stripePhase) / 7;
    const y = sunY + R * (-0.05 + p * 1.05);
    const h = R * (0.012 + 0.09 * p);
    return { y: y - h / 2, h };
  });

  const back = useMemo(
    () => ridge("synthwave-back", W, yh, 0.26 * H, 27),
    [W, H, yh],
  );
  const front = useMemo(
    () => ridge("synthwave-front", W, yh, 0.15 * H, 39),
    [W, H, yh],
  );
  // Ranges slide in sideways while rising from behind the horizon.
  const slideBack = interpolate(t, [4, 34], [1, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const slideFront = interpolate(t, [8, 38], [1, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: random(`synthwave-sx-${i}`) * W,
    y: random(`synthwave-sy-${i}`) * yh * 0.8,
    r: (0.6 + random(`synthwave-sr-${i}`) * 1.4) * u,
    o:
      0.25 +
      0.5 * (0.5 + 0.5 * Math.sin(t * 0.15 + random(`synthwave-sp-${i}`) * 9)),
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: c.floor, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.skyTop} />
            <stop offset="0.55" stopColor={c.skyTop} />
            <stop offset="1" stopColor={c.skyHorizon} />
          </linearGradient>
          <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.1" stopColor={c.sunTop} />
            <stop offset="0.85" stopColor={c.sunBottom} />
          </linearGradient>
          <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.skyHorizon} />
            <stop offset="0.25" stopColor={c.floor} />
          </linearGradient>
          <mask id={`${id}-stripes`}>
            <rect width={W} height={H} fill="#fff" />
            {stripes.map((s, i) => (
              <rect key={i} x={0} y={s.y} width={W} height={s.h} fill="#000" />
            ))}
          </mask>
          <clipPath id={`${id}-above`}>
            <rect width={W} height={yh} />
          </clipPath>
          <filter
            id={`${id}-glow`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation={4 * u} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id={`${id}-haze`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation={30 * u} />
          </filter>
        </defs>

        <rect width={W} height={yh} fill={`url(#${id}-sky)`} />
        <g fill="#FFFFFF">
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
          ))}
        </g>

        <g clipPath={`url(#${id}-above)`}>
          <circle
            cx={cx}
            cy={sunY}
            r={R * 1.15}
            fill={c.sunBottom}
            opacity={0.45}
            filter={`url(#${id}-haze)`}
          />
          <circle
            cx={cx}
            cy={sunY}
            r={R}
            fill={`url(#${id}-sun)`}
            mask={`url(#${id}-stripes)`}
          />
          <polygon
            points={back}
            fill={c.mountainsBack}
            transform={`translate(${-0.25 * W * slideBack} ${0.3 * H * slideBack})`}
          />
          <g
            transform={`translate(${0.25 * W * slideFront} ${0.2 * H * slideFront})`}
          >
            <polygon points={front} fill={c.mountainsFront} />
            <polyline
              points={front}
              fill="none"
              stroke={c.grid}
              strokeWidth={1.5 * u}
              strokeOpacity={0.55}
              strokeLinejoin="round"
            />
          </g>
        </g>

        <rect y={yh} width={W} height={H - yh} fill={`url(#${id}-floor)`} />
        <g
          stroke={c.grid}
          strokeWidth={2.2 * u}
          filter={`url(#${id}-glow)`}
          fill="none"
        >
          {columns.map((j) => (
            <line
              key={j}
              x1={cx}
              y1={yh}
              x2={cx + (j * colSpread) / nearZ}
              y2={yh + floorDepth / nearZ}
            />
          ))}
          {rows.map((row, i) => (
            <line
              key={i}
              x1={0}
              y1={row.y}
              x2={W}
              y2={row.y}
              strokeOpacity={row.o}
            />
          ))}
          <line x1={0} y1={yh} x2={W} y2={yh} strokeWidth={3 * u} />
        </g>
        {/* Haze that swallows the converging lines at the horizon. */}
        <rect
          y={yh - 6 * u}
          width={W}
          height={0.12 * H}
          fill={c.skyHorizon}
          opacity={0.5}
          filter={`url(#${id}-haze)`}
        />
      </svg>
    </AbsoluteFill>
  );
}
