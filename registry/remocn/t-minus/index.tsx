"use client";

import { loadFont } from "@remotion/google-fonts/IBMPlexMono";
import type React from "react";
import { useId } from "react";
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

export interface TMinusProps {
  /** Seconds on the clock when it starts. */
  from?: number;
  /** Frames per counted second (the countdown is compressed). */
  beat?: number;
  /** The word that slams in at T–0. Set in caps. */
  title?: string;
  /** Small line under the title. Pass "" to hide it. */
  subtitle?: string;
  /** Telemetry, top left. */
  stage?: string;
  /** Telemetry, top right, next to the live pip. */
  status?: string;
  /** Live pip and the small accent marks. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1, from 10, beat 8):
//   0–14   "T–10" is already up; the edge telemetry boots with a flicker
//  14–86   one hard cut per counted second, each with a small scale snap; the
//          small clock above rolls its last digit; from T–3 the bottom of the
//          frame starts to warm
//   86     T–0: the bloom fires from the bottom ("halo" palette), a white hit
//   89     LIFTOFF slams in where the number was; the clock flips to
//          T+00:00:01 and keeps counting up in real seconds
//  100–    poster: clock, LIFTOFF, subtitle, the bloom breathing at the bottom
const FIRST = 14;
const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "halo": bg #030306, #fff4ec #ffb36b #e2457a #3d4dff.
const HALO = ["#FFF4EC", "#FFB36B", "#E2457A", "#3D4DFF"] as const;

const THEMES = {
  dark: {
    stage: "#050508",
    ink: "#F4F2EE",
    dim: "#76757D",
    faint: "#3A3A42",
    title: "#FFF7F0",
    bloomOp: 1,
    hit: `radial-gradient(130% 110% at 50% 100%, ${HALO[0]} 0%, ${HALO[1]} 30%, ${HALO[2]} 62%, ${HALO[3]} 100%)`,
    grain: 0.07,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#86857F",
    faint: "#C9C7C0",
    title: "#121214",
    bloomOp: 0.8,
    hit: `radial-gradient(130% 110% at 50% 100%, #FFFFFF 0%, ${HALO[0]} 35%, ${HALO[1]} 70%, ${HALO[2]} 100%)`,
    grain: 0.05,
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

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** "T–00:00:10" / "T+00:00:01". */
function clockText(sign: "–" | "+", s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `T${sign}${pad(h)}:${pad(m)}:${pad(s % 60)}`;
}

/** Boot flicker: on, off, on, dim, on — then steady. */
function boot(t: number, at: number) {
  const d = Math.floor(t - at);
  if (d < 0) return 0;
  return [1, 0, 1, 0.35, 1][d] ?? 1;
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
          baseFrequency="0.9"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** One character that rolls up when it changes. Every glyph sits in the same clipped box. */
function RollChar({
  prev,
  next,
  p,
}: {
  prev: string;
  next: string;
  p: number;
}) {
  const rolling = prev !== next && p < 1;
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        height: "1.2em",
        lineHeight: "1.2em",
        overflow: "hidden",
        verticalAlign: "top",
      }}
    >
      <span
        style={{
          display: "block",
          transform: rolling ? `translateY(${(1 - p) * 100}%)` : undefined,
        }}
      >
        {next}
      </span>
      {rolling ? (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translateY(${-p * 100}%)`,
          }}
        >
          {prev}
        </span>
      ) : null}
    </span>
  );
}

export function TMinus({
  from = 10,
  beat = 8,
  title = "Liftoff",
  subtitle = "remocn 2.0 is live",
  stage = "Stage 1",
  status = "Go",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: TMinusProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const start = Math.max(1, Math.floor(from));
  const zeroAt = FIRST + (start - 1) * beat;
  const liftAt = zeroAt + 3;

  // Countdown value and the frame the current value appeared.
  const ticks =
    t < FIRST ? 0 : Math.min(start, 1 + Math.floor((t - FIRST) / beat));
  const n = start - ticks;
  const tickAt = ticks === 0 ? 0 : FIRST + (ticks - 1) * beat;
  const lifted = t >= liftAt;

  // Small clock: counts down with the big one, then up in real seconds.
  const upS = lifted ? 1 + Math.floor((t - liftAt) / fps) : 0;
  const upAt = lifted ? liftAt + (upS - 1) * fps : tickAt;
  const clock = lifted ? clockText("+", upS) : clockText("–", n);
  const prevClock = lifted
    ? upS === 1
      ? clockText("–", 0)
      : clockText("+", upS - 1)
    : ticks === 0
      ? clock
      : clockText("–", n + 1);
  const rollP = SLAM(ramp(t, upAt - 1.5, lifted && upS === 1 ? 7 : 4));

  // ── Motion ────────────────────────────────────────────────────────────────
  const snap = ticks === 0 ? 0 : kick(t - tickAt, 5);
  const numScale =
    (1 + 0.045 * snap) * (n === 0 ? 1 + 0.03 * kick(t - zeroAt, 3) : 1);
  const intro = SLAM(ramp(t, -4, 10));

  const warm = Easing.bezier(
    0.65,
    0,
    0.35,
    1,
  )(ramp(t, FIRST + (start - 3) * beat, 3 * beat));
  const fire = SLAM(ramp(t, zeroAt, 16));
  const hit = kick(t - zeroAt - 1, 7);
  const breathe = lifted ? Math.sin((t - liftAt) / 14) * 0.5 + 0.5 : 0;

  const titleIn = SLAM(ramp(t, liftAt, 8));
  const titleHit = kick(t - (liftAt + 4), 8);
  const subIn = SLAM(ramp(t, liftAt + 9, 10));

  // ── Layout ────────────────────────────────────────────────────────────────
  const numFs = 330 * u;
  const numCY = H / 2 + 22 * u;
  const titleFs = 210 * u;
  const titleCY = H / 2 - 4 * u;
  const clockFs = 34 * u;
  const clockY = lifted
    ? interpolate(
        titleIn,
        [0, 1],
        [numCY - numFs * 0.5 - 70 * u, titleCY - titleFs * 0.5 - 62 * u],
      )
    : numCY - numFs * 0.5 - 70 * u;
  const margin = 56 * u;

  // Telemetry values flicker in their last digit.
  const flick = (k: number, every: number) =>
    hash(Math.floor(t / every) * 13 + k);
  const lox = (99.6 + flick(1, 3) * 0.3).toFixed(1);
  const rp1 = (99.8 + flick(2, 4) * 0.2).toFixed(1);
  const press = (3.4 + flick(3, 3) * 0.05).toFixed(2);
  const sinceLift = Math.max(0, t - liftAt) / fps;
  const kmh = Math.round(sinceLift * sinceLift * 38);
  const alt = (sinceLift * sinceLift * 0.012).toFixed(2);

  const label: React.CSSProperties = {
    fontFamily: mono,
    fontWeight: 400,
    fontSize: 15 * u,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: c.dim,
    lineHeight: 1.6,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  };
  const value: React.CSSProperties = {
    color: c.ink,
    fontWeight: 500,
  };

  const bloom = (size: number) =>
    [
      `radial-gradient(${size * 0.9}% ${size * 0.62}% at 50% 112%, ${HALO[0]} 0%, ${HALO[1]} 20%, color-mix(in oklab, ${HALO[2]} 85%, transparent) 42%, color-mix(in oklab, ${HALO[3]} 55%, transparent) 66%, transparent 86%)`,
    ].join(", ");
  const bloomSize = interpolate(fire, [0, 1], [26, 100]) + breathe * 4;
  const bloomOp =
    c.bloomOp *
    (lifted || t >= zeroAt
      ? interpolate(fire, [0, 0.4, 1], [0.6, 1, 0.92])
      : 0);

  const blink = Math.floor(t / 12) % 2 === 0 ? 1 : 0.3;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      {/* Pre-ignition warmth. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(60% 34% at 50% 108%, color-mix(in oklab, ${HALO[1]} 70%, transparent) 0%, color-mix(in oklab, ${HALO[2]} 35%, transparent) 45%, transparent 75%)`,
          opacity: warm * (1 - fire) * (theme === "dark" ? 1 : 0.7),
        }}
      />
      {/* The bloom. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bloom(bloomSize),
          opacity: bloomOp,
        }}
      />
      <Grain opacity={c.grain} />

      {/* Corner telemetry. */}
      <div
        style={{
          ...label,
          position: "absolute",
          left: margin,
          top: margin - 8 * u,
          opacity: boot(t, 2),
        }}
      >
        <div>{stage}</div>
        <div>
          Vehicle <span style={value}>{lifted ? "Ascent" : "Pad 39"}</span>
        </div>
      </div>
      <div
        style={{
          ...label,
          position: "absolute",
          right: margin,
          top: margin - 8 * u,
          textAlign: "right",
          opacity: boot(t, 4),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10 * u,
          }}
        >
          <div
            style={{
              width: 8 * u,
              height: 8 * u,
              background: accent,
              opacity: lifted ? 1 : blink,
            }}
          />
          Status <span style={value}>{status}</span>
        </div>
        <div>
          Range <span style={value}>{lifted ? "Clear" : "Green"}</span>
        </div>
      </div>
      <div
        style={{
          ...label,
          position: "absolute",
          left: margin,
          bottom: margin - 8 * u,
          opacity: boot(t, 6),
        }}
      >
        {lifted ? (
          <>
            <div>
              Speed <span style={value}>{kmh}</span> km/h
            </div>
            <div>
              Alt <span style={value}>{alt}</span> km
            </div>
          </>
        ) : (
          <>
            <div>
              LOX <span style={value}>{lox}</span>%
            </div>
            <div>
              RP-1 <span style={value}>{rp1}</span>%
            </div>
          </>
        )}
      </div>
      <div
        style={{
          ...label,
          position: "absolute",
          right: margin,
          bottom: margin - 8 * u,
          textAlign: "right",
          opacity: boot(t, 8),
        }}
      >
        <div>
          Tank press <span style={value}>{press}</span> bar
        </div>
        <div>
          Engines <span style={value}>{t >= zeroAt ? "9 / 9" : "Chill"}</span>
        </div>
      </div>

