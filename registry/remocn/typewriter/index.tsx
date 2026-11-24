"use client";

import { Caret } from "@/components/remocn/caret";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { revealedText } from "@/lib/remocn-ui";
import { type TypewriterElementId, typewriterTimeline } from "./timeline";

export interface TypewriterProps {
  text: string;
  cursor?: boolean;
  charsPerSecond?: number;
  speed?: number;
  fontSize?: number;
  color?: string;
  cursorColor?: string;
  fontWeight?: number;
  className?: string;
  /**
   * Moves, trims or stretches the typing, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<TypewriterElementId>;
}

export function Typewriter(props: TypewriterProps) {
  const {
    text,
    cursor = true,
    speed = 1,
    fontSize = 48,
    color = "#171717",
    cursorColor = "#171717",
    fontWeight = 600,
    className,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    typewriterTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const type = tl.get("type");
  const local = frame * speed - type.start;
  const len = text.length;
  const count =
    local <= 0
      ? 0
      : type.length <= 0
        ? len
        : Math.max(0, Math.min(len, Math.floor((local / type.length) * len)));
  const tw = {
    text: revealedText(text, count),
    typing: count > 0 && count < len,
  };

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
          letterSpacing: "-0.03em",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
          whiteSpace: "pre",
        }}
      >
        {tw.text}
        {cursor && (
          <Caret
            color={cursorColor}
            blink={!tw.typing}
            speed={speed}
            radius={0}
            style={{
              width: "0.08em",
              height: "1em",
              marginLeft: "0.04em",
              verticalAlign: "text-bottom",
            }}
          />
        )}
      </span>
    </div>
  );
}
