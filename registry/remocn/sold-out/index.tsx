"use client";

import { loadFont } from "@remotion/google-fonts/Archivo";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
loadFont("italic", { weights: ["500"], subsets: ["latin"] });
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface SoldOutProps {
  /** Stock when the shot opens; it races down to zero. */
  stock?: number;
  /** Word after the counter. */
  unit?: string;
  /** Tag that flashes once the stock hits ten. */
  warning?: string;
  /** Set huge on the diagonal band at zero. */
  stamp?: string;
  /** Subline lead, in the grotesk. */
  lead?: string;
  /** Subline accent, in the serif italic. */
  tail?: string;
  /** Kept for the shared draft API; the band takes the "chrome" gradient. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Archivo 500 (fontTools, wght 500, wdth 100): cap 0.686; figures 0.57em,
// set in fixed 0.58em cells. "LEFT" 2.449em, side bearings 0.081 / 0.022.
// Archivo 500 italic: "SOLD OUT" 5.068em.
const CAP = 0.686;
const CELL = 0.58;
const ADV: Record<string, number> = {
  L: 0.552,
  E: 0.674,
  F: 0.611,
  T: 0.612,
  S: 0.67,
  O: 0.785,
  D: 0.731,
  U: 0.728,
  " ": 0.205,
  W: 0.938,
  C: 0.725,
  K: 0.677,
};
const textEm = (s: string, track = 0) => {
  const a = Array.from(s);
  return (
    a.reduce((w, ch) => w + (ADV[ch] ?? 0.66), 0) +
    track * Math.max(0, a.length - 1)
  );
};

// Beat sheet (30fps, speed 1, stock 128):
//   0–9    "128 LEFT" punches in from 1.25× and a blur
//  10–56   the reels race down to 10 (ease in-out), the units reel smears;
//          the frame shakes harder the lower it gets
//  56–86   ten hard ticks, 3 frames apart, each with a hit; LOW STOCK flashes
//          and the figures turn red
//  86–92   "0 LEFT" holds, trembling
//  92–98   the SOLD OUT band slams across on the diagonal, big hit
// 104–     subline rises; poster hold, the band's gradient drifts
const ENTER_LEN = 9;
const RACE_AT = 10;
const RACE_END = 56;
const TICK = 3;
const LOW = 10;
const ZERO_HOLD = 6;
const BAND_LEN = 6;

const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const RACE = Easing.bezier(0.55, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "chrome" (bg #050203): #e0202e #ffd6b8 #4fe3f0.
const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    dim: "#8A8990",
    red: "#F0333F",
    tagInk: "#F3F2EF",
    bandInk: "#0A0A0B",
    flash: "#F3F2EF",
    haze: "#4a0d14",
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#77766F",
    red: "#D41E2C",
    tagInk: "#F5F4F0",
    bandInk: "#0A0A0B",
    flash: "#121214",
    haze: "#ffd6b8",
  },
} as const;
const CHROME = ["#e0202e", "#ff7a6a", "#ffd6b8", "#4fe3f0"];

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A short hit: up in 2 frames, eases back over 8. */
function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 8);
  return k * k;
}

/** A decaying shake that dies in 7 frames. Deterministic. */
function shake(d: number, amp: number, seed: number) {
  if (d < 0 || d > 7) return { x: 0, y: 0 };
  const k = (1 - d / 7) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.7 + seed),
    y: amp * 0.7 * k * Math.cos(d * 3.3 + seed * 1.7),
  };
}

/** Continuous stock level at time t (reels read this). */
function level(t: number, stock: number) {
  const low = Math.min(LOW, stock);
  if (t < RACE_AT) return stock;
  if (t < RACE_END) {
    const p = RACE((t - RACE_AT) / (RACE_END - RACE_AT));
    return stock - (stock - low) * p;
  }
  // ten hard ticks: each one rolls its reel in 2 frames
  const d = t - RACE_END;
  const k = Math.floor(d / TICK);
  const f = Math.min(1, (d - k * TICK) / 2);
  const roll = SLAM(f);
  return Math.max(0, low - k - (k < low ? roll : 0));
}

/** Reel position of the digit at place `p` (1, 10, 100…) for level v. */
function reelPos(v: number, p: number) {
  if (p === 1) return v;
  const whole = Math.floor(v / p);
  const rem = v - whole * p;
  return whole + Math.max(0, rem - (p - 1));
}

