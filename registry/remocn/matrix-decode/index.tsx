"use client";

import { random } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type MatrixDecodeElementId, matrixDecodeTimeline } from "./timeline";

export interface MatrixDecodeProps {
  text: string;
  charset?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  revealDuration?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single letters, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<MatrixDecodeElementId>;
}

export function MatrixDecode(props: MatrixDecodeProps) {
  const {
    text,
    charset = "!@#$%^&*()_+-=<>?/\\|",
    fontSize = 72,
    color = "#22c55e",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    matrixDecodeTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  let output = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " ") {
      output += " ";
    } else if (frame >= tl.get(`char:${i}`).start) {
      output += text[i];
    } else {
      const r = random(`${i}-${Math.floor(frame / 2)}`);
      const ch = charset[Math.floor(r * charset.length)];
      output += ch;
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "0.05em",
          whiteSpace: "pre",
          fontFamily:
            "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {output}
      </span>
    </div>
  );
}
