"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Saira";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: saira } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: sairaItalic } = loadFont("italic", {
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

/** Role badge: a hexagon with two rank-up chevrons. */
function RoleGlyph({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <path
        d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z"
        fill="none"
        stroke={color}
        strokeWidth="6.5"
        strokeLinejoin="miter"
      />
      <path
        d="M29 55 L50 36 L71 55 M29 73 L50 54 L71 73"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="square"
      />
    </svg>
  );
}

export interface PlayOfTheGameProps {
  /** The banner call that slices in first. */
  title?: string;
  /** Small role label under the player (the player is always the remocn logo). */
  role?: string;
  /** The highlight stat, flashed in on its own plate. */
  stat?: string;
  /** The part of the stat filled with the gradient. Must appear inside `stat`. */
  highlight?: string;
  /** Small markers: the role tick. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (internal clock = frame + 4, 30fps, speed 1):
//   0–12   angled "swirl" light bars streak in from the left and park at the
//          frame edges
//   3–10   the angled banner slices open left to right behind a hot edge; the
//          title slides in inside it
//  18–23   the player (the logo) slams in from 1.5× with echoes; frame 23 is
//          the impact (white flash, shake); the role badge slams 2f later
//  28–36   role label wipes in under the player
//  38–45   the stat plate flashes twice, then holds with the gradient word
//  44–62   wide light bars sweep across behind everything; poster hold
const BARS_LEN = 12;
const BANNER_AT = 3;
const BANNER_LEN = 7;
const NAME_AT = 18;
const NAME_LEN = 5;
const GLYPH_AT = 20;
const ROLE_AT = 28;
const STAT_AT = 38;
const SWEEP_AT = 44;
const SWEEP_LEN = 18;

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.6, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "swirl": bg #07060a, [#ffe2c4, #ff9a4d, #d2456b, #3a1f6b].
const SWIRL = ["#FFE2C4", "#FF9A4D", "#D2456B", "#3A1F6B"] as const;
const BANNER = `linear-gradient(100deg, ${SWIRL[3]} 0%, ${SWIRL[2]} 34%, ${SWIRL[1]} 72%, #FFB676 100%)`;
const BAR = `linear-gradient(180deg, ${SWIRL[0]} 0%, ${SWIRL[1]} 30%, ${SWIRL[2]} 62%, ${SWIRL[3]} 100%)`;
const WORD = `linear-gradient(100deg, ${SWIRL[1]} 0%, #F06A5A 50%, ${SWIRL[2]} 100%)`;

const THEMES = {
  dark: {
    stage: "#08080A",
    ink: "#F3F2EF",
    dim: "#8A8990",
    plate: "#17161B",
    plateEdge: "#2A2830",
    plateInk: "#F3F2EF",
    flash: "#FFF4EA",
    word: WORD,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    plate: "#121214",
    plateEdge: "#121214",
    plateInk: "#F3F2EF",
    flash: "#121214",
    word: WORD,
  },
} as const;

// Parked bars, as fractions of the width at mid-height.
const BARS = [
  { x: 0.03, w: 52, delay: 0 },
  { x: 0.082, w: 14, delay: 2 },
  { x: 0.108, w: 5, delay: 3 },
  { x: 0.885, w: 6, delay: 1 },
  { x: 0.91, w: 16, delay: 3 },
  { x: 0.965, w: 60, delay: 2 },
];
// Wide translucent bars for the late sweep.
const SWEEP = [
  { off: 0, w: 120, op: 1 },
  { off: 0.12, w: 26, op: 1 },
  { off: 0.2, w: 64, op: 1 },
  { off: 0.27, w: 8, op: 1 },
];

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** Decaying camera shake that starts at `at`, stepped per frame. */
function shake(t: number, at: number, len: number, amp: number) {
  const d = Math.floor(t - at);
  if (d < 0 || d >= len) return { x: 0, y: 0 };
  const k = (1 - d / len) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.4 + 0.6),
    y: amp * 0.6 * k * Math.cos(d * 3.1 + 0.3),
  };
}

export function PlayOfTheGame({
  title = "Play of the game",
  role = "Solo builder",
  stat = "Shipped in 6 hours",
  highlight = "6 hours",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: PlayOfTheGameProps) {
  const t = useCurrentFrame() * speed + 4;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const SLANT = Math.tan((14 * Math.PI) / 180);
  /** Full-height slanted bar centred on x at mid-height. */
  const barPoly = (x: number, w: number) => {
    const l = (H / 2) * SLANT;
    return `polygon(${x - w / 2 + l}px 0, ${x + w / 2 + l}px 0, ${x + w / 2 - l}px ${H}px, ${x - w / 2 - l}px ${H}px)`;
  };

  // ── Impact ────────────────────────────────────────────────────────────────
  const hitAt = NAME_AT + NAME_LEN;
  const sh = shake(t, hitAt, 11, 14 * u);
  const sh2 = shake(t, STAT_AT + 6, 6, 5 * u);
  const flash = t >= hitAt && t < hitAt + speed ? 1 : 0;

  // ── Banner ────────────────────────────────────────────────────────────────
  const banH = 128 * u;
  const banW = 0.8 * W;
  const banX = (W - banW) / 2;
  const banY = 0.12 * H;
  const banLean = banH * SLANT;
  const banP = OUT(ramp(t, BANNER_AT, BANNER_LEN));
  const titleP = OUT(ramp(t, BANNER_AT + 2, 14));
  const banEdge = banX - banLean + banP * (banW + 2 * banLean);
  const banTitleFs = 94 * u;

  // ── Player row ────────────────────────────────────────────────────────────
  const logoFs = 204 * u;
  const rowCy = 0.465 * H;
  const glyphSize = 150 * u;
  const nameScale = (d: number) => 1.5 - 0.5 * SLAM(ramp(d, NAME_AT, NAME_LEN));
  const glyphP = SLAM(ramp(t, GLYPH_AT, NAME_LEN));
  const roleP = OUT(ramp(t, ROLE_AT, 9));

  // ── Stat plate ────────────────────────────────────────────────────────────
  const statFs = 64 * u;
  const plateH = 108 * u;
  const plateY = 0.8 * H;
  const sd = t - STAT_AT;
  const blink =
    sd < 0
      ? "off"
      : sd < 2
        ? "flash"
        : sd < 4
          ? "off"
          : sd < 6
            ? "flash"
            : "on";
  const statP = OUT(ramp(t, STAT_AT, 12));
  const hiAt = stat.toLowerCase().indexOf(highlight.toLowerCase());
  const before = hiAt >= 0 ? stat.slice(0, hiAt) : stat;
  const hi = hiAt >= 0 ? stat.slice(hiAt, hiAt + highlight.length) : "";
  const after = hiAt >= 0 ? stat.slice(hiAt + highlight.length) : "";
  const plateW = Math.min(0.8 * W, (stat.length * 0.62 + 2.6) * statFs);
  const plateLean = plateH * SLANT;

  const sweep = INOUT(ramp(t, SWEEP_AT, SWEEP_LEN));

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${sh.x + sh2.x}px, ${sh.y + sh2.y}px)`,
        }}
      >
        {/* Late sweep: wide light bars pass behind everything. */}
        {sweep > 0 && sweep < 1
          ? SWEEP.map((b) => {
              const x = interpolate(
                sweep,
                [0, 1],
                [-0.25 * W - b.off * W, 1.3 * W - b.off * W],
              );
              return (
                <div
                  key={b.off}
                  style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: barPoly(x, b.w * u),
                    background: BAR,
                    opacity: b.op,
                  }}
                />
              );
            })
          : null}

        {/* Parked bars at the frame edges, streaking in at the start. */}
        {BARS.map((b) => {
          const p = OUT(ramp(t, b.delay, BARS_LEN - 2));
          const x = interpolate(p, [0, 1], [-0.3 * W, b.x * W]);
          return (
            <div
              key={b.x}
              style={{
                position: "absolute",
                inset: 0,
                clipPath: barPoly(x, b.w * u * (1 + 1.4 * (1 - p))),
                background: BAR,
                opacity: p > 0 ? 1 : 0,
              }}
            />
          );
        })}

        {/* Banner: slices open behind a hot edge. */}
        {banP > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: banY,
              width: W,
              height: banH,
              clipPath: `polygon(${banX + banLean}px 0, ${Math.min(banEdge + banLean, banX + banW + banLean)}px 0, ${Math.min(banEdge - banLean, banX + banW - banLean)}px 100%, ${banX - banLean}px 100%)`,
            }}
          >
            <div
              style={{ position: "absolute", inset: 0, background: BANNER }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                width: W,
                top: 0,
                height: banH,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateX(${(1 - titleP) * -60 * u}px)`,
                opacity: titleP,
                fontFamily: sairaItalic,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: banTitleFs,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                paddingTop: 4 * u,
              }}
            >
              {title}
            </div>
            {banP < 1 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: `polygon(${banEdge + banLean - 18 * u}px 0, ${banEdge + banLean}px 0, ${banEdge - banLean}px 100%, ${banEdge - banLean - 18 * u}px 100%)`,
                  background: SWIRL[0],
                }}
              />
            ) : null}
          </div>
        ) : null}

        {/* Player row: role badge + the logo. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: rowCy - logoFs * 0.5,
            height: logoFs,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40 * u,
          }}
        >
          <div
            style={{
              width: glyphSize,
              height: glyphSize,
              opacity: ramp(t, GLYPH_AT, 2),
              transform: `rotate(${(1 - glyphP) * -40}deg) scale(${1.4 - 0.4 * glyphP})`,
            }}
          >
            <RoleGlyph size={glyphSize} color={c.ink} />
          </div>
          <div style={{ position: "relative" }}>
            {[4, 2, 0].map((lag) => {
              const ghost = lag > 0;
              if (ghost && t >= hitAt + lag) return null;
              const tt = t - lag;
              const op = ramp(tt, NAME_AT, 2) * (ghost ? 0.2 / lag : 1);
              return (
                <div
                  key={lag}
                  style={{
                    position: ghost ? "absolute" : "relative",
                    left: 0,
                    top: 0,
                    transform: `scale(${nameScale(tt)})`,
                    opacity: op,
                    paddingTop: logoFs * 0.04,
                  }}
                >
                  <RemocnLogo fontSize={logoFs} color={c.ink} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Role label under the player. */}
        {roleP > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: rowCy + logoFs * 0.5,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14 * u,
              clipPath: `inset(-30% ${50 - 50 * roleP}% -30% ${50 - 50 * roleP}%)`,
              fontFamily: saira,
              fontWeight: 500,
              fontSize: 22 * u,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: c.dim,
            }}
          >
            <div
              style={{
                width: 26 * u,
                height: 5 * u,
                background: accent,
                transform: "skewX(-14deg)",
              }}
            />
            {role}
            <div
              style={{
                width: 26 * u,
                height: 5 * u,
                background: accent,
                transform: "skewX(-14deg)",
              }}
            />
          </div>
        ) : null}

        {/* Stat plate: two flashes, then holds. */}
        {blink !== "off" ? (
          <div
            style={{
              position: "absolute",
              left: (W - plateW) / 2,
              top: plateY - plateH / 2,
              width: plateW,
              height: plateH,
              clipPath: `polygon(${plateLean}px 0, 100% 0, calc(100% - ${plateLean}px) 100%, 0 100%)`,
              background: blink === "flash" ? c.flash : c.plate,
              boxShadow: `inset 0 0 0 ${2 * u}px ${c.plateEdge}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                transform: `translateX(${(1 - statP) * 30 * u}px)`,
                fontFamily: sairaItalic,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: statFs,
                lineHeight: 1,
                letterSpacing: "0.01em",
                textTransform: "uppercase",
                color: blink === "flash" ? c.stage : c.plateInk,
                whiteSpace: "pre",
                paddingTop: 3 * u,
              }}
            >
              <span>{before}</span>
              <span
                style={{
                  backgroundImage: blink === "flash" ? undefined : c.word,
                  WebkitBackgroundClip: blink === "flash" ? undefined : "text",
                  backgroundClip: blink === "flash" ? undefined : "text",
                  color: blink === "flash" ? c.stage : "transparent",
                  paddingRight: 4 * u,
                }}
              >
                {hi}
              </span>
              <span>{after}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Impact flash. */}
      {flash > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: theme === "dark" ? "#FFFFFF" : SWIRL[0],
            opacity: 0.9 * flash,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
