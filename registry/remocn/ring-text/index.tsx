"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { useEffect, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["100", "900"],
  subsets: ["latin"],
});

export interface RingTextProps {
  text?: string;
  separator?: string;
  radius?: number;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  band?: string;
  tilt?: number;
  roll?: number;
  period?: number;
  speed?: number;
  className?: string;
}

export const ringTextDefaults = {
  text: "Type in motion",
  separator: "•",
  radius: 210,
  fontSize: 40,
  fontWeight: 800,
  fontFamily: INTER,
  color: "#fafafa",
  band: "#0a0a0a",
  tilt: 38,
  roll: -16,
  period: 240,
  speed: 1,
} satisfies Required<Omit<RingTextProps, "className">>;

/** Frame where the entrance has settled into the cruise spin. */
export const ringTextLength = 30;

/** Band height, in em. */
export const ringBandHeight = 1.5;

const ENTRANCE = 30;
const FADE = 12;
const START_SCALE = 0.85;
/** Extra turn, in degrees, that decays over the entrance. */
const ENTRANCE_SPIN = 90;
const WOBBLE = 6;
const WOBBLE_PERIOD = 150;
/** Letters on the far side of the ring dim to this opacity. */
const BACK_OPACITY = 0.55;
/** Advance per character, in em, until the face is measured. */
const FALLBACK_ADVANCE = 0.6;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOutCubic = Easing.out(Easing.cubic);

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getRingTextTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

/** The characters of one lap: the text, a space, the separator, a space. */
export function getRingTextToken(text: string, separator: string) {
  return Array.from(separator ? `${text} ${separator} ` : `${text} `);
}

export interface RingTextPanel {
  /** Index into the token. */
  char: number;
  /** Panel center around the ring, radians. */
  angle: number;
  /** Panel width, reference px. */
  width: number;
}

export interface RingTextLayout {
  radius: number;
  repeats: number;
  /** Extra space added to every character so the band closes, reference px. */
  spacing: number;
  panels: RingTextPanel[];
}

/**
 * Repeats the token as many times as fits the circumference and spreads the
 * remainder as letter spacing. A token longer than the ring grows the radius.
 */
export function getRingTextLayout(
  advances: readonly number[],
  radius: number,
): RingTextLayout {
  const tokenWidth = advances.reduce((sum, a) => sum + Math.max(0, a), 0);
  const count = advances.length;
  if (count === 0 || tokenWidth <= 0) {
    return { radius, repeats: 0, spacing: 0, panels: [] };
  }
  const circumference = Math.max(2 * Math.PI * Math.max(0, radius), tokenWidth);
  const repeats = Math.max(1, Math.floor(circumference / tokenWidth));
  const spacing = (circumference - repeats * tokenWidth) / (repeats * count);
  const panels: RingTextPanel[] = [];
  let travelled = 0;
  for (let r = 0; r < repeats; r++) {
    for (let char = 0; char < count; char++) {
      const width = Math.max(0, advances[char]) + spacing;
      panels.push({
        char,
        angle: (2 * Math.PI * (travelled + width / 2)) / circumference,
        width,
      });
      travelled += width;
    }
  }
  return {
    radius: circumference / (2 * Math.PI),
    repeats,
    spacing,
    panels,
  };
}

/** Ring pose at `t`: spin in degrees, tilt with its wobble, entrance scale and opacity. */
export function getRingTextPose(
  t: number,
  options: { period?: number; tilt?: number } = {},
) {
  const period = Math.max(1, finite(options.period, ringTextDefaults.period));
  const tilt = finite(options.tilt, ringTextDefaults.tilt);
  const settle = easeOutCubic(Math.min(1, Math.max(0, t / ENTRANCE)));
  return {
    spin: (360 * t) / period + ENTRANCE_SPIN * settle,
    tilt: tilt + WOBBLE * Math.sin((2 * Math.PI * t) / WOBBLE_PERIOD),
    scale: START_SCALE + (1 - START_SCALE) * settle,
    opacity: interpolate(t, [0, FADE], [0, 1], CLAMP),
  };
}

/** Letter opacity from how squarely its panel faces the camera. */
export function getRingTextShade(angle: number, spinDegrees: number) {
  const facing = Math.cos(angle - (spinDegrees * Math.PI) / 180);
  return BACK_OPACITY + ((1 - BACK_OPACITY) * (facing + 1)) / 2;
}

function useAdvances(chars: readonly string[], font: string, fallback: number) {
  const key = chars.join("");
  const [advances, setAdvances] = useState<number[] | null>(null);

  useEffect(() => {
    const handle = delayRender("ring-text: measuring the characters");
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
        setAdvances(Array.from(key).map((c) => ctx.measureText(c).width));
      }
      release();
    };
    document.fonts.load(font, key).then(measure, measure);
    return release;
  }, [key, font]);

  return advances ?? chars.map(() => fallback);
}

export function RingText({
  text = ringTextDefaults.text,
  separator = ringTextDefaults.separator,
  radius = ringTextDefaults.radius,
  fontSize = ringTextDefaults.fontSize,
  fontWeight = ringTextDefaults.fontWeight,
  fontFamily = ringTextDefaults.fontFamily,
  color = ringTextDefaults.color,
  band = ringTextDefaults.band,
  tilt = ringTextDefaults.tilt,
  roll = ringTextDefaults.roll,
  period = ringTextDefaults.period,
  speed = ringTextDefaults.speed,
  className,
}: RingTextProps) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const unit = height / 720;
  const t = getRingTextTime(frame, { fps, speed });
  const chars = getRingTextToken(text, separator);
  const advances = useAdvances(
    chars,
    `${fontWeight} ${fontSize}px ${fontFamily}`,
    FALLBACK_ADVANCE * fontSize,
  );
  const layout = getRingTextLayout(advances, radius);
  const pose = getRingTextPose(t, { period, tilt });
  const bandHeight = ringBandHeight * fontSize * unit;
  // Adjacent flat panels meet at an angle and their antialiased edges let the
  // background through; bleeding each panel into its neighbors hides the seam.
  const bleed = 1.5 * Math.max(1, unit);

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
        perspective: 1600 * unit,
        // Opacity lives here: on the preserve-3d ring it would flatten it.
        opacity: pose.opacity,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          // Negative tilt views the ring from above: the near side is at the
          // bottom and reads left to right, the far side shows it mirrored.
          transform: `scale(${pose.scale}) rotateZ(${roll}deg) rotateX(${-pose.tilt}deg) rotateY(${-pose.spin}deg)`,
        }}
      >
        {layout.panels.map((panel, i) => {
          const width = panel.width * unit;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: -width / 2 - bleed,
                top: -bandHeight / 2,
                width: width + 2 * bleed,
                height: bandHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: band,
                color,
                fontFamily,
                fontSize: fontSize * unit,
                lineHeight: 1,
                fontWeight,
                fontVariationSettings: `"wght" ${fontWeight}`,
                whiteSpace: "pre",
                backfaceVisibility: "visible",
                transform: `rotateY(${panel.angle}rad) translateZ(${layout.radius * unit}px)`,
              }}
            >
              {/* Only the letter dims: shading the band per panel would show
                  every seam between panels. */}
              <span
                style={{
                  opacity: getRingTextShade(panel.angle, pose.spin),
                }}
              >
                {chars[panel.char]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
