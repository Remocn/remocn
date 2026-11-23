"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_TEXT,
  type PeriodDropElementId,
  periodDropTimeline,
  REST_FRAME,
} from "./timeline";

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
  /**
   * Moves, trims or stretches single letters and the drop, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<PeriodDropElementId>;
}

export const periodDropDefaults = {
  text: DEFAULT_TEXT,
  fontSize: 160,
  fontWeight: 800,
  fontFamily: INTER,
  color: "#fafafa",
  dotColor: "#D97757",
  dotSize: 0.2,
  speed: 1,
} satisfies Required<Omit<PeriodDropProps, "className" | "timing">>;

/** Frame where the dot has come to rest, squash included. */
export const periodDropLength = REST_FRAME;

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

/**
 * How far letter `index` still sits below its line, 1 → 0. `start` and
 * `frames` move and stretch its rise; by default it starts `riseStagger`
 * frames after the letter before.
 */
export function getPeriodDropRise(
  t: number,
  index: number,
  start = periodDropTiming.riseStagger * index,
  frames: number = periodDropTiming.riseFrames,
) {
  return interpolate(t, [start, start + frames], [1, 0], {
    ...CLAMP,
    easing: easeOutQuart,
  });
}

/**
 * Frames at which the dot touches the line: the landing, then each bounce.
 * `dropStart` moves the drop; `stretch` slows the whole fall and bounce.
 */
export function getPeriodDropImpacts(
  dropStart: number = periodDropTiming.dropStart,
  stretch = 1,
) {
  const { restitution, bounces } = periodDropTiming;
  const fallFrames = periodDropTiming.fallFrames * stretch;
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
 * previous speed, and the squash of each impact scales with it. `dropStart`
 * moves the drop; `slow` stretches its fall, bounces and recovery in time.
 */
export function getPeriodDropDot(
  t: number,
  dropStart: number = periodDropTiming.dropStart,
  slow = 1,
): PeriodDropDot {
  const { restitution, stretch, squash } = periodDropTiming;
  const fallFrames = periodDropTiming.fallFrames * slow;
  const recover = periodDropTiming.recover * slow;
  if (t < dropStart) return { visible: false, y: -1, scaleX: 1, scaleY: 1 };
  const g = 2 / (fallFrames * fallFrames);
  const landing = g * fallFrames;
  const impacts = getPeriodDropImpacts(dropStart, slow);

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

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function PeriodDrop(props: PeriodDropProps) {
  const {
    text = periodDropDefaults.text,
    fontSize = periodDropDefaults.fontSize,
    fontWeight = periodDropDefaults.fontWeight,
    fontFamily = periodDropDefaults.fontFamily,
    color = periodDropDefaults.color,
    dotColor = periodDropDefaults.dotColor,
    dotSize = periodDropDefaults.dotSize,
    speed = periodDropDefaults.speed,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame();
  const { fps, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    periodDropTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const unit = height / 720;
  const t = getPeriodDropTime(frame, { fps, speed });
  const fall = tl.get("drop");
  const dot = getPeriodDropDot(
    t,
    fall.start,
    fall.beat("fall") / periodDropTiming.fallFrames,
  );
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
        {Array.from(text).map((char, i) => {
          const letter = tl.get(`char:${i}`);
          const rise = getPeriodDropRise(t, i, letter.start, letter.length);
          return (
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
                  transform: `translateY(${rise * 115}%)${glide(midway(rise))}`,
                }}
              >
                {char}
              </span>
            </span>
          );
        })}
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
