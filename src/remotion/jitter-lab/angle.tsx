import { loadFont } from "@remotion/google-fonts/Geist";
import {
  AbsoluteFill,
  Composition,
  registerRoot,
  useCurrentFrame,
} from "remotion";

// Which angle takes text off the pixel grid, at which scale of the picture:
// a render at 1x and 2x, and a player that shows the composition smaller.
// Rendered and measured by `scripts/jitter-lab.mts`.
const { fontFamily } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export const TEXT = "Steady 0123";
export const LAST = 48;
export const END = 36;
export const ROW = 100;
export const TOP = 20;
export const LEFT = 120;
const ANGLES = [0, 0.02, 0.028, 0.03, 0.04, 0.05, 0.07, 0.1, 0.2, 0.4];
export const TREATS = ANGLES.map((deg) => ({ id: `rotate ${deg}deg`, deg }));
// The share of the composition's size the picture is shown at, per composition.
export const SHOWN: Record<string, number> = {
  ty: 1,
  "ty-player-75": 0.75,
  "ty-player-50": 0.5,
  "ty-player-30": 0.3,
};

const ease = (f: number) => 1 - (1 - Math.min(1, f / END)) ** 3;
export const paramAt = (_: string, f: number) => 12.6 * (1 - ease(f));

function Lab({ shown }: { shown: number }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: shown === 1 ? undefined : `scale(${shown})`,
          transformOrigin: "0 0",
        }}
      >
        {TREATS.map((treat, i) => (
          <div
            key={treat.id}
            style={{
              position: "absolute",
              left: LEFT,
              top: TOP + i * ROW,
              height: ROW,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                transform: `translateY(${paramAt("", frame)}px)${treat.deg ? ` rotate(${treat.deg}deg)` : ""}`,
                transformOrigin: "0 50%",
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: 64,
                  lineHeight: "80px",
                  fontWeight: 500,
                  letterSpacing: "0.16em",
                  color: "#000",
                  whiteSpace: "pre",
                  display: "block",
                }}
              >
                {TEXT}
              </span>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    {Object.entries(SHOWN).map(([id, shown]) => (
      <Composition
        key={id}
        id={id}
        component={Lab}
        defaultProps={{ shown }}
        durationInFrames={LAST + 1}
        fps={30}
        width={1280}
        height={1040}
      />
    ))}
  </>
));
