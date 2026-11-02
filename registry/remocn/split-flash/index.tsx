"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface SplitFlashProps {
  /** The time the clock freezes on, `m:ss.mmm`. Anything else is shown static. */
  time?: string;
  /** Delta that drops in under the frozen time. Pass "" to hide. */
  delta?: string;
  /** Small label above the clock while it runs. */
  label?: string;
  /** Label once the clock freezes. */
  flashLabel?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Geist 500 with tabular figures, per 1000 em (harfbuzz). Digits share one
// advance, so the running clock never shifts.
const DIGIT = 0.612;
const COLON = 0.302;
const DOT = 0.213;
const OTHER = 0.55;
const CAP = 0.71;
const TRACK = -0.028;
/** Left and right side bearings of the digits 0–9, per 1000 em. */
const DIGIT_LSB = [38, 98, 51, 42, 30, 45, 47, 51, 32, 47];
const DIGIT_RSB = [38, 98, 49, 41, 29, 44, 46, 51, 32, 46];

// Beat sheet (30fps, speed 1):
//  0–42    the lap clock runs: tenths roll, the last digits flicker, a thin
//          accent sector line draws under it and the clock creeps closer
//  42–44   the line is crossed: the clock freezes on the final time and the
//          sector line shoots up into a full-bleed purple band behind it
//          ("fastest" purple, gradients.sh void palette); the label flips
//  46–48   the band blinks off for two frames and back on: the timing flash
//  50–59   the delta slides down out from under the band
//  58–     poster hold
const RUN = 42;
const GROW_LEN = 2;
const BLINK_AT = 4;
const BLINK_LEN = 2;
const DELTA_AT = 8;
const DELTA_LEN = 9;

const PUSH = Easing.bezier(0.45, 0, 0.8, 0.5);
const DROP = Easing.bezier(0.2, 0.85, 0.3, 1);
const GROW = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "void": #c9b6ff, #7b4dff, #2c1670.
const VOID = ["#C9B6FF", "#7B4DFF", "#2C1670"] as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    dim: "#77767C",
    line: "#1C1C20",
    flash: VOID[0],
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#8A8983",
    line: "#E2E0DA",
    flash: "#5A35D6",
  },
} as const;

function cell(ch: string) {
  if (ch >= "0" && ch <= "9") return DIGIT + TRACK;
  if (ch === ":") return COLON + TRACK;
  if (ch === ".") return DOT + 0.04 + TRACK;
  return OTHER + TRACK;
}

