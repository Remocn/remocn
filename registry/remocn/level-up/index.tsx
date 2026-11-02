"use client";

import { loadFont } from "@remotion/google-fonts/ChakraPetch";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: hud } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
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

export interface LevelUpProps {
  /** Level before the level-up. The new level is `level + 1`. */
  level?: number;
  /** XP already in the bar when the shot opens. */
  startXp?: number;
  /** XP needed for the next level. The chips should add up to `maxXp - startXp`. */
  maxXp?: number;
  /** One chip per entry, each flies into the bar. */
  chips?: number[];
  /** Big erupting call. */
  title?: string;
  /** Stat line that ticks up on the poster. */
  stat?: { label: string; value: number; suffix?: string };
  /** Small accent: the stat arrow and the level label marker. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1):
//   0–10   the segmented XP bar builds left to right, labels slide in
//   6–48   XP chips fly into the fill head one after another, speeding up;
//          each hit fills the bar a step, flashes the new segment and ticks the
//          counter
//  48–51   the bar maxes out and flashes
//  51–58   the bar collapses into the centre point
//  58–66   "LEVEL UP" erupts from that point with a burst of gradient rays and
//          one shockwave ring
//  68–76   the call ducks to a kicker, the old level number rises in big
//  82–90   the changed digit rolls 41 → 42 and lands with a kick
//  94–106  the stat line slides in and ticks up; poster hold to the end
const BAR_AT = 0;
const CHIP_FLY = 12;
const ARRIVALS = [18, 25, 31, 37, 42];
const FILL_LEN = 6;
const MAX_AT = 48;
const COLLAPSE_AT = 51;
const COLLAPSE_LEN = 7;
const BURST_AT = 58;
const DUCK_AT = 68;
const DUCK_LEN = 8;
const ROLL_AT = 82;
const ROLL_LEN = 8;
const STAT_AT = 94;
const STAT_LEN = 12;
const SEGMENTS = 10;

const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const INOUT = Easing.bezier(0.65, 0, 0.25, 1);
const IN = Easing.bezier(0.5, 0, 0.9, 0.6);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "beam": bg #02030a, [#f4f7ff, #8fb4ff, #3d5bff, #1a1660].
const BEAM = ["#F4F7FF", "#8FB4FF", "#3D5BFF", "#1A1660"] as const;

const THEMES = {
  dark: {
    stage: "#050609",
    ink: "#F3F2EF",
    dim: "#8A8A93",
    track: "#16171E",
    chip: "#0E1020",
    chipEdge: BEAM[1],
    rayAlpha: 1,
    rays: [BEAM[0], BEAM[1], BEAM[2], BEAM[3]],
    fill: `linear-gradient(90deg, ${BEAM[3]} 0%, ${BEAM[2]} 38%, ${BEAM[1]} 78%, ${BEAM[0]} 100%)`,
    number: `linear-gradient(180deg, ${BEAM[0]} 8%, ${BEAM[1]} 52%, ${BEAM[2]} 96%)`,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    track: "#E3E1DA",
    chip: "#FFFFFF",
    chipEdge: BEAM[2],
    rayAlpha: 0.7,
    rays: [BEAM[2], BEAM[2], BEAM[1], BEAM[1]],
    fill: `linear-gradient(90deg, ${BEAM[3]} 0%, ${BEAM[2]} 45%, ${BEAM[1]} 100%)`,
    number: `linear-gradient(180deg, ${BEAM[2]} 8%, #2A2FB8 55%, ${BEAM[3]} 96%)`,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function fmt(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** A short hit: up in 2 frames, eases back over 8. */
function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 8);
  return k * k;
}

// Chip launch points, relative to the bar centre in units of W and H.
const LAUNCH = [
  { x: -0.36, y: -0.36 },
  { x: 0.3, y: -0.4 },
  { x: -0.22, y: 0.36 },
  { x: 0.06, y: -0.42 },
  { x: 0.34, y: 0.34 },
];

