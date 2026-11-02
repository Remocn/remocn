"use client";

import { loadFont } from "@remotion/google-fonts/ChakraPetch";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: chakra } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: chakraItalic } = loadFont("italic", {
  weights: ["500"],
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

export interface BossHit {
  /** The move name, slammed in at the centre. */
  label: string;
  /** HP taken off the bar. The boss's max HP is the sum of all hits. */
  damage: number;
}

export interface BossBarProps {
  /** Boss name over the bar. */
  boss?: string;
  /** Hits in order; the last one takes the bar to zero. */
  hits?: BossHit[];
  /** Word slammed in when the bar breaks. */
  defeated?: string;
  /** The small "BOSS" tag and the hit slash. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1):
//   0–20   the bar frame wipes in from the left and the fill charges to full,
//          the boss name and HP readout slide in above it
//  25–30   "Captions" slams in at the centre; 30 is the hit: the bar chunks down,
//          a white damage segment trails and drains, "-820" pops off the cut
//  51–56   "Transitions", same hit; 77–82 "Templates" takes the bar to zero
//  86–88   the empty bar flashes white; 88 it shatters into fragments
//  90–96   "DEFEATED" slams in with the gradient; 96 is the impact frame
//          (one inverted frame) with a heavy shake; the rise glow lifts
// 100–112  the boss name glides down to sit over the word; logo at 114; poster
const INTRO = 20;
const FIRST_HIT = 30;
const HIT_GAP = 26;
const SLAM_LEN = 5;
const TRAIL_HOLD = 7;
const TRAIL_DRAIN = 10;
const FLASH_DELAY = 4;
const SHATTER_DELAY = 6;
const DEFEAT_DELAY = 8;
const DEFEAT_LEN = 6;

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.65, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "rise": bg #030306, [#fff1e2, #ff8a3d, #a3301a, #2a0d0a].
const RISE = ["#FFF1E2", "#FF8A3D", "#A3301A", "#2A0D0A"] as const;

const THEMES = {
  dark: {
    stage: "#070608",
    ink: "#F3F2EF",
    dim: "#86858C",
    track: "#19181C",
    frame: "rgba(243, 242, 239, 0.28)",
    tick: "rgba(7, 6, 8, 0.55)",
    trail: "#FFFFFF",
    shard: "#FFFFFF",
    word: `linear-gradient(176deg, ${RISE[0]} 8%, ${RISE[1]} 48%, #D9482A 78%, ${RISE[2]} 100%)`,
    glow: 0.85,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    track: "#DEDCD5",
    frame: "rgba(18, 18, 20, 0.22)",
    tick: "rgba(245, 244, 240, 0.6)",
    trail: "#FFFFFF",
    shard: "#121214",
    word: `linear-gradient(176deg, ${RISE[1]} 4%, #E0552C 40%, ${RISE[2]} 78%, #5A1A10 100%)`,
    glow: 0.4,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Decaying, frame-stepped shake. */
function shake(t: number, at: number, len: number, amp: number) {
  const d = Math.floor(t - at);
  if (d < 0 || d >= len) return { x: 0, y: 0 };
  const k = (1 - d / len) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.4 + 0.6),
    y: amp * 0.6 * k * Math.cos(d * 3.1 + 0.3),
  };
}

function fmt(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("en-US");
}

// Shatter pieces: the bar is cut into columns on slanted lines, each column
// split once more along a jagged midline.
const COLS = 11;

export function BossBar({
  boss = "THE OLD WORKFLOW",
  hits = [
    { label: "Captions", damage: 820 },
    { label: "Transitions", damage: 1140 },
    { label: "Templates", damage: 1040 },
  ],
  defeated = "DEFEATED",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BossBarProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const maxHp = hits.reduce((a, h) => a + h.damage, 0) || 1;
  const hitAt = hits.map((_, i) => FIRST_HIT + i * HIT_GAP);
  const lastHit = hitAt[hitAt.length - 1] ?? FIRST_HIT;
  const flashAt = lastHit + FLASH_DELAY;
  const shatterAt = lastHit + SHATTER_DELAY;
  const defeatAt = lastHit + DEFEAT_DELAY;
  const defeatHit = defeatAt + DEFEAT_LEN;
  const glideAt = defeatHit + 4;
  const logoAt = defeatHit + 18;

  // HP after each hit, and where we are now.
  const hpAfter: number[] = [];
  hits.forEach((h, i) => {
    hpAfter.push((i === 0 ? maxHp : hpAfter[i - 1]) - h.damage);
  });
  const landed = hitAt.filter((h) => t >= h).length;
  const hp = landed === 0 ? maxHp : hpAfter[landed - 1];
  const prevHp = landed <= 1 ? maxHp : hpAfter[landed - 2];
  const sinceHit = landed === 0 ? -1 : t - hitAt[landed - 1];
  // White trail: holds at the old HP, then drains to the new one.
  const trailHp =
    landed === 0
      ? maxHp
      : interpolate(
          sinceHit,
          [TRAIL_HOLD, TRAIL_HOLD + TRAIL_DRAIN],
          [prevHp, hp],
          { ...CLAMP, easing: INOUT },
        );

  // ── Bar geometry ──────────────────────────────────────────────────────────
  const barX = 0.11 * W;
  const barW = 0.78 * W;
  const barY = 0.205 * H;
  const barH = 30 * u;
  const frameIn = OUT(ramp(t, 0, 10));
  const charge = INOUT(ramp(t, 6, INTRO - 6));
  const fillFrac = (t < FIRST_HIT ? charge : 1) * (hp / maxHp);
  const trailFrac = t < FIRST_HIT ? fillFrac : trailHp / maxHp;
  const barShake = landed > 0 ? shake(t, hitAt[landed - 1], 7, 8 * u) : null;
  const flashing = t >= flashAt && t < shatterAt;
  const broken = t >= shatterAt;

  // ── Camera ────────────────────────────────────────────────────────────────
  const camHits = hitAt.map((h, i) =>
    shake(t, h, 8, (i === hits.length - 1 ? 9 : 5) * u),
  );
  const camDefeat = shake(t, defeatHit, 14, 20 * u);
  const camX = camHits.reduce((a, s) => a + s.x, 0) + camDefeat.x;
  const camY = camHits.reduce((a, s) => a + s.y, 0) + camDefeat.y;
  const inverted = t >= defeatHit && t < defeatHit + speed;

  // ── Defeat ────────────────────────────────────────────────────────────────
  const defeatP = SLAM(ramp(t, defeatAt, DEFEAT_LEN));
  const defeatFs = 210 * u;
  const defeatY = 0.5 * H;
  const glide = INOUT(ramp(t, glideAt, 12));
  const settle = interpolate(t, [defeatHit, defeatHit + 70], [1, 1.03], CLAMP);
  const glowP = OUT(ramp(t, defeatHit, 18));
  const logoP = OUT(ramp(t, logoAt, 10));

  // Boss name: above the bar, then glides to sit over the defeat word.
  const nameIn = OUT(ramp(t, 4, 10));
  const nameFs = interpolate(glide, [0, 1], [26, 34]) * u;
  const nameX0 = barX;
  const nameY0 = barY - 46 * u;
  const nameY1 = defeatY - defeatFs * 0.62;

  const hitWordFs = 128 * u;

  // Shatter fragments.
  const cutTop: number[] = [];
  const cutBot: number[] = [];
  const mid: number[] = [];
  for (let i = 0; i <= COLS; i++) {
    const edge = i === 0 || i === COLS;
    const base = i / COLS;
    const j = edge ? 0 : (hash(i + 3) - 0.5) * 0.05;
    const lean = edge ? 0 : (hash(i + 17) - 0.5) * 0.045;
    cutTop.push(base + j + lean);
    cutBot.push(base + j - lean);
    mid.push(0.32 + 0.36 * hash(i + 41));
  }
  const dt = t - shatterAt;
  const fragments: {
    k: number;
    d: string;
    fill: string;
    x: number;
    y: number;
    r: number;
  }[] = [];
  if (broken && dt < 40) {
    for (let i = 0; i < COLS; i++) {
      for (let half = 0; half < 2; half++) {
        const k = i * 2 + half;
        const xt0 = cutTop[i] * barW;
        const xt1 = cutTop[i + 1] * barW;
        const xb0 = cutBot[i] * barW;
        const xb1 = cutBot[i + 1] * barW;
        const xm0 = (xt0 + xb0) / 2;
        const xm1 = (xt1 + xb1) / 2;
        const ym0 = mid[i] * barH;
        const ym1 = mid[i + 1] * barH;
        const pts =
          half === 0
            ? [
                [xt0, 0],
                [xt1, 0],
                [xm1, ym1],
                [xm0, ym0],
              ]
            : [
                [xm0, ym0],
                [xm1, ym1],
                [xb1, barH],
                [xb0, barH],
              ];
        const cx = pts.reduce((a, p) => a + p[0], 0) / 4;
        const cy = pts.reduce((a, p) => a + p[1], 0) / 4;
        const rel = (cx - barW / 2) / barW;
        const vx = (rel * 34 + (hash(k + 7) - 0.5) * 10) * u;
        const vy = (-(2 + hash(k + 13) * 6) + (half === 0 ? -2 : 2)) * u;
        const g = 0.9 * u;
        const px = vx * dt;
        const py = vy * dt + 0.5 * g * dt * dt;
        const rot = (hash(k + 29) - 0.5) * 14 * dt;
        const d = `M${pts.map((p) => `${p[0] - cx} ${p[1] - cy}`).join(" L")} Z`;
        const fill =
          hash(k + 61) < 0.55
            ? c.shard
            : [RISE[1], "#E0552C", RISE[0]][Math.floor(hash(k + 71) * 3)];
        fragments.push({
          k,
          d,
          fill,
          x: barX + cx + px,
          y: barY + cy + py,
          r: rot,
        });
      }
    }
  }
  const fragOp = 1 - ramp(dt, 8, 12);

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.stage,
          filter: inverted ? "invert(1)" : undefined,
        }}
      >
        {/* The rise glow: lifts from the bottom once the boss is down. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: glowP * c.glow,
            background: [
              `radial-gradient(60% 46% at 50% ${interpolate(glowP, [0, 1], [118, 104])}%, ${RISE[1]}cc 0%, ${RISE[2]}80 38%, transparent 72%)`,
              `radial-gradient(90% 30% at 50% 108%, ${RISE[0]}99 0%, transparent 60%)`,
            ].join(", "),
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${camX}px, ${camY}px) scale(${settle})`,
          }}
        >
          {/* Boss tag + name. */}
          <div
            style={{
              position: "absolute",
              left: interpolate(glide, [0, 1], [nameX0, 0]),
              width: interpolate(glide, [0, 1], [barW, W]),
              top: interpolate(glide, [0, 1], [nameY0, nameY1]) - nameFs / 2,
              display: "flex",
              alignItems: "center",
              justifyContent: glide > 0.5 ? "center" : "flex-start",
              gap: 14 * u,
              opacity: nameIn,
              transform: `translateX(${(1 - nameIn) * -30 * u}px)`,
            }}
          >
            <div
              style={{
                fontFamily: chakra,
                fontWeight: 500,
                fontSize: 15 * u,
                letterSpacing: "0.16em",
                color: "#FFFFFF",
                background: accent,
                padding: `${5 * u}px ${9 * u}px ${4 * u}px`,
                lineHeight: 1,
                transform: "skewX(-12deg)",
                opacity: 1 - glide,
                width: interpolate(glide, [0, 1], [62 * u, 0]),
                overflow: "hidden",
                whiteSpace: "nowrap",
                display: glide > 0.98 ? "none" : "block",
              }}
            >
              BOSS
            </div>
            <div
              style={{
                fontFamily: chakra,
                fontWeight: 500,
                fontSize: nameFs,
                letterSpacing: "0.1em",
                lineHeight: 1,
                color: c.ink,
                whiteSpace: "nowrap",
              }}
            >
              {boss}
            </div>
          </div>

          {/* HP readout. */}
          <div
            style={{
              position: "absolute",
              left: barX,
              width: barW,
              top: nameY0 - 10 * u,
              display: "flex",
              justifyContent: "flex-end",
              fontFamily: chakra,
              fontWeight: 500,
              fontSize: 18 * u,
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
              color: c.dim,
              opacity: OUT(ramp(t, 8, 8)) * (1 - ramp(t, shatterAt, 4)),
            }}
          >
            <span style={{ color: c.ink }}>
              {fmt(t < FIRST_HIT ? charge * maxHp : hp)}
            </span>
            <span>&nbsp;/ {fmt(maxHp)} HP</span>
          </div>

          {/* The bar. */}
          {!broken ? (
            <div
              style={{
                position: "absolute",
                left: barX,
                top: barY,
                width: barW,
                height: barH,
                clipPath: `inset(0 ${(1 - frameIn) * 100}% 0 0)`,
                transform: barShake
                  ? `translate(${barShake.x}px, ${barShake.y}px)`
                  : undefined,
                background: flashing ? "#FFFFFF" : c.track,
                boxShadow: `0 0 0 ${2 * u}px ${c.frame}`,
              }}
            >
              {/* Damage trail. */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${trailFrac * 100}%`,
                  background: c.trail,
                }}
              />
              {/* Fill. */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${fillFrac * 100}%`,
                  backgroundImage: `linear-gradient(180deg, rgba(255, 241, 226, 0.4) 0%, rgba(255, 241, 226, 0) 34%), linear-gradient(90deg, #5E1A0E 0%, ${RISE[2]} 28%, #E0552C 62%, ${RISE[1]} 86%, #FFC08A 100%)`,
                  backgroundSize: `${barW}px 100%`,
                  // Flash the fill white for two frames on each hit.
                  filter:
                    sinceHit >= 0 && sinceHit < 2
                      ? "brightness(2.4)"
                      : undefined,
                }}
              />
              {/* Chunk ticks. */}
              {Array.from({ length: 9 }, (_, k) => (
                <div
                  key={`tick-${(k + 1) * 10}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${(k + 1) * 10}%`,
                    width: 3 * u,
                    background: flashing ? "transparent" : c.tick,
                  }}
                />
              ))}
            </div>
          ) : null}

          {/* Shatter. */}
          {fragments.length > 0 ? (
            <svg
              width={W}
              height={H}
              style={{ position: "absolute", inset: 0, overflow: "visible" }}
              aria-hidden
            >
              <g opacity={fragOp}>
                {fragments.map((f) => (
                  <path
                    key={f.k}
                    d={f.d}
                    fill={f.fill}
                    transform={`translate(${f.x} ${f.y}) rotate(${f.r})`}
                  />
                ))}
              </g>
            </svg>
          ) : null}

          {/* Damage numbers pop off the cut. */}
          {hits.map((h, i) => {
            const d = t - hitAt[i];
            if (d < 0 || d > 26) return null;
            const before = i === 0 ? maxHp : hpAfter[i - 1];
            const x = barX + (barW * (before + hpAfter[i])) / 2 / maxHp;
            const pop = SLAM(ramp(d, 0, 4));
            const isLast = i === hits.length - 1;
            const out = isLast ? ramp(t, shatterAt - 2, 5) : ramp(d, 16, 8);
            const fs = (isLast ? 64 : 54) * u;
            return (
              <div
                key={`dmg-${h.label}`}
                style={{
                  position: "absolute",
                  left: x - 200 * u,
                  width: 400 * u,
                  top: barY + barH + 18 * u,
                  display: "flex",
                  justifyContent: "center",
                  transform: `translateY(${(-10 * pop - 22 * out) * u}px) scale(${interpolate(pop, [0, 1], [1.6, 1])})`,
                  opacity: ramp(d, 0, 2) * (1 - out),
                  fontFamily: chakraItalic,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: fs,
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                  color: c.ink,
                  whiteSpace: "nowrap",
                }}
              >
                −{fmt(h.damage)}
              </div>
            );
          })}

          {/* Hit words: slam in at the centre, cut by a slash on impact. */}
          {hits.map((h, i) => {
            const at = hitAt[i];
            const start = at - SLAM_LEN;
            const end =
              i < hits.length - 1 ? hitAt[i + 1] - SLAM_LEN : defeatAt - 3;
            if (t < start || t > end + 4) return null;
            const p = SLAM(ramp(t, start, SLAM_LEN));
            const out = ramp(t, end - 1, 4);
            const sd = t - at;
            const slash = sd >= 0 && sd < 7;
            const reach = OUT(ramp(sd, 0, 3));
            const fade = ramp(sd, 2, 5);
            const wordY = 0.56 * H;
            return (
              <div key={`hit-${h.label}`}>
                {[3, 0].map((lag) => {
                  const pp = SLAM(ramp(t - lag, start, SLAM_LEN));
                  if (lag > 0 && t > at + lag) return null;
                  return (
                    <div
                      key={lag}
                      style={{
                        position: "absolute",
                        left: 0,
                        width: W,
                        top: wordY - hitWordFs * 0.6,
                        height: hitWordFs * 1.2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: `translateX(${(1 - (lag ? pp : p)) * 120 * u - out * 60 * u}px) scale(${interpolate(lag ? pp : p, [0, 1], [1.6, 1])})`,
                        opacity:
                          ramp(t - lag, start, 2) *
                          (1 - out) *
                          (lag ? 0.22 : 1),
                        fontFamily: chakraItalic,
                        fontStyle: "italic",
                        fontWeight: 500,
                        fontSize: hitWordFs,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        color: c.ink,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.label}
                    </div>
                  );
                })}
                {slash ? (
                  <svg
                    width={W}
                    height={H}
                    style={{ position: "absolute", inset: 0 }}
                    aria-hidden
                  >
                    <g
                      transform={`translate(${W / 2} ${wordY}) rotate(-16)`}
                      opacity={1 - fade}
                    >
                      <path
                        d={`M${-0.42 * W * reach} 0 L0 ${-5 * u} L${0.42 * W * reach} 0 L0 ${5 * u} Z`}
                        fill={theme === "dark" ? "#FFFFFF" : accent}
                      />
                      <path
                        d={`M${-0.3 * W * reach} ${26 * u} L0 ${24 * u} L${0.3 * W * reach} ${26 * u} L0 ${28 * u} Z`}
                        fill={RISE[1]}
                      />
                    </g>
                  </svg>
                ) : null}
              </div>
            );
          })}

          {/* DEFEATED. */}
          {t >= defeatAt
            ? [4, 2, 0].map((lag) => {
                const pp = SLAM(ramp(t - lag, defeatAt, DEFEAT_LEN));
                if (lag > 0 && t > defeatHit + lag) return null;
                return (
                  <div
                    key={`def-${lag}`}
                    style={{
                      position: "absolute",
                      left: 0,
                      width: W,
                      top: defeatY - defeatFs * 0.6,
                      height: defeatFs * 1.2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${interpolate(lag ? pp : defeatP, [0, 1], [2.4, 1])})`,
                      opacity:
                        ramp(t - lag, defeatAt, 2) *
                        (lag ? 0.18 / (lag / 2) : 1),
                    }}
                  >
                    <div
                      style={{
                        fontFamily: chakraItalic,
                        fontStyle: "italic",
                        fontWeight: 500,
                        fontSize: defeatFs,
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                        paddingRight: 0.06 * defeatFs,
                        whiteSpace: "nowrap",
                        backgroundImage: c.word,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {defeated}
                    </div>
                  </div>
                );
              })
            : null}
        </div>

        {/* Logo. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: 0.8 * H,
            display: "flex",
            justifyContent: "center",
            opacity: logoP,
            transform: `translateY(${(1 - logoP) * 16 * u}px)`,
          }}
        >
          <RemocnLogo fontSize={34 * u} color={c.ink} />
        </div>
      </div>
    </AbsoluteFill>
  );
}
