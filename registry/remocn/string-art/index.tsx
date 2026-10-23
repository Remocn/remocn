"use client";

import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type StringArtProps = {
  /** Pins around the ring. */
  pins?: number;
  /** Multiplier at the start (2 draws a cardioid). */
  from?: number;
  /** Multiplier at the end (3 is a nephroid, 4 a three-cusp epicycloid). */
  to?: number;
  /** Frames for the threads to be strung, one pin after another. */
  stringFrames?: number;
  /** Frames for the multiplier to drift from `from` to `to`. */
  morphFrames?: number;
  /** Length of the accent sweep, as a share of all threads; 0 disables. */
  sweep?: number;
  /** Pins per frame the accent sweep travels once the threads are strung. */
  sweepSpeed?: number;
  /** Thread opacity, 0 to 1. */
  threadOpacity?: number;
  /** Show the running multiplier in the corner. */
  showLabel?: boolean;
  speed?: number;
  background?: string;
  color?: string;
  accent?: string;
};

export const stringArtDefaults: Required<StringArtProps> = {
  pins: 200,
  from: 2,
  to: 4,
  stringFrames: 60,
  morphFrames: 240,
  sweep: 0.08,
  sweepSpeed: 0.9,
  threadOpacity: 0.42,
  showLabel: true,
  speed: 1,
  background: "#111111",
  color: "#FFFFFF",
  accent: "#E5322D",
};

const TAU = Math.PI * 2;
const MORPH_DELAY = 24;
// Share of each integer step spent holding on the clean integer figure.
const HOLD = 0.3;
const SWEEP_BUCKETS = 4;
const fmt = (n: number) => Math.round(n * 10) / 10;

export function StringArt({
  pins = stringArtDefaults.pins,
  from = stringArtDefaults.from,
  to = stringArtDefaults.to,
  stringFrames: stringFramesProp = stringArtDefaults.stringFrames,
  morphFrames: morphFramesProp = stringArtDefaults.morphFrames,
  sweep = stringArtDefaults.sweep,
  sweepSpeed = stringArtDefaults.sweepSpeed,
  threadOpacity = stringArtDefaults.threadOpacity,
  showLabel = stringArtDefaults.showLabel,
  speed = stringArtDefaults.speed,
  background = stringArtDefaults.background,
  color = stringArtDefaults.color,
  accent = stringArtDefaults.accent,
}: StringArtProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = Math.max(8, Math.round(pins));
  const unit = Math.min(width, height) / 720;
  const radius = Math.min(width, height) * 0.42;
  const cx = width / 2;
  const cy = height / 2;
  const time = frame * speed;
  // interpolate() needs a strictly increasing range.
  const stringFrames = Math.max(1, stringFramesProp);
  const morphFrames = Math.max(1, morphFramesProp);

  const strung = interpolate(time, [0, stringFrames], [0, n], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const morphStart = stringFrames + MORPH_DELAY;
  // The multiplier walks through each integer table (cardioid, nephroid, ...)
  // with an eased step and a short hold on every clean figure.
  const span = to - from;
  const steps = Math.max(1, Math.ceil(Math.abs(span) - 1e-6));
  const u =
    interpolate(time, [morphStart, morphStart + morphFrames], [0, steps], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) - 1e-9;
  const step = Math.max(0, Math.floor(u));
  const within = Easing.inOut(Easing.cubic)(
    Math.min(1, Math.max(0, (u - step) / (1 - HOLD))),
  );
  const k = from + (span * Math.min(steps, step + within)) / steps;

  // Pin 0 sits on the left so the cardioid cusp points left and the figure is
  // symmetric about the horizontal axis. Angles stay continuous in k, so the
  // pattern morphs smoothly instead of snapping between integer tables.
  const point = (index: number) => {
    const a = Math.PI + (TAU * index) / n;
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  };
  const xy = (p: { x: number; y: number }) => `${fmt(p.x)} ${fmt(p.y)}`;

  let threads = "";
  const accents: string[] = new Array(SWEEP_BUCKETS).fill("");
  const whole = Math.floor(strung);
  // The accent sweep rides the stringing head, then keeps circling the ring.
  const head = strung + Math.max(0, time - stringFrames) * sweepSpeed;
  const tail = Math.max(0, sweep) * n;
  for (let i = 0; i < Math.ceil(strung); i++) {
    const start = point(i);
    const end = point(k * i);
    // The thread being strung right now grows from its pin to the target.
    const f = i < whole ? 1 : strung - whole;
    const tip = {
      x: start.x + (end.x - start.x) * f,
      y: start.y + (end.y - start.y) * f,
    };
    const d = `M ${xy(start)} L ${xy(tip)} `;
    const behind = (((head - i) % n) + n) % n;
    if (tail > 0 && behind < tail) {
      accents[
        Math.min(SWEEP_BUCKETS - 1, Math.floor((behind / tail) * SWEEP_BUCKETS))
      ] += d;
    } else threads += d;
  }

  let pinDots = "";
  const pr = 1.6 * unit;
  for (let i = 0; i < n; i++) {
    const { x, y } = point(i);
    pinDots += `M ${fmt(x - pr)} ${fmt(y)} a ${fmt(pr)} ${fmt(pr)} 0 1 0 ${fmt(pr * 2)} 0 a ${fmt(pr)} ${fmt(pr)} 0 1 0 ${fmt(-pr * 2)} 0 `;
  }
  const pinsIn = interpolate(time, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelIn = interpolate(
    time,
    [stringFrames - 10, stringFrames + 6],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="String art times table"
        style={{ display: "block" }}
      >
        <path d={pinDots} fill={color} fillOpacity={0.55 * pinsIn} />
        <path
          d={threads}
          fill="none"
          stroke={color}
          strokeOpacity={threadOpacity}
          strokeWidth={unit}
          strokeLinecap="round"
        />
        <g fill="none" stroke={accent} strokeLinecap="round">
          {accents.map((d, b) => (
            <path
              key={b}
              d={d}
              strokeOpacity={1 - b / SWEEP_BUCKETS}
              strokeWidth={unit * (1.6 - b * 0.15)}
            />
          ))}
        </g>
      </svg>
      {showLabel ? (
        <div
          style={{
            position: "absolute",
            left: width * 0.06,
            bottom: height * 0.08,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 22 * unit,
            letterSpacing: "0.04em",
            color,
            opacity: 0.7 * labelIn,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ color: accent }}>i → </span>
          {k.toFixed(2)} · i mod {n}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
