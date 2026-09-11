"use client";

import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TeaserBackground } from "./background";
import { type ReleaseTeaserProps, resolveReleaseTeaserProps } from "./content";
import {
  atFps,
  RELEASE_TEASER_FPS,
  RELEASE_TEASER_FRAMES,
  RELEASE_TEASER_HEIGHT,
  RELEASE_TEASER_WIDTH,
} from "./motion";
import { ReleaseLockup } from "./scenes/closing";
import { Statement } from "./scenes/statement";

export type { ReleaseTeaserProps, ReleaseTeaserTheme } from "./content";
export { releaseTeaserStatements, releaseTeaserTheme } from "./content";
export {
  RELEASE_TEASER_FPS,
  RELEASE_TEASER_FRAMES,
  RELEASE_TEASER_HEIGHT,
  RELEASE_TEASER_WIDTH,
  releaseTeaserTimeline,
} from "./motion";

export function ReleaseTeaser(props: ReleaseTeaserProps) {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = (currentFrame / fps) * RELEASE_TEASER_FPS;
  const {
    brandName,
    release,
    tagline,
    statements,
    accentColor,
    theme,
    logoSrc,
    lightIntensity,
    reducedMotion,
  } = props;
  const scene = useMemo(
    () =>
      resolveReleaseTeaserProps({
        brandName,
        release,
        tagline,
        statements,
        accentColor,
        theme,
        logoSrc,
        lightIntensity,
        reducedMotion,
      }),
    [
      brandName,
      release,
      tagline,
      statements,
      accentColor,
      theme,
      logoSrc,
      lightIntensity,
      reducedMotion,
    ],
  );
  const scale = Math.min(width / 960, height / 540);
  return (
    <AbsoluteFill
      style={{
        background: scene.theme.background,
        overflow: "hidden",
        fontFamily: '"Inter", sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (width - 960 * scale) / 2,
          top: (height - 540 * scale) / 2,
          width: 960,
          height: 540,
          scale,
          transformOrigin: "0 0",
          overflow: "hidden",
        }}
      >
        <TeaserBackground scene={scene} frame={frame} />
        <Sequence
          name="An idea"
          from={0}
          durationInFrames={atFps(104, fps)}
          layout="none"
        >
          <Statement
            scene={scene}
            text={scene.statements[0]}
            frame={frame}
            duration={104}
          />
        </Sequence>
        <Sequence
          name="Better work"
          from={atFps(104, fps)}
          durationInFrames={atFps(208, fps) - atFps(104, fps)}
          layout="none"
        >
          <Statement
            scene={scene}
            text={scene.statements[1]}
            frame={frame - 104}
            duration={104}
          />
        </Sequence>
        <Sequence
          name="Every detail"
          from={atFps(208, fps)}
          durationInFrames={atFps(326, fps) - atFps(208, fps)}
          layout="none"
        >
          <Statement
            scene={scene}
            text={scene.statements[2]}
            frame={frame - 208}
            duration={118}
          />
        </Sequence>
        <Sequence
          name="Together"
          from={atFps(326, fps)}
          durationInFrames={atFps(446, fps) - atFps(326, fps)}
          layout="none"
        >
          <Statement
            scene={scene}
            text={scene.statements[3]}
            frame={frame - 326}
            duration={120}
          />
        </Sequence>
        <Sequence
          name="A fresh chapter"
          from={atFps(446, fps)}
          durationInFrames={atFps(610, fps) - atFps(446, fps)}
          layout="none"
        >
          <Statement
            scene={scene}
            text={scene.statements[4]}
            frame={frame - 446}
            duration={164}
          />
        </Sequence>
        <Sequence
          name="Release reveal"
          from={atFps(610, fps)}
          durationInFrames={atFps(960, fps) - atFps(610, fps)}
          layout="none"
        >
          <ReleaseLockup scene={scene} frame={frame - 610} />
        </Sequence>
      </div>
      {props.audioSrc?.trim() ? (
        <Audio
          src={props.audioSrc.trim()}
          volume={
            Number.isFinite(props.volume)
              ? Math.max(0, Math.min(1, props.volume ?? 1))
              : 1
          }
        />
      ) : null}
    </AbsoluteFill>
  );
}

export const releaseTeaserConfig = {
  componentName: "ReleaseTeaser",
  importPath: "@/components/remocn/templates/release-teaser",
  controls: {
    brandName: {
      type: "text-content" as const,
      default: "Orvio",
      description: "Name in the final release lockup",
    },
    release: {
      type: "text-content" as const,
      default: "2",
      description: "Version suffix; leave empty to hide",
    },
    tagline: {
      type: "text-content" as const,
      default: "Your next chapter starts here.",
      description: "Final supporting line",
    },
    accentColor: {
      type: "color" as const,
      default: "#9BC8DD",
      description: "Mark and dimensional edge lighting",
    },
    reducedMotion: {
      type: "boolean" as const,
      default: false,
      description:
        "Static mark and complete statements, without camera motion or blur",
    },
  },
  durationInFrames: RELEASE_TEASER_FRAMES,
  fps: RELEASE_TEASER_FPS,
  compositionWidth: RELEASE_TEASER_WIDTH,
  compositionHeight: RELEASE_TEASER_HEIGHT,
};
