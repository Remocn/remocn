"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { useEffect, useId, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["100", "900"],
  subsets: ["latin"],
});

export interface LeadBarTypeProps {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  barColor?: string;
  smear?: number;
  speed?: number;
  className?: string;
}

export const leadBarTypeDefaults = {
  text: "Every",
  fontSize: 180,
  fontWeight: 800,
  fontFamily: INTER,
  color: "#fafafa",
  barColor: "",
  smear: 1,
  speed: 1,
} satisfies Required<Omit<LeadBarTypeProps, "className">>;

/** Bar geometry in em. */
export const leadBarGeometry = {
  width: 0.42,
  thickness: 0.16,
  underline: 0.045,
  /** Top of the settled underline, below the baseline. */
  underlineOffset: 0.09,
  /** Gap kept between the underline and the lowest descender. */
  descenderGap: 0.05,
} as const;

const GROW = [0, 4] as const;
const TRAVEL = [2, 22] as const;
const MORPH = [22, 34] as const;
/** How far into its slot the bar is when a letter starts to chase it. */
const TRIGGER = 0.35;
const LETTER_TRAVEL = 9;
const SMEAR_FRAMES = 7;
const FADE_FRAMES = 3;
const START_X = -0.3;
const START_Y = -0.16;
const MAX_STRETCH = 0.8;
const MAX_BLUR = 10;
const DROP = { mass: 0.6, damping: 9, stiffness: 170 } as const;
const MEASURE_SIZE = 100;
/** Ascent and descent of Inter, in em, until the face is measured. */
const INTER_METRICS = { ascent: 0.96875, descent: 0.2412 };

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOutCubic = Easing.out(Easing.cubic);
const easeInOutCubic = Easing.inOut(Easing.cubic);

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Ease-in-out sine and its inverse, for the bar's run across the word. */
const sineInOut = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
const sineInOutInverse = (y: number) => Math.acos(1 - 2 * y) / Math.PI;

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getLeadBarTypeTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

/** Bar position in letter slots: 0 at the word start, `count` at its end. */
export function getLeadBarProgress(t: number, count: number) {
  const x = interpolate(t, [...TRAVEL], [0, 1], CLAMP);
  return count * sineInOut(x);
}

/** Frame at which letter `index` of `count` starts chasing the bar. */
export function getLeadBarTrigger(index: number, count: number) {
  const share = Math.min(1, (index + TRIGGER) / Math.max(1, count));
  return TRAVEL[0] + (TRAVEL[1] - TRAVEL[0]) * sineInOutInverse(share);
}

export interface LeadBarLetter {
  /** Horizontal offset from the slot, em. */
  x: number;
  /** Vertical offset from the baseline, em, positive down. */
  y: number;
  scaleX: number;
  /** Horizontal blur at `smear = 1`, reference px. */
  blur: number;
  opacity: number;
}

export function getLeadBarLetter(
  t: number,
  index: number,
  count: number,
  smear = 1,
): LeadBarLetter {
  const u = t - getLeadBarTrigger(index, count);
  if (u < 0) return { x: START_X, y: START_Y, scaleX: 1, blur: 0, opacity: 0 };
  const travel = easeOutCubic(Math.min(1, u / LETTER_TRAVEL));
  const trail = 1 - easeOutCubic(Math.min(1, u / SMEAR_FRAMES));
  const drop = spring({ frame: u, fps: 30, config: DROP });
  const amount = Math.max(0, finite(smear, 1));
  return {
    x: START_X * (1 - travel),
    y: START_Y * (1 - drop),
    scaleX: 1 + MAX_STRETCH * amount * trail,
    blur: MAX_BLUR * amount * trail,
    opacity: Math.min(1, u / FADE_FRAMES),
  };
}

export interface LeadBarState {
  /** Bar width as a share of `leadBarGeometry.width` while it grows in. */
  grow: number;
  /** Bar position in letter slots. */
  progress: number;
  /** 0 while the bar runs, 1 once it has become the underline. */
  morph: number;
  /** Bar thickness, em. */
  thickness: number;
  /** Bar top relative to the baseline, em, positive down. */
  top: number;
}

/** Underline top below the baseline, clear of the word's descenders. */
export function getLeadBarUnderlineOffset(descent: number) {
  return Math.max(
    leadBarGeometry.underlineOffset,
    descent + leadBarGeometry.descenderGap,
  );
}

export function getLeadBarState(
  t: number,
  count: number,
  underlineOffset: number = leadBarGeometry.underlineOffset,
): LeadBarState {
  const morph = interpolate(t, [...MORPH], [0, 1], {
    ...CLAMP,
    easing: easeInOutCubic,
  });
  const thickness =
    leadBarGeometry.thickness +
    (leadBarGeometry.underline - leadBarGeometry.thickness) * morph;
  return {
    grow: interpolate(t, [...GROW], [0, 1], { ...CLAMP, easing: easeOutCubic }),
    progress: getLeadBarProgress(t, count),
    morph,
    thickness,
    top:
      -leadBarGeometry.thickness +
      (underlineOffset + leadBarGeometry.thickness) * morph,
  };
}

