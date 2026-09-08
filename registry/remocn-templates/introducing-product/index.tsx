"use client";

import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import {
  type IntroducingProductProps,
  resolveIntroducingProps,
} from "./content";
import {
  INTRODUCING_DURATION,
  INTRODUCING_FPS,
  INTRODUCING_HEIGHT,
  INTRODUCING_WIDTH,
  introducingTimeline,
  type SceneId,
  sceneFrames,
} from "./motion";
import { BrandScene } from "./scenes/brand";
import { ComposeScene } from "./scenes/compose";
import { CustomizeScene } from "./scenes/customize";
import { GalleryScene } from "./scenes/gallery";
import { HookScene } from "./scenes/hook";
import { InstallScene } from "./scenes/install";
import { OutroScene } from "./scenes/outro";
import { OwnershipScene } from "./scenes/ownership";
import { ShowcaseScene } from "./scenes/showcase";
import { introducingScoreDataUri } from "./soundtrack";

export type {
  IntroducingContent,
  IntroducingProductProps,
  IntroducingTheme,
} from "./content";
export { introducingContent, introducingTheme } from "./content";
export {
  INTRODUCING_DURATION,
  INTRODUCING_FPS,
  INTRODUCING_HEIGHT,
  INTRODUCING_WIDTH,
  introducingTimeline,
} from "./motion";

export const introducingScenes = {
  hook: HookScene,
  brand: BrandScene,
  install: InstallScene,
  gallery: GalleryScene,
  customize: CustomizeScene,
  compose: ComposeScene,
  showcase: ShowcaseScene,
  ownership: OwnershipScene,
  outro: OutroScene,
} satisfies Record<SceneId, typeof HookScene>;

export function IntroducingProduct(props: IntroducingProductProps) {
  const { width, height, fps } = useVideoConfig();
  const resolved = resolveIntroducingProps(props);
  const scale = Math.min(
    width / INTRODUCING_WIDTH,
    height / INTRODUCING_HEIGHT,
  );
  const sound = props.sound ?? true;
  const audio = useMemo(
    () =>
      sound ? props.audioSrc?.trim() || introducingScoreDataUri() : undefined,
    [sound, props.audioSrc],
  );
  const volume = Number.isFinite(props.volume)
    ? Math.max(0, Math.min(1, props.volume ?? 0.8))
    : 0.8;
  return (
    <AbsoluteFill
      style={{
        background: resolved.theme.ink,
        overflow: "hidden",
        fontFamily: "Manrope, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={
          {
            position: "absolute",
            width: INTRODUCING_WIDTH,
            height: INTRODUCING_HEIGHT,
            left: (width - INTRODUCING_WIDTH * scale) / 2,
            top: (height - INTRODUCING_HEIGHT * scale) / 2,
            scale,
            transformOrigin: "0 0",
            "--font-geist-sans": "Manrope, sans-serif",
          } as React.CSSProperties
        }
      >
        {introducingTimeline.map((scene) => {
          const Scene = introducingScenes[scene.id];
          return (
            <Sequence
              key={scene.id}
              name={scene.name}
              {...sceneFrames(scene, fps)}
            >
              <Scene {...resolved} />
            </Sequence>
          );
        })}
      </div>
      {audio ? (
        <Audio
          src={audio}
          volume={(f) =>
            volume *
            Math.min(1, Math.max(0, (INTRODUCING_DURATION - f / fps) / 0.7))
          }
        />
      ) : null}
    </AbsoluteFill>
  );
}

export const introducingProductConfig = {
  componentName: "IntroducingProduct",
  importPath: "@/components/remocn/templates/introducing-product",
  controls: {
    productName: {
      type: "text-content" as const,
      default: "remocn",
      description: "Product name",
    },
    website: {
      type: "text-content" as const,
      default: "remocn.dev",
      description: "Website",
    },
    accentColor: {
      type: "color" as const,
      default: "#D4B3FF",
      description: "Accent color",
    },
    sound: {
      type: "boolean" as const,
      default: true,
      description: "Original soundtrack",
    },
    volume: {
      type: "number" as const,
      default: 0.8,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Sound volume",
      hiddenFromList: false,
    },
  },
  durationInFrames: INTRODUCING_DURATION * INTRODUCING_FPS,
  fps: INTRODUCING_FPS,
  compositionWidth: INTRODUCING_WIDTH,
  compositionHeight: INTRODUCING_HEIGHT,
};