export function SoldOut({
  stock = 128,
  unit = "LEFT",
  warning = "LOW STOCK",
  stamp = "SOLD OUT",
  lead = "Restocking:",
  tail = "every launch.",
  theme = "dark",
  speed = 1,
}: SoldOutProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const total = Math.max(1, Math.round(stock));
  const low = Math.min(LOW, total);
  const zeroAt = RACE_END + low * TICK;
  const bandAt = zeroAt + ZERO_HOLD;
  const places = String(total).length;

  const v = level(t, total);
  const vel = Math.abs(level(t + 0.5, total) - level(t - 0.5, total));
  const shown = Math.round(v);

  // ── Layout: figures (huge) + unit (smaller, on the same baseline) ──
  const unitRatio = 0.34;
  const unitTrack = -0.01;
  const unitEm = textEm(unit, unitTrack) - 0.081 - 0.022;
  const gapEm = 0.16;
  const fullEm = places * CELL + gapEm + unitEm * unitRatio;
  const N = Math.min((0.86 * W) / fullEm, (0.62 * H) / CAP);
  const capH = CAP * N;
  const baseline = H * 0.53 + capH / 2;
  const step = (CAP + 0.14) * N;

  // places fade out as the stock drops below them; the group re-centres
  let visible = 0;
  const placeVis: number[] = [];
  for (let i = 0; i < places; i++) {
    const p = 10 ** (places - 1 - i);
    const keep =
      p === 1 ? 1 : interpolate(v, [p - 0.4, p + 0.05], [0, 1], CLAMP);
    placeVis.push(SLAM(keep));
    visible += SLAM(keep);
  }
  const groupW = visible * CELL * N + gapEm * N + unitEm * unitRatio * N;
  const groupX = (W - groupW) / 2;
  const unitX = groupX + visible * CELL * N + gapEm * N;

  // ── Motion ──
  const enter = SLAM(ramp(t, 0, ENTER_LEN));
  const enterScale = 1.25 - 0.25 * enter;
  const enterBlur = (1 - enter) * 14;
  const isLow = v <= low + 0.01 && t >= RACE_END;
  const lowAt = RACE_END;
  // the tremble grows as the stock drains, then drops away under the band
  const drain = 1 - v / total;
  const band = SLAM(ramp(t, bandAt, BAND_LEN));
  const tremble = 9 * u * drain ** 2.2 * (1 - ramp(t, bandAt, 4));
  let sx =
    tremble * (0.6 * Math.sin(t * 2.31 + 0.4) + 0.4 * Math.sin(t * 5.17 + 1.3));
  let sy =
    tremble * (0.6 * Math.cos(t * 2.83 + 2.1) + 0.4 * Math.sin(t * 4.41 + 0.2));
  let bump = 0;
  for (let k = 0; k < low; k++) {
    const d = t - (RACE_END + k * TICK);
    if (d < 0 || d > 12) continue;
    const g = 0.5 + (0.7 * k) / Math.max(1, low - 1);
    bump = Math.max(bump, 0.6 * g * kick(d));
    const s = shake(d, 5 * u * g, k * 1.9);
    sx += s.x;
    sy += s.y;
  }
  const hitD = t - bandAt - BAND_LEN + 2;
  bump = Math.max(bump, 1.5 * kick(hitD));
  const s3 = shake(hitD, 16 * u, 3.3);
  sx += s3.x;
  sy += s3.y;
  const camScale = 1 + 0.035 * bump;
  const flash = interpolate(
    t,
    [bandAt + BAND_LEN - 2, bandAt + BAND_LEN - 1, bandAt + BAND_LEN + 3],
    [0, 0.32, 0],
    CLAMP,
  );

  const figInk = isLow ? c.red : c.ink;
  const sinceLow = t - lowAt;
  const tagOn =
    t >= lowAt &&
    t < bandAt + 4 &&
    (sinceLow >= 24 || Math.floor(sinceLow / 4) % 2 === 0);
  const tagPop = SLAM(ramp(t, lowAt, 4));
  const behind = ramp(t, bandAt + 1, 8);

  // ── Band ──
  const angle = -11;
  const bandH = 0.34 * H;
  const bandLen = 1.5 * Math.hypot(W, H);
  const bandX = -1.25 * bandLen * (1 - band);
  const stampEm = textEm(stamp, -0.02);
  const stampFs = Math.min((0.9 * W) / stampEm, (bandH * 0.78) / CAP);
  const drift = ramp(t, bandAt, 70);
  const bandGrad = `linear-gradient(90deg, ${CHROME[0]} ${34 - 8 * drift}%, ${CHROME[1]} ${44 - 6 * drift}%, ${CHROME[2]} ${58 - 4 * drift}%, ${CHROME[3]} ${74 - 4 * drift}%)`;
  const rise = SLAM(ramp(t, bandAt + 12, 18));

  const digit = (n: number) => ((n % 10) + 10) % 10;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      {/* A low red haze creeps up as the stock runs out. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: Math.max(0, drain - 0.4) * (theme === "dark" ? 0.9 : 0.7),
          background: `radial-gradient(80% 60% at 50% 115%, ${c.haze} 0%, transparent 72%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${sx}px, ${sy}px) scale(${camScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* The counter. */}
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            opacity: Math.min(ramp(t, 0, 2), 1 - 0.6 * behind),
            transform: `scale(${enterScale * (1 - 0.04 * behind)})`,
            transformOrigin: "50% 52%",
            filter: enterBlur > 0.2 ? `blur(${enterBlur * u}px)` : undefined,
          }}
          role="img"
          aria-label={t >= bandAt ? stamp : `${shown} ${unit}`}
        >
          <defs>
            <linearGradient id={`${uid}feather`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity={0} />
              <stop offset="0.1" stopColor="#fff" />
              <stop offset="0.9" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <mask
              id={`${uid}win`}
              maskUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={W}
              height={H}
            >
              <rect
                x={0}
                y={baseline - capH - 0.07 * N}
                width={W}
                height={capH + 0.14 * N}
                fill={`url(#${uid}feather)`}
              />
            </mask>
          </defs>

          {/* LOW STOCK tag over the figures. */}
          {tagOn ? (
            <g
              transform={`translate(${groupX} ${baseline - capH - 0.1 * H}) scale(${0.9 + 0.1 * tagPop})`}
            >
              <rect
                x={0}
                y={-0.062 * H}
                width={
                  (textEm(warning.toUpperCase(), 0.06) * 0.042 + 0.036) * H
                }
                height={0.074 * H}
                fill={c.red}
              />
              <text
                x={0.018 * H}
                y={-0.009 * H}
                fontFamily={sans}
                fontWeight={500}
                fontSize={0.042 * H}
                fill={c.tagInk}
                style={{ letterSpacing: "0.06em" }}
              >
                {warning.toUpperCase()}
              </text>
            </g>
          ) : null}

          <g
            fontFamily={sans}
            fontWeight={500}
            fontSize={N}
            textAnchor="middle"
            fill={figInk}
            mask={`url(#${uid}win)`}
            style={{ letterSpacing: "-0.02em" }}
          >
            {placeVis.map((vis, i) => {
              const p = 10 ** (places - 1 - i);
              const r = reelPos(v, p);
              const base = Math.floor(r);
              const f = r - base;
              const x =
                groupX +
                (placeVis.slice(0, i).reduce((a, b) => a + b, 0) + 0.5) *
                  CELL *
                  N;
              const placeVel = vel / p;
              const sd = Math.min(0.22, placeVel * 0.06) * N;
              if (vis < 0.01) return null;
              return (
                <g
                  key={p}
                  opacity={vis}
                  transform={`translate(0 ${-f * step})`}
                >
                  <g filter={sd > 0.3 ? `url(#${uid}b${i})` : undefined}>
                    <text x={x} y={baseline}>
                      {digit(base)}
                    </text>
                    {f > 0.001 ? (
                      <text x={x} y={baseline + step}>
                        {digit(base + 1)}
                      </text>
                    ) : null}
                  </g>
                  <filter
                    id={`${uid}b${i}`}
                    filterUnits="userSpaceOnUse"
                    x={0}
                    y={-H}
                    width={W}
                    height={3 * H}
                  >
                    <feGaussianBlur stdDeviation={`0 ${sd.toFixed(2)}`} />
                  </filter>
                </g>
              );
            })}
          </g>
          <text
            x={unitX - 0.081 * N * unitRatio}
            y={baseline}
            fontFamily={sans}
            fontWeight={500}
            fontSize={N * unitRatio}
            fill={figInk}
            opacity={ramp(t, 2, 6)}
            style={{ letterSpacing: `${unitTrack}em` }}
          >
            {unit}
          </text>
        </svg>

        {/* The SOLD OUT band. */}
        {t >= bandAt ? (
          <div
            style={{
              position: "absolute",
              left: W / 2 - bandLen / 2,
              top: H * 0.5 - bandH / 2,
              width: bandLen,
              height: bandH,
              transform: `rotate(${angle}deg) translateX(${bandX}px)`,
              transformOrigin: "50% 50%",
              background: bandGrad,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter:
                band < 0.98 ? `blur(${(1 - band) * 10 * u}px)` : undefined,
            }}
          >
            <div
              style={{
                fontFamily: sans,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: stampFs,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: c.bandInk,
                whiteSpace: "nowrap",
                transform: `translateY(${0.04 * stampFs}px)`,
              }}
            >
              {stamp}
            </div>
          </div>
        ) : null}
      </div>

      {/* Subline. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.845,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 0.012 * H,
          color: c.ink,
          lineHeight: 1,
          whiteSpace: "nowrap",
          opacity: rise,
          transform: `translateY(${(1 - rise) * 14 * u}px)`,
        }}
      >
        <span
          style={{
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 0.05 * H,
            letterSpacing: "-0.02em",
          }}
        >
          {lead}
        </span>
        <span
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 0.062 * H,
            letterSpacing: "-0.01em",
          }}
        >
          {tail}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.flash,
          opacity: flash,
        }}
      />
    </AbsoluteFill>
  );
}