      {/* Small clock. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: clockY,
          display: "flex",
          justifyContent: "center",
          fontFamily: mono,
          fontWeight: 400,
          fontSize: clockFs,
          lineHeight: 1.1,
          letterSpacing: "0.06em",
          color: lifted ? c.ink : c.dim,
          fontVariantNumeric: "tabular-nums",
          opacity: intro,
        }}
      >
        {clock.split("").map((ch, i) => (
          <RollChar key={i} prev={prevClock[i] ?? ch} next={ch} p={rollP} />
        ))}
      </div>

      {/* The big number, hard cut per second. */}
      {!lifted ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: numCY - numFs / 2,
            height: numFs,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: mono,
            fontWeight: 500,
            fontSize: numFs,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            transform: `translateY(${(1 - intro) * 40 * u}px) scale(${numScale})`,
            opacity: intro,
          }}
        >
          <span style={{ color: c.faint }}>T–</span>
          <span style={{ color: c.ink }}>{n}</span>
        </div>
      ) : null}

      {/* LIFTOFF. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: titleCY - titleFs / 2,
          height: titleFs,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: mono,
          fontWeight: 500,
          fontSize: titleFs,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          color: c.title,
          opacity: lifted ? ramp(titleIn, 0, 0.2) : 0,
          transform: `scale(${(1.24 - 0.24 * titleIn) * (1 + 0.02 * titleHit)})`,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: titleCY + titleFs * 0.5 + 18 * u,
            display: "flex",
            justifyContent: "center",
            fontFamily: mono,
            fontWeight: 400,
            fontSize: 30 * u,
            letterSpacing: "0.02em",
            color: c.ink,
            whiteSpace: "nowrap",
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 24 * u}px)`,
          }}
        >
          {subtitle}
        </div>
      ) : null}

      {/* Ignition hit. */}
      {hit > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: c.hit,
            opacity: hit,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
