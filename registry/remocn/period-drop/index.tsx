"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["100", "900"],
  subsets: ["latin"],
});

export interface PeriodDropProps {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  dotColor?: string;
  dotSize?: number;
  speed?: number;
  className?: string;
}

export const periodDropDefaults = {
  text: "remocn",
  fontSize: 160,
  fontWeight: 800,
  fontFamily: INTER,
  color: "#fafafa",
  dotColor: "#D97757",
  dotSize: 0.2,
  speed: 1,
} satisfies Required<Omit<PeriodDropProps, "className">>;

/** Frame where the dot has come to rest, squash included. */
export const periodDropLength = 47;

/** Timeline constants on the 30 fps clock. */
export const periodDropTiming = {
  riseFrames: 12,
  riseStagger: 2,
  dropStart: 20,
  fallFrames: 12,
  restitution: 0.35,
  bounces: 2,
  /** Drop height as a share of the composition height. */
  dropHeight: 0.62,
  /** `scaleY` at full speed. */
  stretch: 0.3,
  /** `scaleY` lost at a full-speed impact. */
  squash: 0.22,
  /** Frames for an impact squash to decay by 1/e. */
  recover: 1.1,
} as const;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOutQuart = Easing.out(Easing.poly(4));

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getPeriodDropTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

/** How far letter `index` still sits below its line, 1 → 0. */
export function getPeriodDropRise(t: number, index: number) {
  const start = periodDropTiming.riseStagger * index;
  return interpolate(t, [start, start + periodDropTiming.riseFrames], [1, 0], {
    ...CLAMP,
    easing: easeOutQuart,
  });
}

/** Frames at which the dot touches the line: the landing, then each bounce. */
export function getPeriodDropImpacts() {
  const { dropStart, fallFrames, restitution, bounces } = periodDropTiming;
  const impacts = [dropStart + fallFrames];
  for (let n = 1; n <= bounces; n++) {
    impacts.push(impacts[n - 1] + 2 * restitution ** n * fallFrames);
  }
  return impacts;
}

export interface PeriodDropDot {
  visible: boolean;
  /** Height above the rest point as a share of the drop, 0 at rest, −1 at the start. */
  y: number;
  scaleX: number;
  scaleY: number;
}

/**
 * The dot's fall and bounces. Heights are shares of the drop height, time is
 * in 30 fps frames. Gravity is set by the fall: `g = 2 / fall²`, so the
 * landing speed is `2 / fall`. Each bounce leaves at `restitution` times the
 * previous speed, and the squash of each impact scales with it.
 */
export function getPeriodDropDot(t: number): PeriodDropDot {
  const { dropStart, fallFrames, restitution, stretch, squash, recover } =
    periodDropTiming;
  if (t < dropStart) return { visible: false, y: -1, scaleX: 1, scaleY: 1 };
  const g = 2 / (fallFrames * fallFrames);
  const landing = g * fallFrames;
  const impacts = getPeriodDropImpacts();

  let y = 0;
  let speed = 0;
  let deform = 0;
  if (t < impacts[0]) {
    const u = t - dropStart;
    y = -1 + 0.5 * g * u * u;
    speed = g * u;
    deform = speed / landing;
  } else {
    let n = impacts.length - 1;
    while (n > 0 && t < impacts[n]) n--;
    const tau = t - impacts[n];
    const bounce = n + 1;
    const launch =
      bounce < impacts.length ? restitution ** bounce * landing : 0;
    const flight = launch > 0 ? (2 * launch) / g : 0;
    if (tau < flight) {
      y = -(launch * tau - 0.5 * g * tau * tau);
      speed = Math.abs(launch - g * tau);
    }
    const impact = restitution ** n;
    const decay = Math.exp(-tau / recover);
    deform = -impact * decay + (1 - decay) * (speed / landing);
  }
  // Snap the last imperceptible wobble so the dot rests exactly.
  if (Math.abs(deform) < 0.005) deform = 0;

  const scaleY =
    deform >= 0 ? 1 + stretch * deform : 1 + squash * Math.max(-1, deform);
  return { visible: true, y: Math.min(0, y), scaleX: 1 / scaleY, scaleY };
}

export function PeriodDrop({
  text = periodDropDefaults.text,
  fontSize = periodDropDefaults.fontSize,
  fontWeight = periodDropDefaults.fontWeight,
  fontFamily = periodDropDefaults.fontFamily,
  color = periodDropDefaults.color,
  dotColor = periodDropDefaults.dotColor,
  dotSize = periodDropDefaults.dotSize,
  speed = periodDropDefaults.speed,
  className,
}: PeriodDropProps) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const unit = height / 720;
  const t = getPeriodDropTime(frame, { fps, speed });
  const dot = getPeriodDropDot(t);
  const drop = periodDropTiming.dropHeight * height;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: fontSize * unit,
          lineHeight: 1,
          fontWeight,
          fontVariationSettings: `"wght" ${fontWeight}`,
          color,
          whiteSpace: "pre",
        }}
      >
        {Array.from(text).map((char, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              // Extend the clip below the line box so descenders survive.
              paddingBottom: "0.15em",
              marginBottom: "-0.15em",
              verticalAlign: "top",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${getPeriodDropRise(t, i) * 115}%)`,
              }}
            >
              {char}
            </span>
          </span>
        ))}
        <span
          style={{
            display: "inline-block",
            width: `${dotSize}em`,
            height: `${dotSize}em`,
            marginLeft: "0.04em",
            borderRadius: "50%",
            background: dotColor,
            visibility: dot.visible ? "visible" : "hidden",
            transformOrigin: "50% 100%",
            transform: `translateY(${dot.y * drop}px) scale(${dot.scaleX}, ${dot.scaleY})`,
          }}
        />
      </div>
    </div>
  );
}
