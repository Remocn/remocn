"use client";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveStudioProps, type StudioLaunchProps } from "./content";
import {
  STUDIO_FPS,
  STUDIO_FRAMES,
  STUDIO_HEIGHT,
  STUDIO_WIDTH,
  studioTimeline,
} from "./motion";
import { Editor } from "./scenes/editor";
import { Feed } from "./scenes/feed";
import { Gate } from "./scenes/gate";
import { Host } from "./scenes/host";
import { Opening } from "./scenes/opening";
import { Outro } from "./scenes/outro";
import { Sell } from "./scenes/sell";
import { Workspace } from "./scenes/workspace";

export type { StudioContent, StudioLaunchProps, StudioMedia } from "./content";
export { studioContent } from "./content";
export {
  STUDIO_FPS,
  STUDIO_FRAMES,
  STUDIO_HEIGHT,
  STUDIO_WIDTH,
  studioTimeline,
} from "./motion";

const scenes = {
  opening: Opening,
  feed: Feed,
  workspace: Workspace,
  gate: Gate,
  host: Host,
  editor: Editor,
  sell: Sell,
  outro: Outro,
};

export function StudioLaunch(props: StudioLaunchProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const nativeFrame = Math.floor(t * STUDIO_FPS + 1e-6);
  const shot =
    studioTimeline.find(
      (scene) => nativeFrame >= scene.from && nativeFrame < scene.to,
    ) ?? studioTimeline[studioTimeline.length - 1];
  const Scene = scenes[shot.id];
  const scale = Math.min(width / 480, height / 270);
  const volume = Number.isFinite(props.volume)
    ? Math.max(0, Math.min(1, props.volume ?? 1))
    : 1;
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        color: "white",
        overflow: "hidden",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 500,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`.studio-launch-canvas, .studio-launch-canvas * { box-sizing: border-box; }`}</style>
      <div
        className="studio-launch-canvas"
        style={{
          position: "absolute",
          width: 480,
          height: 270,
          overflow: "hidden",
          left: (width - 480 * scale) / 2,
          top: (height - 270 * scale) / 2,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <Scene {...resolveStudioProps(props, t)} />
      </div>
      {props.audioSrc?.trim() ? (
        <Audio src={props.audioSrc} volume={volume} />
      ) : null}
    </AbsoluteFill>
  );
}
export const studioLaunchConfig = {
  componentName: "StudioLaunch",
  importPath: "@/components/remocn/templates/studio-launch",
  controls: {
    brandName: {
      type: "text-content" as const,
      default: "remocn",
      description: "Brand name throughout the video",
    },
    accentColor: {
      type: "color" as const,
      default: "#81bfff",
      description: "Atmospheric light and brand accent",
    },
  },
  durationInFrames: STUDIO_FRAMES,
  fps: STUDIO_FPS,
  compositionWidth: STUDIO_WIDTH,
  compositionHeight: STUDIO_HEIGHT,
};
