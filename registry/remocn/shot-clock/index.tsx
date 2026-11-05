"use client";

import { loadFont } from "@remotion/google-fonts/AzeretMono";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: mono } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface ShotClockProps {
  /** Seconds on the clock when it starts. Whole seconds, then tenths below `tenthsBelow`. */
  from?: number;
  /** Below this many seconds the clock shows tenths and turns red. */
  tenthsBelow?: number;
  /** The big word that slams in at the buzzer. Set in caps. */
  title?: string;
  /** The line under it. */
  subtitle?: string;
  /** Small label over the clock, left. */
  label?: string;
  /** Small label over the clock, right. */
  period?: string;
  /** Colour of the last seconds and the buzzer light. */
  alarm?: string;
  /** The live marker next to the period label. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (internal clock = frame + 2, 30fps, speed 1, from 24):
//   0–9    "24" drops in; the light bar over it and the possession bar under
//          it draw out from the centre, labels fade up
//  14–64   the whole seconds tick down, one every 2.6 frames, while the clock
//          pushes in slowly (7% by the buzzer)
//  64      "5.0": the clock turns red with a kick and starts counting tenths,
//          one per frame; the possession bar runs out with it
// 114      0.0, the buzzer: the frame flashes with the "rise" gradient, the
//          light bar goes solid red and stays lit; the 0.0 holds 6 frames
// 120–131  the clock shrinks up under the light; the title slams in at the
//          centre as it clears, the subtitle four frames after it
// 135–     poster hold
const DROP_AT = 0;
const TICK_AT = 14;
const TICK = 2.6;
const TENTH = 1;
const SHRINK_DELAY = 6;
const SHRINK_LEN = 11;

const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "rise": bg #030306, #fff1e2 #ff8a3d #a3301a #2a0d0a.
const RISE = ["#FFF1E2", "#FF8A3D", "#A3301A", "#2A0D0A"] as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    dim: "#86858C",
    track: "#1C1C20",
    flashOp: 1,
    titleFill: `linear-gradient(180deg, ${RISE[0]} 8%, ${RISE[1]} 55%, #E0502A 100%)`,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    track: "#E2E0D9",
    flashOp: 0.9,
    titleFill: `linear-gradient(180deg, ${RISE[1]} 0%, #E0502A 50%, ${RISE[2]} 100%)`,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A short hit: up in 1 frame, eases back over `len`. */
function kick(d: number, len: number) {
  if (d < 0 || d > len + 1) return 0;
  if (d < 1) return d;
  const k = 1 - (d - 1) / len;
  return k * k;
}

export function ShotClock({
  from = 24,
  tenthsBelow = 5,
  title = "Shipped",
  subtitle = "at the buzzer",
  label = "Shot clock",
  period = "Q4 · 00:24",
  alarm = "#FF4433",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ShotClockProps) {
  // Starts two frames in, so frame 0 already shows the drop.
  const t = useCurrentFrame() * speed + 2;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const start = Math.max(tenthsBelow + 1, Math.floor(from));
  const wholeTicks = start - tenthsBelow;
  const redAt = TICK_AT + wholeTicks * TICK;
  const buzzAt = redAt + tenthsBelow * 10 * TENTH;

  // Clock value in tenths of a second.
  let tenths: number;
  if (t < TICK_AT) tenths = start * 10;
  else if (t < redAt) tenths = (start - Math.floor((t - TICK_AT) / TICK)) * 10;
  else tenths = Math.max(0, tenthsBelow * 10 - Math.floor((t - redAt) / TENTH));
  const red = t >= redAt;
  const buzzed = t >= buzzAt;
  const text = red
    ? `${Math.floor(tenths / 10)}.${tenths % 10}`
    : `${Math.round(tenths / 10)}`;

  // Possession bar: continuous, so it runs smoothly between ticks.
  const remaining = interpolate(
    t,
    [TICK_AT, redAt, buzzAt],
    [start, tenthsBelow, 0],
    CLAMP,
  );
  const barFrac = remaining / start;

  // ── Layout ────────────────────────────────────────────────────────────────
  const clockFs = 380 * u;
  const blockW = 820 * u;
  const cx = W / 2;
  const clockCY = H / 2 + 14 * u;
  const lightY = clockCY - 0.5 * clockFs - 34 * u;
  const barY = clockCY + 0.5 * clockFs + 18 * u;

  const drop = SLAM(ramp(t, DROP_AT, 9));
  const draw = SLAM(ramp(t, DROP_AT + 2, 12));
  const labelsIn = ramp(t, 5, 8);
  const redKick = kick(t - redAt, 8);
  const buzzKick = kick(t - buzzAt, 10);
  const flash = buzzed ? kick(t - buzzAt, 9) : 0;

  // Shrink to the poster position under the light.
  const shrink = MOVE(ramp(t, buzzAt + SHRINK_DELAY, SHRINK_LEN));
  const posterScale = 0.38;
  const posterCY = 150 * u;
  // A slow push-in while the clock runs down builds the pressure.
  const push = Easing.bezier(
    0.65,
    0,
    0.35,
    1,
  )(ramp(t, TICK_AT, buzzAt - TICK_AT));
  const groupScale =
    interpolate(shrink, [0, 1], [1 + 0.07 * push, posterScale]) *
    (1 + 0.03 * redKick + 0.04 * buzzKick);
  const groupDY = interpolate(shrink, [0, 1], [0, posterCY - clockCY]);
  const sideFade = 1 - ramp(shrink, 0, 0.4);

  const titleAt = buzzAt + SHRINK_DELAY + SHRINK_LEN - 4;
  const titleIn = SLAM(ramp(t, titleAt, 7));
  const subIn = SLAM(ramp(t, titleAt + 4, 9));
  const titleHit = kick(t - (titleAt + 3), 8);

  const clockColor = red ? alarm : c.ink;
  const lightOn = buzzed;

  const chars = text.split("");

  const smallLabel: React.CSSProperties = {
    fontFamily: mono,
    fontWeight: 400,
    fontSize: 17 * u,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: c.dim,
  };

  // Rise ground, lingering after the buzzer.
  const ground = [
    `radial-gradient(70% 55% at 50% 108%, color-mix(in oklab, ${RISE[1]} 55%, transparent) 0%, transparent 70%)`,
    `radial-gradient(45% 35% at 50% 100%, color-mix(in oklab, ${RISE[0]} 35%, transparent) 0%, transparent 70%)`,
    `radial-gradient(90% 70% at 50% 115%, color-mix(in oklab, ${RISE[2]} 70%, transparent) 0%, transparent 80%)`,
  ].join(", ");
  const groundOp = (theme === "dark" ? 0.75 : 0.45) * ramp(t, buzzAt, 6);

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: ground,
          opacity: groundOp,
        }}
      />

      {/* Clock group: light, labels, digits, possession bar. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${groupDY}px) scale(${groupScale})`,
          transformOrigin: `${cx}px ${clockCY}px`,
        }}
      >
        {/* Buzzer light. */}
        <div
          style={{
            position: "absolute",
            left: cx - (blockW / 2) * draw,
            top: lightY,
            width: blockW * draw,
            height: 14 * u,
            background: lightOn ? alarm : c.track,
          }}
        />
        <div
          style={{
            ...smallLabel,
            position: "absolute",
            left: cx - blockW / 2,
            top: lightY - 40 * u,
            opacity: labelsIn * sideFade,
          }}
        >
          {label}
        </div>
        <div
          style={{
            ...smallLabel,
            position: "absolute",
            right: W - (cx + blockW / 2),
            top: lightY - 40 * u,
            opacity: labelsIn * sideFade,
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
          }}
        >
          <div
            style={{
              width: 8 * u,
              height: 8 * u,
              background: accent,
              opacity: buzzed ? 0 : Math.floor(t / 15) % 2 === 0 ? 1 : 0.35,
            }}
          />
          {period}
        </div>

        {/* Digits. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: clockCY - clockFs / 2,
            height: clockFs,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: mono,
            fontWeight: 500,
            fontSize: clockFs,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: clockColor,
            transform: `translateY(${-(1 - drop) * 90 * u}px)`,
            opacity: drop,
          }}
        >
          {chars.map((ch, i) =>
            ch === "." ? (
              <span
                key={i}
                style={{
                  width: "0.42em",
                  display: "inline-flex",
                  justifyContent: "center",
                }}
              >
                .
              </span>
            ) : (
              <span key={i} style={{ display: "inline-block" }}>
                {ch}
              </span>
            ),
          )}
        </div>

        {/* Possession bar, running out towards the centre. */}
        <div
          style={{
            position: "absolute",
            left: cx - (blockW / 2) * draw,
            top: barY,
            width: blockW * draw,
            height: 6 * u,
            background: c.track,
            opacity: sideFade,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: cx - (blockW / 2) * draw * barFrac,
            top: barY,
            width: blockW * draw * barFrac,
            height: 6 * u,
            background: red ? alarm : c.ink,
            opacity: sideFade,
          }}
        />
      </div>

      {/* Title. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H / 2 - 120 * u,
          display: "flex",
          justifyContent: "center",
          opacity: ramp(titleIn, 0, 0.25),
          transform: `scale(${(1.22 - 0.22 * titleIn) * (1 + 0.025 * titleHit)})`,
          transformOrigin: `${cx}px ${100 * u}px`,
        }}
      >
        <div
          style={{
            fontFamily: mono,
            fontWeight: 500,
            fontSize: 176 * u,
            lineHeight: 1.15,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            backgroundImage: c.titleFill,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H / 2 + 112 * u,
          display: "flex",
          justifyContent: "center",
          fontFamily: mono,
          fontWeight: 400,
          fontSize: 46 * u,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: c.ink,
          whiteSpace: "nowrap",
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 36 * u}px)`,
        }}
      >
        {subtitle}
      </div>

      {/* Buzzer flash. */}
      {flash > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(120% 90% at 50% 100%, ${RISE[0]} 0%, ${RISE[1]} 38%, ${RISE[2]} 72%, ${RISE[3]} 100%)`,
            opacity: flash * c.flashOp,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
