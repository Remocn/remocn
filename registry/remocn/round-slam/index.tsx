"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Unbounded";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
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

export interface RoundSlamProps {
  /** The round call, slammed in first in two hits ("ROUND" then "1"). */
  round?: string;
  /** The finisher word, punched in bigger and cracked open by the slashes. */
  call?: string;
  /** One of the thin speed slashes. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1):
//   0–6    "ROUND" slams in from 1.9× with two echo ghosts; small shake on landing
//   6–12   the round number slams in from 2.6×; frame 12 is the impact frame
//          (one inverted frame) and the camera shakes for 10 frames
//  12–34   hold with a slow push
//  34–43   the round call ducks up to a label above the stage
//  38–44   the call word punches in from 2.8×; frame 44 is the second impact:
//          inverted frame, bigger shake, the word splits along a diagonal crack
//  44–53   speed slashes crack outward from the centre, the main "chrome" band
//          opens behind the word
//  56–66   the logo rises in under the band; poster hold to the end
const ROUND_AT = 0;
const ROUND_LEN = 6;
const NUM_AT = 6;
const NUM_LEN = 6;
const DUCK_AT = 34;
const DUCK_LEN = 9;
const CALL_AT = 38;
const CALL_LEN = 6;
const LOGO_AT = 56;

// Steep cuts slashed through the band, outside the word.
const CUTS = [
  { x: -0.43, w: 22, delay: 0 },
  { x: -0.385, w: 7, delay: 1 },
  { x: 0.4, w: 14, delay: 2 },
];

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.65, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "chrome": bg #050203, [#e0202e, #ffd6b8, #4fe3f0].
const CHROME = ["#E0202E", "#FFD6B8", "#4FE3F0"] as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    dim: "#8A8990",
    slashA: CHROME[2],
    slashB: CHROME[1],
    logo: "#F3F2EF",
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    slashA: "#1F8FA0",
    slashB: CHROME[0],
    logo: "#121214",
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** Decaying camera shake that starts at `at`, stepped per frame like a game hit-stop. */
function shake(t: number, at: number, len: number, amp: number) {
  const d = Math.floor(t - at);
  if (d < 0 || d >= len) return { x: 0, y: 0 };
  const k = (1 - d / len) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.4 + 0.6),
    y: amp * 0.6 * k * Math.cos(d * 3.1 + 0.3),
  };
}

/**
 * A slash with pointed tips, running along the x axis of the (rotated) stage.
 * `reach` is how far it has cracked out from the centre, 0–1.
 */
function slashPoly(
  cx: number,
  cy: number,
  thick: number,
  half: number,
  reach: number,
  tip: number,
) {
  const r = half * reach;
  const top = cy - thick / 2;
  const bot = cy + thick / 2;
  return `polygon(${cx - r - tip}px ${cy}px, ${cx - r}px ${top}px, ${cx + r}px ${top}px, ${cx + r + tip}px ${cy}px, ${cx + r}px ${bot}px, ${cx - r}px ${bot}px)`;
}

