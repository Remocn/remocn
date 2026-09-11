"use client";

import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { type LaunchAnythingProps, resolveLaunchProps } from "./content";
import {
  LAUNCH_FPS,
  LAUNCH_FRAMES,
  LAUNCH_HEIGHT,
  LAUNCH_WIDTH,
  launchTimeline,
} from "./motion";
import { Action } from "./scenes/action";
import { Address, ClosingMark } from "./scenes/closing";
import { Industry } from "./scenes/industry";
import { Opening } from "./scenes/opening";
import { Portal } from "./scenes/portal";
import { Proof } from "./scenes/proof";
import { Showcase } from "./scenes/showcase";
import { Space } from "./scenes/space";

export { launchMedia } from "./assets";
export type {
  LaunchAnythingProps,
  LaunchContent,
  LaunchMedia,
} from "./content";
export { launchContent } from "./content";
export {
  LAUNCH_FPS,
  LAUNCH_FRAMES,
  LAUNCH_HEIGHT,
  LAUNCH_WIDTH,
  launchTimeline,
  showcaseTimeline,
} from "./motion";

const scenes = {
  opening: Opening,
  action: Action,
  portal: Portal,
  showcase: Showcase,
  proof: Proof,
  industry: Industry,
  space: Space,
  address: Address,
  mark: ClosingMark,
};

export function LaunchAnything(props: LaunchAnythingProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const scene = resolveLaunchProps(props);
  const scale = Math.min(width / 480, height / 270);
  const volume = Number.isFinite(props.volume)
    ? Math.min(1, Math.max(0, props.volume ?? 1))
    : 1;
  return (
    <AbsoluteFill
      name="Product Showcase"
      style={{
        background: "#122d24",
        color: "#fff",
        overflow: "hidden",
        fontFamily: "Manrope, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (width - 480 * scale) / 2,
          top: (height - 270 * scale) / 2,
          width: 480,
          height: 270,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          overflow: "hidden",
        }}
      >
        {launchTimeline.map((shot) => {
          const Component = scenes[shot.id];
          return (
            <Sequence
              key={shot.id}
              name={shot.id}
              from={Math.round((shot.from / LAUNCH_FPS) * fps)}
              durationInFrames={
                Math.round((shot.to / LAUNCH_FPS) * fps) -
                Math.round((shot.from / LAUNCH_FPS) * fps)
              }
              layout="none"
            >
              <Component scene={scene} t={frame / fps} />
            </Sequence>
          );
        })}
      </div>
      {props.audioSrc?.trim() ? (
        <Audio src={props.audioSrc} volume={volume} />
      ) : null}
    </AbsoluteFill>
  );
}

export const ProductShowcase = LaunchAnything;
export type ProductShowcaseProps = LaunchAnythingProps;

export const launchAnythingConfig = {
  componentName: "ProductShowcase",
  importPath: "@/components/remocn/templates/launch-anything",
  controls: {
    opening: {
      type: "text-content" as const,
      default: "Good",
      description: "First chrome word",
    },
    subject: {
      type: "text-content" as const,
      default: "ideas",
      description: "Second chrome word",
    },
    brandUrl: {
      type: "text-content" as const,
      default: "yourproduct.example",
      description: "Closing website address",
    },
    accentColor: {
      type: "color" as const,
      default: "#245744",
      description: "Product interface accent",
    },
  },
  durationInFrames: LAUNCH_FRAMES,
  fps: LAUNCH_FPS,
  compositionWidth: LAUNCH_WIDTH,
  compositionHeight: LAUNCH_HEIGHT,
};