export function LevelUp({
  level = 41,
  startXp = 2800,
  maxXp = 4000,
  chips = [120, 240, 180, 300, 360],
  title = "LEVEL UP",
  stat = { label: "Render speed", value: 40, suffix: "%" },
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: LevelUpProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const cx = W / 2;
  const cy = 0.53 * H;

  // ── XP state ──────────────────────────────────────────────────────────────
  const arrivals = chips.map(
    (_, i) => ARRIVALS[i] ?? ARRIVALS[ARRIVALS.length - 1] + (i - 4) * 5,
  );
  let xp = startXp;
  chips.forEach((v, i) => {
    xp += v * OUT(ramp(t, arrivals[i], FILL_LEN));
  });
  const fill = Math.min(1, xp / maxXp);
  const lastHit = arrivals.reduce((acc, a) => (t >= a ? a : acc), -99);
  const hitKick = kick(t - lastHit);

  // ── Bar geometry ──────────────────────────────────────────────────────────
  const barW = 0.66 * W;
  const barH = 34 * u;
  const gap = 7 * u;
  const segW = (barW - gap * (SEGMENTS - 1)) / SEGMENTS;
  const collapse = INOUT(ramp(t, COLLAPSE_AT, COLLAPSE_LEN));
  const maxFlash = t >= MAX_AT ? Math.max(0, 1 - (t - MAX_AT) / 6) : 0;
  const barGone = t >= COLLAPSE_AT + COLLAPSE_LEN;
  const labelsIn = OUT(ramp(t, BAR_AT + 3, 9));
  const labelsOut = ramp(t, COLLAPSE_AT, 4);

  // ── Burst ─────────────────────────────────────────────────────────────────
  const burst = OUT(ramp(t, BURST_AT, 16));
  const burstOp = ramp(t, BURST_AT, 3);
  const rollHit = ROLL_AT + ROLL_LEN;
  const rayPulse = kick(t - rollHit + 1);
  const spin = Math.max(0, t - BURST_AT) * 0.22;
  const ring = ramp(t, BURST_AT, 16);

  const titleFs = 140 * u;
  const titleIn = SLAM(ramp(t, BURST_AT, 7));
  const duck = INOUT(ramp(t, DUCK_AT, DUCK_LEN));
  const titleScale =
    interpolate(titleIn, [0, 1], [1.7, 1]) *
    interpolate(duck, [0, 1], [1, 0.36]);
  const titleY = interpolate(duck, [0, 1], [cy, 0.2 * H]);

  // ── Big level number ──────────────────────────────────────────────────────
  const numFs = 360 * u;
  const numIn = OUT(ramp(t, DUCK_AT + 5, 10));
  const roll = SLAM(ramp(t, ROLL_AT, ROLL_LEN));
  const from = String(level);
  const to = String(level + 1);
  const len = Math.max(from.length, to.length);
  const fromP = from.padStart(len, " ");
  const toP = to.padStart(len, " ");
  const numKick = 1 + 0.045 * kick(t - rollHit);

  // ── Stat line ─────────────────────────────────────────────────────────────
  const statP = OUT(ramp(t, STAT_AT, 10));
  const statN = stat.value * OUT(ramp(t, STAT_AT + 2, STAT_LEN));
  const logoP = OUT(ramp(t, STAT_AT + 6, 10));

  // Rays: wedges from an inner radius out, alternating widths and lengths.
  const RAYS = 24;
  const r0 = interpolate(burst, [0, 1], [0.05, 0.3]) * H;
  const reach = interpolate(burst, [0, 1], [0.3, 1]) * (1 + 0.06 * rayPulse);
  const rays = Array.from({ length: RAYS }, (_, i) => {
    const a = ((i / RAYS) * 360 + spin) * (Math.PI / 180);
    const half = (i % 2 === 0 ? 2.2 : 0.9) * (Math.PI / 180);
    const R = (0.42 + 0.38 * hash(i)) * W * reach;
    const ri = r0;
    const p = (ang: number, r: number) =>
      `${cx + Math.cos(ang) * r},${cy + Math.sin(ang) * r}`;
    return `M${p(a - half * 0.4, ri)} L${p(a - half, R)} L${p(a + half, R)} L${p(a + half * 0.4, ri)} Z`;
  });

  const chipFs = 30 * u;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      {/* Burst rays and the shockwave ring. */}
      {t >= BURST_AT ? (
        <svg
          width={W}
          height={H}
          style={{
            position: "absolute",
            inset: 0,
            opacity:
              burstOp *
              c.rayAlpha *
              (0.5 + 0.5 * (1 - ramp(t, BURST_AT + 8, 14)) + 0.3 * rayPulse),
          }}
          aria-hidden
        >
          <defs>
            <radialGradient
              id={`${id}-ray`}
              cx={cx}
              cy={cy}
              r={0.8 * W}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.12" stopColor={c.rays[0]} stopOpacity={0.95} />
              <stop offset="0.3" stopColor={c.rays[1]} stopOpacity={0.75} />
              <stop offset="0.6" stopColor={c.rays[2]} stopOpacity={0.45} />
              <stop offset="1" stopColor={c.rays[3]} stopOpacity={0} />
            </radialGradient>
          </defs>
          {rays.map((d, i) => (
            <path key={i} d={d} fill={`url(#${id}-ray)`} />
          ))}
          {ring < 1 ? (
            <circle
              cx={cx}
              cy={cy}
              r={interpolate(OUT(ring), [0, 1], [0.04 * W, 0.5 * W])}
              fill="none"
              stroke={BEAM[1]}
              strokeWidth={interpolate(ring, [0, 1], [5 * u, 0.5 * u])}
              opacity={1 - ring}
            />
          ) : null}
        </svg>
      ) : null}

      {t >= BURST_AT ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: ramp(t, BURST_AT + 4, 10),
            background: [
              `radial-gradient(30% 34% at 50% ${(cy / H) * 100}%, ${c.stage} 45%, transparent 100%)`,
              `linear-gradient(0deg, ${c.stage} 0%, ${c.stage} 12%, transparent 34%)`,
            ].join(", "),
          }}
        />
      ) : null}

      {/* XP bar. */}
      {!barGone ? (
        <div
          style={{
            position: "absolute",
            left: cx - barW / 2,
            top: cy - barH / 2,
            width: barW,
            height: barH,
            transform: `scaleX(${1 - collapse}) scaleY(${1 - 0.6 * collapse})`,
            transformOrigin: "50% 50%",
          }}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const x = i * (segW + gap);
            const appear = OUT(ramp(t, BAR_AT + i * 0.8, 6));
            const f = Math.max(0, Math.min(1, fill * SEGMENTS - i));
            const justFilled =
              f > 0 && fill * SEGMENTS - i < 1.6 && hitKick > 0 ? hitKick : 0;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: 0,
                  width: segW,
                  height: barH,
                  background: c.track,
                  transform: `skewX(-20deg) scaleY(${0.3 + 0.7 * appear})`,
                  opacity: appear,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${f * 100}%`,
                    backgroundImage: c.fill,
                    backgroundSize: `${barW}px ${barH}px`,
                    backgroundPosition: `${-x}px 0`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${f * 100}%`,
                    background: BEAM[0],
                    opacity: Math.max(0.85 * justFilled, maxFlash),
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Labels above the bar. */}
      {labelsOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: cx - barW / 2,
            width: barW,
            top: cy - barH / 2 - 128 * u,
            height: 110 * u,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            opacity: labelsIn * (1 - labelsOut),
            transform: `translateY(${(1 - labelsIn) * 16 * u}px)`,
            fontFamily: hud,
            fontWeight: 500,
            color: c.ink,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 * u }}>
            <span
              style={{
                fontSize: 30 * u,
                letterSpacing: "0.14em",
                color: c.dim,
              }}
            >
              LV
            </span>
            <span
              style={{
                fontSize: 112 * u,
                lineHeight: 0.8,
                letterSpacing: "-0.02em",
              }}
            >
              {level}
            </span>
          </div>
          <div
            style={{
              fontSize: 32 * u,
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
              marginBottom: 2 * u,
            }}
          >
            {fmt(xp)}
            <span style={{ color: c.dim }}> / {fmt(maxXp)} XP</span>
          </div>
        </div>
      ) : null}
      {labelsOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: cx - barW / 2,
            width: barW,
            top: cy + barH / 2 + 18 * u,
            display: "flex",
            justifyContent: "space-between",
            opacity: labelsIn * (1 - labelsOut),
            fontFamily: hud,
            fontWeight: 400,
            fontSize: 20 * u,
            letterSpacing: "0.16em",
            color: c.dim,
          }}
        >
          <span>EXPERIENCE</span>
          <span style={{ color: fill >= 1 ? c.ink : c.dim }}>
            {fill >= 1 ? "MAX" : `NEXT  LV ${level + 1}`}
          </span>
        </div>
      ) : null}

      {/* XP chips flying into the fill head. */}
      {chips.map((v, i) => {
        const at = arrivals[i];
        const launch = at - CHIP_FLY;
        if (t < launch || t >= at + 1) return null;
        const p = ramp(t, launch, CHIP_FLY);
        const e = IN(p);
        const L = LAUNCH[i % LAUNCH.length];
        const sx = cx + L.x * W;
        const sy = cy + L.y * H;
        const headX = cx - barW / 2 + barW * Math.min(1, (xp + 0) / maxXp);
        const tx = headX;
        const ty = cy;
        const mx = (sx + tx) / 2 + (L.y < 0 ? -1 : 1) * 0.06 * W;
        const my = (sy + ty) / 2 + (L.y < 0 ? -0.12 : 0.12) * H;
        const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * tx;
        const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ty;
        const appear = OUT(ramp(t, launch, 4));
        const k = interpolate(e, [0, 1], [1, 0.5]) * (0.85 + 0.15 * appear);
        const op = appear * (1 - ramp(t, at - 2, 3));
        return (
          <div
            key={`${i}-${v}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${k})`,
              opacity: op,
              padding: `${9 * u}px ${18 * u}px ${8 * u}px`,
              borderRadius: 999,
              background: c.chip,
              border: `${1.5 * u}px solid ${c.chipEdge}`,
              fontFamily: hud,
              fontWeight: 500,
              fontSize: chipFs,
              lineHeight: 1,
              letterSpacing: "0.02em",
              color: c.ink,
              whiteSpace: "nowrap",
            }}
          >
            +{v} <span style={{ color: c.chipEdge }}>XP</span>
          </div>
        );
      })}

      {/* LEVEL UP call. */}
      {t >= BURST_AT ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: titleY - titleFs * 0.6,
            height: titleFs * 1.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${titleScale})`,
            opacity: ramp(t, BURST_AT, 2),
            fontFamily: hud,
            fontWeight: 500,
            fontSize: titleFs,
            lineHeight: 1,
            letterSpacing: "0.04em",
            color: theme === "dark" ? "#FFFFFF" : c.ink,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
      ) : null}

      {/* Big level number: the changed digits roll. */}
      {t >= DUCK_AT + 5 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: cy - numFs * 0.5,
            height: numFs,
            display: "flex",
            justifyContent: "center",
            opacity: numIn,
            transform: `translateY(${(1 - numIn) * 50 * u}px) scale(${numKick})`,
            fontFamily: hud,
            fontWeight: 500,
            fontSize: numFs,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {Array.from({ length: len }, (_, i) => {
            const a = fromP[i];
            const b = toP[i];
            const same = a === b;
            const glyph = (ch: string) => (
              <div
                style={{
                  height: numFs,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundImage: c.number,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {ch.trim() === "" ? " " : ch}
              </div>
            );
            return (
              <div
                key={i}
                style={{
                  width: "0.6em",
                  height: numFs,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    transform: same
                      ? undefined
                      : `translateY(${-roll * numFs}px)`,
                  }}
                >
                  {glyph(a)}
                  {same ? null : glyph(b)}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Stat line. */}
      {t >= STAT_AT ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: 0.8 * H,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: 18 * u,
            opacity: statP,
            transform: `translateY(${(1 - statP) * 22 * u}px)`,
            fontFamily: hud,
            fontWeight: 500,
            fontSize: 34 * u,
            lineHeight: 1,
            letterSpacing: "0.02em",
            color: c.ink,
          }}
        >
          <span style={{ color: c.dim }}>{stat.label}</span>
          <span
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8 * u,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <svg
              width={18 * u}
              height={15 * u}
              viewBox="0 0 18 15"
              aria-hidden
              style={{ alignSelf: "center" }}
            >
              <path d="M9 0 L18 15 L0 15 Z" fill={accent} />
            </svg>
            +{Math.round(statN)}
            {stat.suffix ?? ""}
          </span>
        </div>
      ) : null}

      {/* Logo. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: 0.9 * H,
          display: "flex",
          justifyContent: "center",
          opacity: logoP,
        }}
      >
        <RemocnLogo fontSize={26 * u} color={c.ink} />
      </div>
    </AbsoluteFill>
  );
}
