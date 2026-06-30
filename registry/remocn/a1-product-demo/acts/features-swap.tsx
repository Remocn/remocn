"use client";

import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { FLOW_BG, FLOW_INK, FLOW_YELLOW, FONT_SERIF } from "../foundation";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const VERBS = ["simplify", "organize", "facilitate"];
const PHASE = 24;
const SLOT_W = 256;
const FONT_SIZE = 56;

export function FeaturesSwap({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;

  const lineReveal = interpolate(f, [0, 14], [0, 1], clamp);
  const lineShift = interpolate(lineReveal, [0, 1], [18, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: FLOW_BG,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          whiteSpace: "nowrap",
          fontFamily: FONT_SERIF,
          fontSize: FONT_SIZE,
          fontWeight: 400,
          color: FLOW_INK,
          opacity: lineReveal,
          transform: `translateY(${lineShift}px)`,
        }}
      >
        <span>Features designed to&nbsp;</span>
        <span
          style={{
            position: "relative",
            display: "inline-block",
            width: SLOT_W,
            height: "1em",
          }}
        >
          {VERBS.map((verb, i) => {
            const tIn = i * PHASE;
            const inProg = interpolate(f, [tIn, tIn + 10], [0, 1], clamp);
            const outProg =
              i < VERBS.length - 1
                ? interpolate(f, [tIn + PHASE, tIn + PHASE + 10], [0, 1], clamp)
                : 0;
            const opacity = inProg * (1 - outProg);
            const ty = (1 - inProg) * 28 + outProg * -28;
            const blur = (1 - inProg) * 8 + outProg * 8;
            return (
              <span
                key={verb}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  textAlign: "center",
                  color: FLOW_YELLOW,
                  opacity,
                  transform: `translateY(${ty}px)`,
                  filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                  willChange: "transform, filter, opacity",
                }}
              >
                {verb}
              </span>
            );
          })}
        </span>
        <span>&nbsp;your entire workflow</span>
      </div>
    </AbsoluteFill>
  );
}
