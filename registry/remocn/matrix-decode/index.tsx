"use client";

import { random } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

export interface MatrixDecodeProps {
  text: string;
  charset?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  revealDuration?: number;
  speed?: number;
  className?: string;
}

export function MatrixDecode({
  text,
  charset = "!@#$%^&*()_+-=<>?/\\|",
  fontSize = 72,
  color = "#22c55e",
  fontWeight = 600,
  revealDuration = 60,
  speed = 1,
  className,
}: MatrixDecodeProps) {
  const frame = useSceneFrame() * speed;
  // useVideoConfig kept for consistency with sibling primitives
  useSceneConfig();

  let output = "";
  for (let i = 0; i < text.length; i++) {
    const revealFrame = (i / Math.max(text.length, 1)) * revealDuration;
    if (text[i] === " ") {
      output += " ";
    } else if (frame >= revealFrame) {
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
