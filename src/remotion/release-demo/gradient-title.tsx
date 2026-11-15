import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadGeist("normal", { weights: ["600"] });

/** Geist 600 averages a little over half an em per glyph at tight tracking. */
const GLYPH_EM = 0.56;

export const PAPER = "#F7F7F8";
export const NIGHT = "#050507";

export type Tone = "light" | "dark";

/** Frames the line spends coming in and going out through the RGB split. */
const EDGE = 7;

const ease = Easing.out(Easing.cubic);

/**
 * One line of very large type with a live gradients.sh gradient painted
 * inside the letters.
 *
 * The gradient is a full-frame WebGL ground. Over it sits a flat layer with
 * the type cut into it: white paper with black type in `screen` (light tone),
 * or black with white type in `multiply` (dark tone). Either way the ground
 * only shows through the glyphs.
 *
 * The line enters and leaves through a chromatic split with a horizontal
 * smear, so hard cuts between lines read as one continuous voice.
 */
export function GradientTitle({
  text,
  value,
  preset,
  tone = "light",
  maxSize = 200,
  push = 0.04,
  timeOffset = 0,
  grain,
}: {
  text: string;
  /** Optional number that counts up from 0 in front of the text. */
  value?: number;
  preset: GshPresetId;
  tone?: Tone;
  maxSize?: number;
  /** Scale the line settles from over the beat, for a slow push in. */
  push?: number;
  timeOffset?: number;
  /** gradients.sh film grain inside the letters, 0 to 1. Preset value if unset. */
  grain?: number;
}) {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const filterId = `rgb-${useId().replace(/:/g, "")}`;
  // Short beats (rapid word swaps) get a shorter split so the word still lands.
  const edge = Math.max(2, Math.min(EDGE, Math.floor(durationInFrames / 4)));

  const current =
    value === undefined
      ? 0
      : Math.round(
          interpolate(
            frame,
            [0, Math.min(durationInFrames - edge, 36)],
            [0, value],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.quad),
            },
          ),
        );
  // Size against the final string so the line does not grow while counting.
  const sized = value === undefined ? text : `${value} ${text}`;
  const fontSize = Math.min(
    maxSize,
    (width * 0.84) / (sized.length * GLYPH_EM),
  );

  const enter = interpolate(frame, [0, edge], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const leave = interpolate(
    frame,
    [durationInFrames - edge, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );
  const glitch = Math.max(enter, leave);
  const split = glitch * 14;
  const smear = glitch * 18;
  const opacity = 1 - leave * 0.85;
  const scale = interpolate(
    frame,
    [0, Math.max(durationInFrames, 60)],
    [1 + push, 1],
    {
      extrapolateRight: "clamp",
      easing: ease,
    },
  );

  const light = tone === "light";
  const paper = light ? PAPER : NIGHT;
  const ink = light ? "#000" : "#fff";

  return (
    <AbsoluteFill style={{ backgroundColor: paper }}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={`${smear} 0`}
            result="s"
          />
          <feOffset in="s" dx={-split} result="ro" />
          <feColorMatrix
            in="ro"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="r"
          />
          <feColorMatrix
            in="s"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="g"
          />
          <feOffset in="s" dx={split} result="bo" />
          <feColorMatrix
            in="bo"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="b"
          />
          <feComposite
            in="r"
            in2="g"
            operator="arithmetic"
            k2="1"
            k3="1"
            result="rg"
          />
          <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          isolation: "isolate",
          filter: glitch > 0.01 ? `url(#${filterId})` : undefined,
          opacity,
        }}
      >
        <AbsoluteFill
          style={{
            filter: light
              ? "brightness(0.95) saturate(1.25)"
              : "brightness(2.4) saturate(1.2)",
          }}
        >
          <GshGround
            preset={preset}
            params={grain === undefined ? undefined : { grain }}
            timeOffset={timeOffset}
            resolution={0.5}
          />
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            backgroundColor: paper,
            mixBlendMode: light ? "screen" : "multiply",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: `"${geist.fontFamily}", system-ui, sans-serif`,
              fontWeight: 600,
              fontSize,
              lineHeight: 1,
              letterSpacing: "-0.045em",
              color: ink,
              whiteSpace: "nowrap",
              transform: `scale(${scale})`,
            }}
          >
            {value === undefined ? null : (
              // The final value, hidden, holds the slot at its full width so
              // the words beside it stay put while the number counts up.
              <span
                style={{
                  display: "inline-grid",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span style={{ gridArea: "1 / 1", visibility: "hidden" }}>
                  {value}
                </span>
                <span style={{ gridArea: "1 / 1", textAlign: "right" }}>
                  {current}
                </span>
              </span>
            )}
            {value === undefined ? "" : " "}
            {text}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