function parseTime(s: string) {
  const m = /^(\d+):(\d{2})\.(\d{3})$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 60000 + Number(m[2]) * 1000 + Number(m[3]);
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Running clock face for `ms`; the thousandths flicker like a live timer. */
function formatTime(ms: number, frame: number, frozen: boolean) {
  const clamped = Math.max(0, ms);
  const min = Math.floor(clamped / 60000);
  const sec = Math.floor((clamped % 60000) / 1000);
  const milli = Math.floor(clamped % 1000);
  const last = frozen ? milli % 10 : Math.floor(hash(frame) * 10);
  const body = Math.floor(milli / 10) * 10 + last;
  return `${min}:${String(sec).padStart(2, "0")}.${String(body).padStart(3, "0")}`;
}

export function SplitFlash({
  time = "1:12.408",
  delta = "−0.412",
  label = "Lap time",
  flashLabel = "Fastest lap",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SplitFlashProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const finalMs = parseTime(time);
  const frozen = t >= RUN || finalMs === null;
  const face =
    finalMs === null
      ? time
      : formatTime(
          finalMs - (Math.max(0, RUN - t) * 1000) / 30,
          Math.floor(t),
          frozen,
        );

  // Layout from the final face so the running one sits in the same cells.
  const cells = time.split("").map(cell);
  const advance = cells.reduce((a, b) => a + b, 0) - TRACK;
  const first = time[0] ?? "0";
  const lastCh = time[time.length - 1] ?? "0";
  const lsb =
    first >= "0" && first <= "9" ? DIGIT_LSB[Number(first)] / 1000 : 0;
  const rsb =
    lastCh >= "0" && lastCh <= "9" ? DIGIT_RSB[Number(lastCh)] / 1000 : 0;
  const inkEm = advance - lsb - rsb;
  const fs = Math.min((0.8 * W) / inkEm, (0.3 * H) / CAP);
  const cap = CAP * fs;
  const inkW = inkEm * fs;
  const inkL = (W - inkW) / 2;
  const penX = inkL - lsb * fs;

  const bandH = cap * 1.72;
  const deltaFs = 0.36 * fs;
  const labelFs = Math.max(13, 0.021 * W);
  // Block: label, band, delta. Centered with the band slightly above center.
  const bandY = (H - bandH) / 2 - 0.035 * H;
  const baseline = bandY + (bandH + cap) / 2;
  const bandBottom = bandY + bandH;

  const since = t - RUN;
  const bandOn =
    frozen &&
    finalMs !== null &&
    !(since >= BLINK_AT && since < BLINK_AT + BLINK_LEN);
  const progress = finalMs === null ? 1 : Math.min(1, Math.max(0, t / RUN));
  const push = 0.955 + 0.045 * PUSH(progress);
  const drop = DROP(
    interpolate(since, [DELTA_AT, DELTA_AT + DELTA_LEN], [0, 1], CLAMP),
  );

  const lineH = Math.max(3, 0.0065 * H);
  // The band grows up out of the sector line, then blinks.
  const grow = GROW(interpolate(since, [0, GROW_LEN], [0, 1], CLAMP));
  const bandNowH = lineH + (bandH - lineH) * grow;
  // Gentle sheen drift across the band while it holds.
  const drift = interpolate(since, [0, 60], [-0.08, 0.04], CLAMP);
  const onBand = bandOn ? "#F7F5FF" : c.ink;
  const cx = W / 2;
  const cy = bandY + bandH / 2;

  let pen = penX;
  const glyphs = face.split("").map((ch, i) => {
    const x = pen;
    pen += (cells[i] ?? cell(ch)) * fs;
    return { ch, x };
  });

  return (
    <AbsoluteFill style={{ background: c.stage }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={`${frozen ? flashLabel : label} ${time} ${delta}`}
      >
        <defs>
          <linearGradient
            id={`${uid}-band`}
            x1="0"
            y1="0"
            x2="1"
            y2="0.35"
            gradientTransform={`translate(${drift} 0)`}
          >
            <stop offset="0" stopColor={VOID[2]} />
            <stop offset="0.55" stopColor={VOID[1]} />
            <stop offset="1" stopColor="#9F80FF" />
          </linearGradient>
          <clipPath id={`${uid}-under`}>
            <rect x={0} y={bandBottom} width={W} height={H} />
          </clipPath>
        </defs>
        {bandOn ? (
          <rect
            x={0}
            y={bandBottom - bandNowH}
            width={W}
            height={bandNowH}
            fill={`url(#${uid}-band)`}
          />
        ) : null}
        <g
          transform={`translate(${cx} ${cy}) scale(${frozen ? 1 : push}) translate(${-cx} ${-cy})`}
        >
          {!frozen ? (
            <>
              <rect
                x={inkL}
                y={bandBottom - lineH}
                width={inkW}
                height={lineH}
                fill={c.line}
              />
              <rect
                x={inkL}
                y={bandBottom - lineH}
                width={inkW * progress}
                height={lineH}
                fill={accent}
              />
            </>
          ) : null}
          <text
            x={inkL}
            y={bandY - 0.5 * labelFs}
            fill={frozen ? c.flash : c.dim}
            fontFamily={mono}
            fontWeight={500}
            fontSize={labelFs}
            style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            {frozen ? flashLabel : label}
          </text>
          {glyphs.map((g, i) => (
            <text
              key={i}
              x={g.x}
              y={baseline}
              fill={onBand}
              fontFamily={display}
              fontWeight={500}
              fontSize={fs}
              style={{ fontFeatureSettings: '"tnum" 1', fontKerning: "none" }}
            >
              {g.ch}
            </text>
          ))}
        </g>
        {delta && drop > 0 ? (
          <g clipPath={`url(#${uid}-under)`}>
            <text
              x={inkL + inkW}
              y={
                bandBottom + deltaFs * (0.28 + CAP) - deltaFs * 1.1 * (1 - drop)
              }
              textAnchor="end"
              fill={c.flash}
              fontFamily={display}
              fontWeight={500}
              fontSize={deltaFs}
              style={{
                fontFeatureSettings: '"tnum" 1',
                letterSpacing: "-0.02em",
              }}
            >
              {delta}
            </text>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
}
