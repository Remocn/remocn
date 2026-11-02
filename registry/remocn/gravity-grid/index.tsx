"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

export interface GravityGridProps {
  /** Replaces the remocn logo at the bottom of the well; `name` is set beside it. */
  logo?: React.ReactNode;
  name?: string;
  /** Small line under the name. Pass an empty string to hide it. */
  caption?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "radial-glow" palette: bg #020204, [#f3f1ff, #9db4ff, #5a46cb, #1d1240].
// It lights the well: a glowing ring at the bottom, and the brightest grid lines.
const GLOW = ["#f3f1ff", "#9db4ff", "#5a46cb", "#1d1240"] as const;

const THEMES = {
  dark: {
    bg: "#020204",
    ramp: ["#8E8D99", "#8E8D99", GLOW[1], GLOW[0]],
    fg: "#F3F2EF",
    muted: "#8B8A90",
    base: 0.13,
    lit: 0.95,
    pool: "rgba(2,2,4,0.9)",
    ring: [0.75, 0.5, 0.42],
    disc: 0.55,
    vignette: "rgba(0,0,0,0.65)",
    grain: 0.06,
    glow: 0.32,
    bloom: 0.6,
  },
  light: {
    bg: "#F5F4F0",
    ramp: ["#55545C", "#55545C", GLOW[2], GLOW[3]],
    fg: "#121214",
    muted: "#6E6C67",
    base: 0.12,
    lit: 0.8,
    pool: "rgba(245,244,240,0.94)",
    ring: [0.0, 0.7, 0.5],
    disc: 0.42,
    vignette: "rgba(120,110,95,0.14)",
    grain: 0.045,
    glow: 0.14,
    bloom: 0,
  },
} as const;

/** Frame the mass reaches the bottom of the well. */
const IMPACT = 72;
const WELL_Z = 13;
const CORE = 2.6;
const DEPTH = 5.4;
const LEVELS = 14;

function smooth(a: number, b: number, x: number) {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={2}
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function GravityGrid({
  logo,
  name = "remocn",
  caption = "Launch videos, in components.",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: GravityGridProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const pal = THEMES[theme];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // ---- the mass: accelerates down, lands, the well overshoots and settles ----
  const fallP = interpolate(t, [14, IMPACT], [0, 1], CLAMP);
  const fall = fallP ** 2.2;
  const after = Math.max(0, t - IMPACT);
  const bounce =
    t > IMPACT ? 0.12 * Math.exp(-after / 9) * Math.sin(after / 3.2) : 0;
  const depth = DEPTH * (fall + bounce);
  const massY = interpolate(fall, [0, 1], [7, -DEPTH + 0.9]);

  // ---- one ripple from the impact ----
  const ripR = after * 0.42;
  const ripAmp = t > IMPACT ? 0.55 * Math.exp(-after / 34) : 0;
  const rippleAt = (r: number) => {
    if (ripAmp <= 0.001) return 0;
    const dr = r - ripR;
    return (
      ripAmp *
      Math.exp(-(dr * dr) / 5) *
      Math.sin(dr * 1.5) *
      smooth(0, 2.5, ripR - 1.5)
    );
  };

  const heightAt = (x: number, z: number) => {
    const dx = x;
    const dz = z - WELL_Z;
    const r = Math.sqrt(dx * dx + dz * dz);
    return -depth * (CORE / Math.sqrt(r * r + CORE * CORE)) + rippleAt(r);
  };

  // ---- camera: slow push in, tilting down to follow the mass ----
  const follow = interpolate(t, [10, IMPACT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camH = 6.4 - follow * 0.3;
  const camZ = interpolate(t, [0, 240], [-3.4, -2], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const f = height * 1.3;
  // look at the rim first, then down into the well as the mass sinks
  const lookY = -DEPTH * 0.92 * follow;
  const pitch =
    Math.atan2(camH - lookY, WELL_Z - camZ) -
    Math.atan((0.03 * height) / f) * (1 - follow);
  const camX = Math.sin(t / 90) * 0.35;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const project = (x: number, y: number, z: number) => {
    const dx = x - camX;
    const dy = y - camH;
    const dz = z - camZ;
    const yc = dy * cosP + dz * sinP;
    const zc = -dy * sinP + dz * cosP;
    return {
      x: width / 2 + (f * dx) / zc,
      y: height / 2 - (f * yc) / zc,
      zc,
    };
  };

  // ---- lockup at the bottom of the well ----
  const lockIn = interpolate(t, [IMPACT + 6, IMPACT + 32], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const capIn = interpolate(t, [IMPACT + 18, IMPACT + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // ---- light from the mass catches the curvature ----
  const brightness = (x: number, z: number, y: number) => {
    const e = 0.05;
    const gx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e);
    const gz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
    const nl = Math.sqrt(gx * gx + 1 + gz * gz);
    const lx = -x;
    const ly = massY - y;
    const lz = WELL_Z - z;
    const d2 = lx * lx + ly * ly + lz * lz;
    const dl = Math.sqrt(d2);
    const ndl = Math.max(0, (-gx * lx + ly - gz * lz) / (nl * dl));
    const falloff = 14 / (14 + d2);
    // the slope itself catches a rim of light, even far from the mass
    const slope = Math.min(1, Math.sqrt(gx * gx + gz * gz) * 0.9);
    const r = Math.sqrt(x * x + (z - WELL_Z) ** 2);
    const rip =
      ripAmp > 0 ? Math.exp(-((r - ripR) ** 2) / 4) * ripAmp * 1.1 : 0;
    return ndl * falloff * 1.6 + slope * 0.55 * fall + rip;
  };

  const levels: string[] = Array.from({ length: LEVELS + 1 }, () => "");
  const addLine = (pts: { x: number; z: number }[]) => {
    let prev: { sx: number; sy: number; ok: boolean } | null = null;
    for (const p of pts) {
      const y = heightAt(p.x, p.z);
      const s = project(p.x, y, p.z);
      const ok = s.zc > 0.6;
      if (prev?.ok && ok) {
        const r = Math.sqrt(p.x * p.x + (p.z - WELL_Z) ** 2);
        const fog =
          (1 - smooth(18, 80, s.zc)) *
          smooth(0.6, 3, s.zc) *
          (1 - smooth(16, 34, Math.abs(p.x)));
        const hole = 1 - lockIn * (1 - smooth(0.3, 2, r)) * 0.8;
        const b =
          (pal.base + pal.lit * Math.min(1, brightness(p.x, p.z, y))) *
          fog *
          hole;
        const lv = Math.min(LEVELS, Math.round(b * LEVELS));
        if (lv > 0) {
          levels[lv] +=
            `M${prev.sx.toFixed(1)} ${prev.sy.toFixed(1)}L${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
        }
      }
      prev = { sx: s.x, sy: s.y, ok };
    }
  };

  const STEP = 0.5;
  for (let gx = -34; gx <= 34; gx++) {
    const pts = [];
    for (let z = 1; z <= 90; z += z < 30 ? STEP : 1) pts.push({ x: gx, z });
    addLine(pts);
  }
  for (let gz = 1; gz <= 90; gz++) {
    const pts = [];
    for (let x = -34; x <= 34; x += Math.abs(x) < 14 ? STEP : 1)
      pts.push({ x, z: gz });
    addLine(pts);
  }

  const bottom = project(0, -depth, WELL_Z);
  const horizonY = height / 2 - f * Math.tan(pitch);
  const scaleAtBottom = f / bottom.zc / (height * 0.072);
  const lift = (1 - lockIn) * 14 * u;
  const markSize = 62 * u * scaleAtBottom;
  const glowR = height * 0.34;
  const ringRx = height * 0.42 * (0.9 + 0.1 * lockIn) * (1 + ripAmp * 0.25);
  const ringRy = ringRx * Math.max(0.2, Math.sin(pitch) * 0.62);
  const massS = project(0, Math.max(massY, -depth + 0.4), WELL_Z);
  const massR = (6 * u * f) / Math.max(1, massS.zc) / (height * 0.072);
  const massO =
    interpolate(t, [10, 22], [0, 1], CLAMP) *
    (1 - interpolate(t, [IMPACT - 2, IMPACT + 10], [0, 1], CLAMP));
  const mixA = (c: string, a: number) =>
    `color-mix(in oklab, ${c} ${Math.round(Math.max(0, Math.min(1, a)) * 100)}%, transparent)`;
  const glowO = pal.glow * (0.35 * fall + 0.65 * lockIn) * (1 + ripAmp * 0.6);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      {/* the light at the bottom of the well */}
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(${ringRx}px ${ringRy}px at ${bottom.x}px ${bottom.y + ringRy * 0.12}px, transparent 46%, ${mixA(GLOW[0], pal.ring[0])} 55%, ${mixA(GLOW[1], pal.ring[1])} 62%, ${mixA(GLOW[2], pal.ring[2])} 70%, transparent 86%)`,
            `radial-gradient(circle ${glowR}px at ${bottom.x}px ${bottom.y}px, ${mixA(GLOW[2], pal.disc)}, ${mixA(GLOW[3], pal.disc * 0.6)} 40%, transparent 70%)`,
          ].join(", "),
          opacity: glowO,
        }}
      />
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <filter id={`bloom${id}`}>
            <feGaussianBlur stdDeviation={2.2 * u} />
          </filter>
        </defs>
        {/* a soft bloom under the brightest lines */}
        <g filter={`url(#bloom${id})`} opacity={pal.bloom}>
          {levels.map((d, lv) =>
            lv >= LEVELS * 0.55 && d ? (
              <path
                key={lv}
                d={d}
                stroke={GLOW[2]}
                strokeWidth={2.4 * u}
                fill="none"
                opacity={(lv / LEVELS) ** 2}
              />
            ) : null,
          )}
        </g>
        {levels.map((d, lv) =>
          d ? (
            <path
              key={lv}
              d={d}
              stroke={interpolateColors(
                lv / LEVELS,
                [0, 0.42, 0.72, 1],
                [...pal.ramp],
              )}
              strokeOpacity={lv / LEVELS}
              strokeWidth={1.05 * u}
              strokeLinecap="round"
              fill="none"
            />
          ) : null,
        )}
      </svg>

      {/* the mass: a bright accent bead that sinks and becomes the light */}
      <div
        style={{
          position: "absolute",
          left: massS.x - massR,
          top: massS.y - massR,
          width: massR * 2,
          height: massR * 2,
          borderRadius: "50%",
          background: accent,
          boxShadow: `0 0 ${massR * 3}px ${massR}px ${mixA(accent, 0.45)}`,
          opacity: massO,
        }}
      />

      {/* the name settles where the mass came to rest */}
      <div
        style={{
          position: "absolute",
          left: bottom.x,
          top: bottom.y,
          transform: `translate(-50%, -50%) translateY(${lift}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14 * u * scaleAtBottom,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: markSize * 6.2,
            height: markSize * 3.4,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse closest-side, ${pal.pool}, transparent)`,
            opacity: lockIn * 0.95,
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 10 * u * scaleAtBottom,
            opacity: lockIn,
            filter: `blur(${(1 - lockIn) * 6 * u}px)`,
            transform: `scale(${0.94 + lockIn * 0.06})`,
          }}
        >
          {logo ? (
            <>
              {logo}
              <div
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: markSize * 0.95,
                  lineHeight: 1,
                  letterSpacing: "-0.035em",
                  color: pal.fg,
                }}
              >
                {name}
              </div>
            </>
          ) : (
            <RemocnLogo fontSize={markSize * 1.02} color={pal.fg} />
          )}
        </div>
        {caption ? (
          <div
            style={{
              position: "relative",
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 18 * u * scaleAtBottom,
              letterSpacing: "0em",
              color: pal.muted,
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 8 * u}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>

      {/* atmospheric falloff toward the horizon */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, ${pal.bg} ${Math.max(0, horizonY + height * 0.03)}px, ${pal.bg}00 ${horizonY + height * 0.38}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 75% at 50% 50%, transparent 50%, ${pal.vignette} 100%)`,
        }}
      />
      <Grain opacity={pal.grain} />
    </AbsoluteFill>
  );
}
