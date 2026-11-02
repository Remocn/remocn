"use client";

import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ImpactShakeColors = {
  background: string;
  foreground: string;
  splitA: string;
  splitB: string;
  dust: string;
};

export type ImpactShakeProps = {
  /** The heavy subject. Defaults to a big white word. */
  children?: React.ReactNode;
  /** Word used when no children are passed. */
  text?: string;
  /** Shake, split and dust strength, 0 to 2. */
  intensity?: number;
  /** Frame (at 30fps) when the subject hits. */
  impact?: number;
  colors?: Partial<ImpactShakeColors>;
  /** Default word and flash color. Overrides `colors.foreground`. */
  foregroundColor?: string;
  /** Background color. Overrides `colors.background`. */
  backgroundColor?: string;
  seed?: number;
  speed?: number;
};

export const impactShakeDefaults = {
  text: "LAUNCH",
  intensity: 1,
  impact: 7,
  colors: {
    background: "#111111",
    foreground: "#FFFFFF",
    splitA: "#FF2A2A",
    splitB: "#2A6BFF",
    dust: "#D9D9D9",
  } satisfies ImpactShakeColors,
  seed: 1,
  speed: 1,
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const DUST = 36;

// Turns any content into a flat silhouette of one color, keeping its alpha.
function tintMatrix(hex: string) {
  const v = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  return `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 1 0`;
}

export function ImpactShake({
  children,
  text = impactShakeDefaults.text,
  intensity = impactShakeDefaults.intensity,
  impact = impactShakeDefaults.impact,
  colors: colorOverrides,
  foregroundColor,
  backgroundColor,
  seed = impactShakeDefaults.seed,
  speed = impactShakeDefaults.speed,
}: ImpactShakeProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const uid = `impact-shake-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const baseColors = { ...impactShakeDefaults.colors, ...colorOverrides };
  const colors = {
    ...baseColors,
    foreground: foregroundColor ?? baseColors.foreground,
    background: backgroundColor ?? baseColors.background,
  };
  const t = (frame * speed * 30) / fps;
  const k = Math.max(0, intensity);
  const unit = height / 720;
  const since = t - impact;

  // Fall: pure acceleration into the hit, no easing out.
  const fall = interpolate(t, [0, impact], [-height * 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const falling = since < 0;
  const stretch = falling
    ? interpolate(t, [0, impact], [1, 1.18], { extrapolateRight: "clamp" })
    : 1;
  const squash = falling
    ? 0
    : 1 -
      spring({ frame: since, fps: 30, config: { damping: 9, stiffness: 260 } });
  const sx = falling
    ? 1 / Math.sqrt(stretch)
    : 1 + 0.16 * squash * Math.min(1, k);
  const sy = falling ? stretch : 1 - 0.2 * squash * Math.min(1, k);

  // Damped camera shake with incommensurate frequencies so it never looks looped.
  const decay = since >= 0 ? Math.exp(-since / 3.2) : 0;
  const phase = random(`impact-shake-${seed}`) * Math.PI * 2;
  const shakeX = decay * Math.sin(since * 2.9 + phase) * 26 * unit * k;
  const shakeY = decay * Math.cos(since * 3.7 + phase) * 34 * unit * k;
  const shakeR = decay * Math.sin(since * 2.3 + phase * 2) * 1.6 * k;

  const split =
    since >= 0 && since < 2 ? (1 - since / 2) * 18 * unit * k + 6 * unit : 0;
  const flash = interpolate(since, [0, 0.5, 2.5], [0, 0.12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const floorY = height * 0.62;
  const dust = useMemo(
    () =>
      Array.from({ length: DUST }, (_, i) => {
        const key = `impact-shake-${seed}-dust-${i}`;
        const side = i % 2 === 0 ? -1 : 1;
        return {
          chip: i % 3 === 0,
          x0: (0.04 + random(`${key}-x`) * 0.24) * side,
          vx: side * (0.4 + random(`${key}-v`) * 1),
          vy: 0.3 + random(`${key}-u`) * 0.9,
          size: 0.5 + random(`${key}-s`) * 0.9,
          life: 11 + random(`${key}-l`) * 9,
        };
      }),
    [seed],
  );

  const subject = children ?? (
    <span
      style={{
        fontFamily: FONT,
        fontSize: height * 0.24,
        fontWeight: 900,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        color: colors.foreground,
      }}
    >
      {text}
    </span>
  );

  const layer = (filter: string | undefined, dx: number, key: string) => (
    <AbsoluteFill
      key={key}
      style={{
        alignItems: "center",
        justifyContent: "center",
        filter,
        transform: `translate(${dx}px, ${fall}px) scale(${sx}, ${sy})`,
        transformOrigin: `50% ${(floorY / height) * 100}%`,
        mixBlendMode: filter ? "screen" : undefined,
      }}
    >
      {subject}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill
      style={{ backgroundColor: colors.background, overflow: "hidden" }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id={`${uid}-a`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={tintMatrix(colors.splitA)} />
        </filter>
        <filter id={`${uid}-b`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={tintMatrix(colors.splitB)} />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeR}deg) scale(${1 + decay * 0.04 * k})`,
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <filter
            id={`${uid}-puff`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation={height * 0.007} />
          </filter>
          {since >= 0
            ? dust.map((p, i) => {
                const age = since;
                if (age > p.life) return null;
                const life = age / p.life;
                const spread = Math.max(0.4, k);
                if (p.chip) {
                  // Debris: ballistic arc, small and bright.
                  const x =
                    width / 2 + p.x0 * width + p.vx * age * 10 * unit * spread;
                  const y =
                    floorY - p.vy * age * 16 * unit + age * age * 1.6 * unit;
                  const size = p.size * 6 * unit;
                  return (
                    <rect
                      key={i}
                      x={x - size / 2}
                      y={y - size / 2}
                      width={size}
                      height={size}
                      fill={colors.dust}
                      opacity={(1 - life) * 0.9}
                      transform={`rotate(${age * 40 * p.vx} ${x} ${y})`}
                    />
                  );
                }
                // Puffs: burst outward against heavy drag, then hang and swell.
                const travel = 1 - Math.exp(-age / 3.5);
                const x =
                  width / 2 +
                  p.x0 * width +
                  p.vx * travel * width * 0.16 * spread;
                const y = floorY - p.vy * travel * height * 0.07;
                const r =
                  height * p.size * (0.015 + 0.05 * travel + 0.02 * life);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={r}
                    fill={colors.dust}
                    opacity={(1 - life) ** 1.4 * 0.38}
                    filter={`url(#${uid}-puff)`}
                  />
                );
              })
            : null}
        </svg>
        {split > 0 ? (
          <>
            {layer(`url(#${uid}-a)`, -split, "a")}
            {layer(`url(#${uid}-b)`, split, "b")}
          </>
        ) : null}
        {layer(undefined, 0, "main")}
      </AbsoluteFill>
      <AbsoluteFill
        style={{ backgroundColor: colors.foreground, opacity: flash * k }}
      />
    </AbsoluteFill>
  );
}