/** Frame after which the last letter stays within `tolerance` em of rest. */
export function getLeadBarTypeLength(count: number, tolerance = 0.002) {
  const last = getLeadBarTrigger(Math.max(0, count - 1), count);
  let moving = last;
  for (let u = 0; u <= 120; u++) {
    const letter = getLeadBarLetter(last + u, count - 1, count);
    if (Math.abs(letter.y) >= tolerance || Math.abs(letter.x) >= tolerance) {
      moving = last + u;
    }
  }
  return Math.ceil(Math.max(MORPH[1], moving + 1));
}

/** Frame where the default word has settled. */
export const leadBarTypeLength = 34;

/** Baseline position inside a `line-height: 1` box, in em from its top. */
export function getBaselineInLineBox(ascent: number, descent: number) {
  return (1 - (ascent + descent)) / 2 + ascent;
}

/** Baseline in its line box and the word's lowest descender, both in em. */
function useTextMetrics(text: string, font: string) {
  const [metrics, setMetrics] = useState({
    baseline: getBaselineInLineBox(INTER_METRICS.ascent, INTER_METRICS.descent),
    descent: 0,
  });

  useEffect(() => {
    const handle = delayRender("lead-bar-type: measuring the word");
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      continueRender(handle);
    };
    const measure = () => {
      if (released) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        ctx.font = font;
        const m = ctx.measureText(text);
        if (m.fontBoundingBoxAscent > 0) {
          setMetrics({
            baseline: getBaselineInLineBox(
              m.fontBoundingBoxAscent / MEASURE_SIZE,
              m.fontBoundingBoxDescent / MEASURE_SIZE,
            ),
            descent: Math.max(0, m.actualBoundingBoxDescent / MEASURE_SIZE),
          });
        }
      }
      release();
    };
    document.fonts.load(font, text).then(measure, measure);
    return release;
  }, [text, font]);

  return metrics;
}

export function LeadBarType({
  text = leadBarTypeDefaults.text,
  fontSize = leadBarTypeDefaults.fontSize,
  fontWeight = leadBarTypeDefaults.fontWeight,
  fontFamily = leadBarTypeDefaults.fontFamily,
  color = leadBarTypeDefaults.color,
  barColor = leadBarTypeDefaults.barColor,
  smear = leadBarTypeDefaults.smear,
  speed = leadBarTypeDefaults.speed,
  className,
}: LeadBarTypeProps) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const filterId = `lead-bar-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const unit = height / 720;
  const size = fontSize * unit;
  const t = getLeadBarTypeTime(frame, { fps, speed });
  const letters = Array.from(text);
  const count = Math.max(1, letters.length);
  const { baseline, descent } = useTextMetrics(
    text,
    `${fontWeight} ${MEASURE_SIZE}px ${fontFamily}`,
  );
  const bar = getLeadBarState(t, count, getLeadBarUnderlineOffset(descent));
  const fill = barColor || color;

  const barTop = (baseline + bar.top) * size;
  const barWidth = leadBarGeometry.width * size;
  const barSlot = Math.min(count - 1, Math.floor(bar.progress));
  const barInSlot = bar.progress - barSlot;
  const running = bar.morph === 0;

  const barStyle = {
    position: "absolute",
    top: barTop,
    height: bar.thickness * size,
    background: fill,
  } as const;

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
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          {letters.map((_, i) => {
            const { blur } = getLeadBarLetter(t, i, count, smear);
            return (
              <filter
                key={i}
                id={`${filterId}-${i}`}
                x="-60%"
                y="-10%"
                width="220%"
                height="120%"
              >
                <feGaussianBlur stdDeviation={`${blur * unit} 0`} />
              </filter>
            );
          })}
        </defs>
      </svg>
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          fontFamily,
          fontSize: size,
          lineHeight: 1,
          fontWeight,
          fontVariationSettings: `"wght" ${fontWeight}`,
          color,
          whiteSpace: "pre",
        }}
      >
        {letters.map((char, i) => {
          const letter = getLeadBarLetter(t, i, count, smear);
          return (
            <span
              key={i}
              style={{ position: "relative", display: "inline-block" }}
            >
              <span
                style={{
                  display: "inline-block",
                  opacity: letter.opacity,
                  transform: `translate(${letter.x * size}px, ${letter.y * size}px) scaleX(${letter.scaleX})`,
                  transformOrigin: "100% 50%",
                  filter:
                    letter.blur > 0.05 ? `url(#${filterId}-${i})` : undefined,
                }}
              >
                {char}
              </span>
              {running && i === barSlot ? (
                <span
                  style={{
                    ...barStyle,
                    left: `${barInSlot * 100}%`,
                    width: barWidth * bar.grow,
                  }}
                />
              ) : null}
            </span>
          );
        })}
        {running ? null : (
          <span
            style={{
              ...barStyle,
              left: `${(1 - bar.morph) * 100}%`,
              width: `calc(${barWidth * (1 - bar.morph)}px + ${bar.morph * 100}%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
