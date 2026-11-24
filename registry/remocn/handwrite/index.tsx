"use client";

import { loadFont } from "@remotion/google-fonts/Caveat";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { DEFAULT_STEP, hashRange, qf, qstep } from "@/lib/remocn/stop-motion";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type HandwriteElementId,
  handwriteTimeline,
  PER_STEP,
} from "./timeline";

const { fontFamily: HAND_FAMILY } = loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700"],
});

export interface HandwriteProps {
  text: string;
  fontSize?: number;
  color?: string;
  delay?: number;
  perStep?: number;
  weight?: 400 | 500 | 600 | 700;
  align?: "left" | "center";
  fontFamily?: string;
  step?: number;
  /**
   * Moves, trims or stretches single letters, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay`.
   */
  timing?: Timing<HandwriteElementId>;
}

export function Handwrite(props: HandwriteProps) {
  const {
    text,
    fontSize = 54,
    color = "#26242c",
    delay = 0,
    weight = 600,
    align = "center",
    fontFamily = HAND_FAMILY,
    step = DEFAULT_STEP,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(handwriteTimeline, props, durationInFrames, timing);
  const steps = Math.max(0, qstep(Math.max(0, qf(frame, step) - delay), step));
  // The pose the writing is on, in frames after `delay`.
  const at = steps * step;
  const chars = Array.from(text);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        background: "transparent",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: `${fontFamily}, cursive`,
          fontWeight: weight,
          fontSize,
          lineHeight: 1.15,
          color,
          whiteSpace: "pre-wrap",
          textAlign: align,
        }}
      >
        {chars.map((char, i) => {
          const e = tl.elements[i];
          const visible = e !== undefined && at >= e.start;
          const slant = hashRange(`hw:${text}:${i}:r`, -3.2, 3.2);
          const dy = hashRange(`hw:${text}:${i}:y`, -1.8, 1.8);
          const fresh = visible && at < e.end;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: visible ? 1 : 0,
                translate: visible ? `0 ${dy}px` : undefined,
                rotate: visible ? `${slant}deg` : undefined,
                scale: visible ? `${fresh ? 1.06 : 1}` : undefined,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </div>
  );
}

export function handwriteDuration(
  text: string,
  options?: { perStep?: number; step?: number },
): number {
  const perStep = options?.perStep ?? PER_STEP;
  const step = options?.step ?? DEFAULT_STEP;
  return Math.ceil(Array.from(text).length / perStep) * step + step;
}
