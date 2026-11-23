import { loadFont } from "@remotion/google-fonts/Geist";
import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Composition,
  registerRoot,
  useCurrentFrame,
} from "remotion";

// Motions that come to rest, and cures that switch off at rest: plain text,
// a tilt, a tilt only while moving, and `will-change: transform`. Rendered and
// measured by `scripts/jitter-lab.mts`.
const { fontFamily } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export const TEXT = "Steady motion holds 0123";
export const LAST = 48;
export const END = 36;
export const ROW = 56;
export const TOP = 16;
export const LEFT = 120;

type Treat = {
  id: string;
  style: (moving: boolean) => { add?: string; outer?: CSSProperties };
  wrap?: CSSProperties;
};
export const TREATS: Treat[] = [
  { id: "plain", style: () => ({}) },
  { id: "tilt always", style: () => ({ add: " rotate(0.05deg)" }) },
  {
    id: "tilt while moving",
    style: (moving) => ({ add: moving ? " rotate(0.05deg)" : "" }),
  },
  {
    id: "layer always",
    style: () => ({ outer: { willChange: "transform" } }),
  },
  {
    id: "layer while moving",
    style: (moving) => ({
      outer: moving ? { willChange: "transform" } : {},
    }),
  },
  {
    id: "layer on static parent",
    style: () => ({}),
    wrap: { willChange: "transform" },
  },
  {
    id: "layer + tilt moving",
    style: (moving) => ({
      add: moving ? " rotate(0.05deg)" : "",
      outer: moving ? { willChange: "transform" } : {},
    }),
  },
];

const ease = (f: number) => 1 - (1 - Math.min(1, f / END)) ** 3;
export const MOTIONS = {
  in: {
    param: (f: number) => 0.9 + 0.1 * ease(f),
    css: (v: number) => `scale(${v})`,
  },
  zoom: {
    param: (f: number) => 1 + 0.3 * ease(f),
    css: (v: number) => `scale(${v})`,
  },
  ty: {
    param: (f: number) => 6.3 * (1 - ease(f)),
    css: (v: number) => `translateY(${v}px)`,
  },
} as const;
export const paramAt = (motion: keyof typeof MOTIONS, f: number) =>
  MOTIONS[motion].param(f);

function Lab({ motion }: { motion: keyof typeof MOTIONS }) {
  const frame = useCurrentFrame();
  const moving = frame > 0 && frame < END;
  const { param, css } = MOTIONS[motion];
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      {TREATS.map((treat, i) => {
        const { add, outer } = treat.style(moving);
        return (
          <div
            key={treat.id}
            style={{
              position: "absolute",
              left: LEFT,
              top: TOP + i * ROW,
              height: ROW,
              display: "flex",
              alignItems: "center",
              ...treat.wrap,
            }}
          >
            <div
              style={{
                transform: css(param(frame)) + (add ?? ""),
                transformOrigin: "0 50%",
                ...outer,
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: 30,
                  lineHeight: "40px",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  color: "#000",
                  whiteSpace: "pre",
                  display: "block",
                }}
              >
                {TEXT}
              </span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    {(Object.keys(MOTIONS) as (keyof typeof MOTIONS)[]).map((motion) => (
      <Composition
        key={motion}
        id={motion}
        component={Lab}
        defaultProps={{ motion }}
        durationInFrames={LAST + 1}
        fps={30}
        width={1280}
        height={720}
      />
    ))}
  </>
));
