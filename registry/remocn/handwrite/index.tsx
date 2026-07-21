"use client";

import { loadFont } from "@remotion/google-fonts/Caveat";
import { useCurrentFrame } from "remotion";
import { DEFAULT_STEP, hashRange, qf, qstep } from "@/lib/remocn/stop-motion";

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
}

export function Handwrite({
  text,
  fontSize = 54,
  color = "#26242c",
  delay = 0,
  perStep = 1.6,
  weight = 600,
  align = "center",
  fontFamily = HAND_FAMILY,
  step = DEFAULT_STEP,
}: HandwriteProps) {
  const frame = useCurrentFrame();
  const steps = Math.max(0, qstep(Math.max(0, qf(frame, step) - delay), step));
  const shown = Math.floor(steps * perStep);
  const chars = Array.from(text);
  const freshFrom = shown - Math.ceil(perStep);

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
          const visible = i < shown;
          const slant = hashRange(`hw:${text}:${i}:r`, -3.2, 3.2);
          const dy = hashRange(`hw:${text}:${i}:y`, -1.8, 1.8);
          const fresh = visible && i >= freshFrom;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: visible ? 1 : 0,
                transform: visible
                  ? `translateY(${dy}px) rotate(${slant}deg) scale(${fresh ? 1.06 : 1})`
                  : undefined,
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
  const perStep = options?.perStep ?? 1.6;
  const step = options?.step ?? DEFAULT_STEP;
  return Math.ceil(Array.from(text).length / perStep) * step + step;
}