export function RoundSlam({
  round = "ROUND 1",
  call = "SHIP!",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RoundSlamProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const words = round.trim().split(/\s+/);
  const head = words.length > 1 ? words.slice(0, -1).join(" ") : round;
  const tail = words.length > 1 ? words[words.length - 1] : "";

  // ── Impact frames ─────────────────────────────────────────────────────────
  const numHit = NUM_AT + NUM_LEN;
  const callHit = CALL_AT + CALL_LEN;
  const inverted =
    (t >= numHit && t < numHit + speed) ||
    (t >= callHit && t < callHit + speed);
  const s1 = shake(t, ROUND_AT + ROUND_LEN, 5, 5 * u);
  const s2 = shake(t, numHit, 10, 13 * u);
  const s3 = shake(t, callHit, 14, 20 * u);
  const camX = s1.x + s2.x + s3.x;
  const camY = s1.y + s2.y + s3.y;
  const push = interpolate(t, [numHit, DUCK_AT], [1, 1.035], CLAMP);
  const settle = interpolate(t, [callHit, callHit + 70], [1, 1.025], CLAMP);

  // ── Round call ────────────────────────────────────────────────────────────
  const roundFs = 150 * u;
  const roundScale = (d: number) =>
    1.9 - 0.9 * SLAM(ramp(d, ROUND_AT, ROUND_LEN));
  const numScale = (d: number) => 2.6 - 1.6 * SLAM(ramp(d, NUM_AT, NUM_LEN));
  const duck = INOUT(ramp(t, DUCK_AT, DUCK_LEN));
  const roundY = interpolate(duck, [0, 1], [0.5 * H, 0.205 * H]);
  const roundK = interpolate(duck, [0, 1], [push, 0.36]);

  // ── Call word and the band ────────────────────────────────────────────────
  const callFs = 250 * u;
  const callY = 0.54 * H;
  const callScale = (d: number) => 2.8 - 1.8 * SLAM(ramp(d, CALL_AT, CALL_LEN));
  const callOp = ramp(t, CALL_AT, 3);
  const crack = Math.max(0, 1 - Math.max(0, t - callHit) / 9);
  const crackOff = t >= callHit ? 30 * u * crack * crack : 0;

  const half = 0.72 * W;
  const bandOpen = OUT(ramp(t, callHit + 1, 9));
  const bandThick = interpolate(bandOpen, [0, 1], [6 * u, 0.4 * H]);
  const bandReach = OUT(ramp(t, callHit, 5));
  const drift = interpolate(t, [callHit, callHit + 80], [0, 10], CLAMP);

  const slashes = [
    { dy: -0.27 * H, thick: 7 * u, delay: 0, fill: c.slashA },
    { dy: -0.235 * H, thick: 3 * u, delay: 2, fill: accent },
    { dy: 0.24 * H, thick: 11 * u, delay: 1, fill: c.slashB },
    { dy: 0.275 * H, thick: 3 * u, delay: 3, fill: c.slashA },
  ];

  const bandGround = [
    `radial-gradient(38% 55% at ${30 + drift}% 34%, ${CHROME[1]}e6 0%, transparent 62%)`,
    `radial-gradient(55% 80% at ${68 - drift}% 68%, #FF3B4Acc 0%, transparent 70%)`,
    `linear-gradient(100deg, #4A0610 4%, ${CHROME[0]} 30%, #C0142A 64%, #2E0410 96%)`,
  ].join(", ");

  const logoP = OUT(ramp(t, LOGO_AT, 10));

  const word = (
    text: string,
    fs: number,
    color: string,
    extra?: React.CSSProperties,
  ) => (
    <div
      style={{
        fontFamily: display,
        fontWeight: 500,
        fontSize: fs,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        color,
        whiteSpace: "nowrap",
        ...extra,
      }}
    >
      {text}
    </div>
  );

  // The call word, sliced on a diagonal so the two halves can crack apart.
  const cutTop = `polygon(0 0, 100% 0, 100% 38%, 0 62%)`;
  const cutBot = `polygon(0 62%, 100% 38%, 100% 100%, 0 100%)`;
  const callBox = (scale: number, opacity: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        width: W,
        top: callY - callFs * 0.6,
        height: callFs * 1.2,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {(crackOff > 0.01 ? [cutTop, cutBot] : ["none"]).map((clip, i) => (
        <div
          key={clip}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            clipPath: clip === "none" ? undefined : clip,
            transform: `translateX(${i === 0 ? crackOff : -crackOff}px)`,
          }}
        >
          {word(
            call,
            callFs,
            theme === "dark" ? "#FFFFFF" : bandOpen > 0.5 ? "#FFFFFF" : c.ink,
            {
              paddingTop: callFs * 0.06,
            },
          )}
        </div>
      ))}
    </div>
  );

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
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${camX}px, ${camY}px) rotate(-6deg) scale(${settle})`,
            transformOrigin: "50% 50%",
          }}
        >
          {/* The chrome band and slashes crack open behind the call word. */}
          {t >= callHit ? (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: `${-0.2 * H}px ${-0.2 * W}px`,
                  clipPath: slashPoly(
                    W / 2 + 0.2 * W,
                    callY + 0.2 * H,
                    bandThick,
                    half,
                    bandReach,
                    bandThick * 0.9,
                  ),
                  background: bandGround,
                }}
              />
              {CUTS.map((k) => {
                const x = W / 2 + k.x * W;
                const top = callY - bandThick / 2 - 2;
                const bot = callY + bandThick / 2 + 2;
                const lean = 0.32 * bandThick;
                const w = k.w * u;
                const p = OUT(ramp(t, callHit + 2 + k.delay, 5));
                const yEnd = top + (bot - top) * p;
                const xAt = (y: number) =>
                  x + lean - ((y - top) / (bot - top)) * 2 * lean;
                return (
                  <div
                    key={k.x}
                    style={{
                      position: "absolute",
                      inset: 0,
                      clipPath: `polygon(${xAt(top)}px ${top}px, ${xAt(top) + w}px ${top}px, ${xAt(yEnd) + w}px ${yEnd}px, ${xAt(yEnd)}px ${yEnd}px)`,
                      background: c.stage,
                    }}
                  />
                );
              })}
              {slashes.map((s) => {
                const reach = OUT(ramp(t, callHit + s.delay, 6));
                return (
                  <div
                    key={s.dy}
                    style={{
                      position: "absolute",
                      inset: 0,
                      clipPath: slashPoly(
                        W / 2,
                        callY + s.dy,
                        s.thick,
                        half,
                        reach,
                        60 * u,
                      ),
                      background: s.fill,
                    }}
                  />
                );
              })}
            </>
          ) : null}

          {/* Round call: echoes trail the slam, then it ducks to a label. */}
          {[4, 2, 0].map((lag) => {
            const tt = t - lag;
            const ghost = lag > 0;
            const headK = roundScale(tt);
            const numK = numScale(tt);
            const headOp = ramp(tt, ROUND_AT, 2) * (ghost ? 0.18 / lag : 1);
            const numOp = ramp(tt, NUM_AT, 2) * (ghost ? 0.18 / lag : 1);
            if (ghost && t > numHit + lag) return null;
            return (
              <div
                key={lag}
                style={{
                  position: "absolute",
                  left: 0,
                  width: W,
                  top: roundY - roundFs * 0.6,
                  height: roundFs * 1.2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.32 * roundFs,
                  transform: `scale(${ghost ? 1 : roundK})`,
                }}
              >
                {word(head, roundFs, c.ink, {
                  transform: `scale(${headK})`,
                  opacity: headOp,
                  paddingTop: roundFs * 0.06,
                })}
                {tail
                  ? word(tail, roundFs, c.ink, {
                      transform: `scale(${numK})`,
                      opacity: numOp,
                      paddingTop: roundFs * 0.06,
                    })
                  : null}
              </div>
            );
          })}

          {/* Call word with echoes. */}
          {t >= CALL_AT
            ? [4, 2].map((lag) =>
                t < callHit + lag
                  ? callBox(
                      callScale(t - lag),
                      ramp(t - lag, CALL_AT, 3) * (0.2 / lag),
                      `g${lag}`,
                    )
                  : null,
              )
            : null}
          {t >= CALL_AT ? callBox(callScale(t), callOp, "call") : null}
        </div>

        {/* Logo under the band. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: 0.885 * H,
            display: "flex",
            justifyContent: "center",
            opacity: logoP,
            transform: `translateY(${(1 - logoP) * 18 * u}px)`,
          }}
        >
          <RemocnLogo fontSize={34 * u} color={c.logo} />
        </div>
      </div>
    </AbsoluteFill>
  );
}
