import { loadFont } from "@remotion/google-fonts/Manrope";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { swirlDissolve } from "@/registry/remocn/swirl-dissolve";

const { fontFamily } = loadFont("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export type NotFoundTheme = "light" | "dark";

export type NotFoundSceneProps = {
  [key: string]: unknown;
  theme: NotFoundTheme;
};

const PALETTE = {
  dark: {
    backdrop: "#111115",
    text: "#eeeeee",
    swirl: ["#1b1926", "#463c5e", "#d4b3ff"],
  },
  light: {
    backdrop: "#ffffff",
    text: "#0a0a0a",
    swirl: ["#f3eefb", "#cdb9ef", "#8266b8"],
  },
} satisfies Record<
  NotFoundTheme,
  { backdrop: string; text: string; swirl: string[] }
>;

export const NOT_FOUND_FPS = 30;
export const NOT_FOUND_WIDTH = 1920;
export const NOT_FOUND_HEIGHT = 720;

const TRANSITION_FRAMES = 90;
const HOLD_FRAMES = 130;

export const NOT_FOUND_DURATION = HOLD_FRAMES * 2 - TRANSITION_FRAMES;

function Code({ color }: { color: string }) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 260,
          fontWeight: 600,
          letterSpacing: "-0.05em",
          color,
        }}
      >
        404
      </span>
    </AbsoluteFill>
  );
}

export function NotFoundScene({ theme }: NotFoundSceneProps) {
  const { backdrop, text, swirl } = PALETTE[theme];

  return (
    <AbsoluteFill style={{ backgroundColor: backdrop }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOLD_FRAMES}>
          <Code color={text} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={swirlDissolve({
            colors: swirl,
            colorBack: backdrop,
            bandCount: 10,
            softness: 0.35,
          })}
        />
        <TransitionSeries.Sequence durationInFrames={HOLD_FRAMES}>
          <Code color={text} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
