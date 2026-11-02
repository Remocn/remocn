"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadPixel } from "@remotion/google-fonts/Silkscreen";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: pixel } = loadPixel("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: geist } = loadGeist("normal", {
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

export interface HighScoreEntry {
  /** Three-letter initials. */
  name: string;
  score: number;
}

export interface HighScoreProps {
  /** The table before the new run, best first. Up to five rows are shown. */
  rows?: HighScoreEntry[];
  /** Initials typed in once the new score lands at the top. */
  player?: string;
  /** The new score. Should beat the current #1. */
  playerScore?: number;
  /** Small table title shown before the flash. */
  title?: string;
  /** The flash that replaces the title once the initials are in. */
  flash?: string;
  /** Small cursor block while the initials are typed. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1):
//   0–26   title and column labels in; five rows slide in from the right, 3f apart
//  22–28   the player band wipes in under the table, "___" and a 0 score
//  28–74   the score races up; each time it passes a row the band jumps a slot
//          and the overtaken row is shoved down (44, 53, 61, 68, 74); the old
//          #5 is shoved off the table and drops away
//  74–86   at #1 the count decelerates to 999,990; 86 is the impact: band flash,
//          small shake, the band opens to full bleed
//  89–97   the initials blink in one letter at a time behind a block cursor
// 102–118  "NEW HIGH SCORE" slams in with the dither gradient and flashes twice;
//          rows 2–5 dim; the logo rises in; poster hold
const ROW_IN = 6;
const ROW_STAGGER = 3;
const BAND_IN = 22;
const RACE_AT = 28;
const PASS = [44, 53, 61, 68, 74];
const MOVE = 6;
const LAND = 86;
const LETTERS_AT = 89;
const LETTER_GAP = 4;
const FLASH_AT = 102;
const LOGO_AT = 118;

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.65, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "dither-field": bg #050505, [#2b3dd8, #ff6a3d, #ffd9a8].
// Used stepped (hard stops) so it reads as an 8-bit ramp.
const DITHER = ["#2B3DD8", "#FF6A3D", "#FFD9A8"] as const;

const THEMES = {
  dark: {
    stage: "#08080A",
    ink: "#F3F2EF",
    dim: "#6E6D74",
    rule: "#1E1E23",
    flashStops: [DITHER[2], DITHER[1], "#8C7BFF"],
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#8E8D86",
    rule: "#E2E0D9",
    flashStops: ["#F0782E", "#E2452A", DITHER[0]],
  },
} as const;

const RANKS = ["1ST", "2ND", "3RD", "4TH", "5TH"];

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function hexToRgb(h: string) {
  const n = Number.parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, k: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** A stepped (hard-stop) ramp across `stops`, `steps` bands. */
function steppedGradient(
  angle: number,
  stops: readonly string[],
  steps: number,
) {
  const parts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const k = i / (steps - 1);
    const seg = Math.min(stops.length - 2, Math.floor(k * (stops.length - 1)));
    const local = k * (stops.length - 1) - seg;
    const col = mix(stops[seg], stops[seg + 1], local);
    parts.push(
      `${col} ${((i / steps) * 100).toFixed(2)}% ${(((i + 1) / steps) * 100).toFixed(2)}%`,
    );
  }
  return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
}

function formatScore(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("en-US");
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

export function HighScore({
  rows = [
    { name: "ACE", score: 870450 },
    { name: "JFK", score: 812300 },
    { name: "MAX", score: 640120 },
    { name: "ZOE", score: 455900 },
    { name: "BOB", score: 310050 },
  ],
  player = "RMC",
  playerScore = 999990,
  title = "HIGH SCORES",
  flash = "NEW HIGH SCORE",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: HighScoreProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const table = rows.slice(0, 5);
  const n = table.length;
  // Overtake times in order: the last row is passed first, #1 last.
  const passes = PASS.slice(PASS.length - n);
  const passAt = (i: number) => passes[n - 1 - i];

  // ── Layout ────────────────────────────────────────────────────────────────
  const fs = 52 * u;
  const cell = fs * 0.76;
  const comma = fs * 0.4;
  const rowH = 74 * u;
  const tableW = 860 * u;
  const x0 = (W - tableW) / 2;
  const top = 0.27 * H;
  const slotY = (pos: number) => top + (pos - 0.5) * rowH;
  const nameX = x0 + 250 * u;

  // ── The race ──────────────────────────────────────────────────────────────
  // Score keyframes: 0 at the start, each row's score at its overtake frame,
  // then a decelerating finish to the player's score.
  const lastPass = passes[n - 1] ?? RACE_AT;
  const keysT = [RACE_AT, ...passes];
  const keysV = [0, ...[...table].reverse().map((r) => r.score)];
  let score: number;
  if (t <= lastPass) {
    score = interpolate(t, keysT, keysV, CLAMP);
  } else {
    score = interpolate(
      t,
      [lastPass, LAND],
      [keysV[keysV.length - 1], playerScore],
      { ...CLAMP, easing: Easing.bezier(0.22, 1, 0.36, 1) },
    );
  }
  score = Math.round(score / 10) * 10;

  // Player slot: starts below the table (n + 1), one slot up per overtake.
  const climbs = passes.map((p) => OUT(ramp(t, p, MOVE)));
  const playerPos = n + 1 - climbs.reduce((a, b) => a + b, 0);
  // Row i (0 = best) is shoved one slot down when the player passes it.
  const rowPos = (i: number) => i + 1 + SLAM(ramp(t, passAt(i), MOVE));

  const land = t >= LAND;
  const sh = shake(t, LAND, 8, 7 * u);
  const impact = land ? Math.max(0, 1 - (t - LAND) / 7) : 0;
  const bleed = INOUT(ramp(t, LAND + 1, 10));
  const dimRest = OUT(ramp(t, FLASH_AT + 2, 12));

  // ── Title swap ────────────────────────────────────────────────────────────
  const titleIn = OUT(ramp(t, 0, 10));
  const titleOut = ramp(t, FLASH_AT - 3, 3);
  const flashIn = SLAM(ramp(t, FLASH_AT, 6));
  const fd = t - FLASH_AT;
  const flashOn =
    t >= FLASH_AT && !(fd >= 9 && fd < 12) && !(fd >= 15 && fd < 18);
  const logoP = OUT(ramp(t, LOGO_AT, 10));
  const push = interpolate(t, [FLASH_AT, FLASH_AT + 60], [1, 1.05], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const pixelText = (
    text: string,
    color: string,
    size = fs,
    extra?: React.CSSProperties,
  ) => (
    <div style={{ display: "flex", ...extra }}>
      {text.split("").map((ch, k) => {
        const isComma = ch === ",";
        return (
          <div
            key={k}
            style={{
              width: isComma ? (comma * size) / fs : (cell * size) / fs,
              textAlign: "center",
              fontFamily: pixel,
              fontWeight: 400,
              fontSize: size,
              lineHeight: 1,
              color,
            }}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );

  const scoreText = (value: string, color: string) =>
    pixelText(value, color, fs, {
      position: "absolute",
      right: x0,
      top: -fs / 2,
    });

  // Initials typed in after the landing, behind a blinking block cursor.
  const typed = Math.max(
    0,
    Math.min(player.length, Math.floor((t - LETTERS_AT) / LETTER_GAP) + 1),
  );
  const cursorOn =
    t >= LETTERS_AT - 6 && typed < player.length && Math.floor(t / 3) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${sh.x}px, ${sh.y}px) scale(${push})`,
          transformOrigin: "50% 40%",
        }}
      >
        {/* Title: the small table title, swapped for the flash. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: 0.12 * H,
            display: "flex",
            justifyContent: "center",
            opacity: titleIn * (1 - titleOut),
            transform: `translateY(${(1 - titleIn) * 12 * u}px) scaleY(${1 - titleOut})`,
          }}
        >
          {pixelText(title, c.ink, 30 * u, { letterSpacing: 0 })}
        </div>
        {t >= FLASH_AT ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: 0.12 * H - 24 * u,
              display: "flex",
              justifyContent: "center",
              transform: `scale(${interpolate(flashIn, [0, 1], [1.45, 1])})`,
              opacity: flashOn ? ramp(t, FLASH_AT, 2) : 0,
            }}
          >
            <div
              style={{
                fontFamily: pixel,
                fontWeight: 400,
                fontSize: 76 * u,
                lineHeight: 1,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
                backgroundImage: steppedGradient(90, c.flashStops, 12),
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {flash}
            </div>
          </div>
        ) : null}

        {/* Column labels. */}
        <div
          style={{
            position: "absolute",
            top: top - 42 * u,
            left: x0,
            width: tableW,
            height: 20 * u,
            fontFamily: geist,
            fontWeight: 500,
            fontSize: 14 * u,
            letterSpacing: "0.22em",
            color: c.dim,
            opacity: OUT(ramp(t, 4, 8)) * (1 - 0.5 * dimRest),
          }}
        >
          <span style={{ position: "absolute", left: 0 }}>RANK</span>
          <span style={{ position: "absolute", left: nameX - x0 }}>NAME</span>
          <span style={{ position: "absolute", right: 0 }}>SCORE</span>
        </div>

        {/* Player band: wipes in under the table and climbs. */}
        {t >= BAND_IN ? (
          <div
            style={{
              position: "absolute",
              top: slotY(playerPos) - rowH / 2 + 4 * u,
              height: rowH - 8 * u,
              left: interpolate(bleed, [0, 1], [x0 - 26 * u, 0]),
              right: interpolate(bleed, [0, 1], [x0 - 26 * u, 0]),
              clipPath: `inset(0 ${(1 - OUT(ramp(t, BAND_IN, 7))) * 100}% 0 0)`,
              backgroundImage: steppedGradient(
                90,
                ["#F25A2E", "#C2456E", DITHER[0]],
                16,
              ),
              boxShadow: `inset 0 ${4 * u}px 0 rgba(255, 217, 168, 0.45), inset 0 ${-4 * u}px 0 rgba(10, 10, 30, 0.28)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#FFFFFF",
                opacity: impact * 0.85,
              }}
            />
          </div>
        ) : null}

        {/* Rank labels, fixed per slot; white where the band covers them. */}
        {table.map((_, k) => {
          const covered = t >= BAND_IN && Math.abs(playerPos - (k + 1)) < 0.5;
          const p = OUT(ramp(t, ROW_IN + k * ROW_STAGGER, 8));
          const dim = covered ? 0 : dimRest;
          return (
            <div
              key={RANKS[k]}
              style={{
                position: "absolute",
                left: x0,
                top: slotY(k + 1) - fs / 2,
                opacity: p * (1 - 0.6 * dim),
                transform: `translateX(${(1 - p) * 60 * u}px)`,
              }}
            >
              {pixelText(RANKS[k], covered ? "#FFFFFF" : c.ink)}
            </div>
          );
        })}

        {/* The other rows: initials + score, shoved down one by one. */}
        {table.map((r, i) => {
          const pos = rowPos(i);
          const p = OUT(ramp(t, ROW_IN + i * ROW_STAGGER, 8));
          const off = OUT(ramp(t, passAt(i) + MOVE, 8));
          const gone = i === n - 1;
          const kickD = t - passAt(i);
          const kick =
            kickD >= 0 && kickD < 8 ? (1 - kickD / 8) ** 2 * 14 * u : 0;
          const y = slotY(pos) + (gone ? off * 30 * u : 0);
          return (
            <div
              key={r.name}
              style={{
                position: "absolute",
                left: 0,
                width: W,
                top: y,
                height: 0,
                opacity: p * (gone ? 1 - off : 1) * (1 - 0.6 * dimRest),
                transform: `translateX(${(1 - p) * 60 * u + kick}px)`,
              }}
            >
              {pixelText(r.name, c.ink, fs, {
                position: "absolute",
                left: nameX,
                top: -fs / 2,
              })}
              {scoreText(formatScore(r.score), c.ink)}
            </div>
          );
        })}

        {/* Player row content. */}
        {t >= BAND_IN ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: slotY(playerPos),
              height: 0,
              opacity: ramp(t, BAND_IN + 3, 3),
            }}
          >
            <div
              style={{
                position: "absolute",
                left: nameX,
                top: -fs / 2,
                display: "flex",
              }}
            >
              {player.split("").map((ch, k) => {
                const shown = k < typed;
                const isCursor = !shown && k === typed && cursorOn;
                return (
                  <div
                    key={k}
                    style={{
                      position: "relative",
                      width: cell,
                      height: fs,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {isCursor ? (
                      <div
                        style={{
                          position: "absolute",
                          left: cell * 0.14,
                          right: cell * 0.14,
                          top: fs * 0.04,
                          bottom: fs * 0.08,
                          background: "#FFFFFF",
                          boxShadow: `0 0 0 ${2 * u}px ${accent}`,
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        fontFamily: pixel,
                        fontWeight: 400,
                        fontSize: fs,
                        lineHeight: 1,
                        color: "#FFFFFF",
                        opacity: shown ? 1 : isCursor ? 0 : 0.55,
                        transform: shown
                          ? `scale(${interpolate(ramp(t, LETTERS_AT + k * LETTER_GAP, 3), [0, 1], [1.35, 1])})`
                          : undefined,
                      }}
                    >
                      {shown ? ch : "_"}
                    </div>
                  </div>
                );
              })}
            </div>
            {scoreText(formatScore(score), "#FFFFFF")}
          </div>
        ) : null}
      </div>

      {/* Logo. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: 0.895 * H,
          display: "flex",
          justifyContent: "center",
          opacity: logoP,
          transform: `translateY(${(1 - logoP) * 16 * u}px)`,
        }}
      >
        <RemocnLogo fontSize={30 * u} color={c.ink} />
      </div>
    </AbsoluteFill>
  );
}
