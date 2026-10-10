"use client";

import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/300-italic.css";
import "@fontsource/inter/500-italic.css";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  type BrandGuidelinesProps,
  resolveBrandGuidelinesProps,
} from "./content";
import {
  atFps,
  BRAND_GUIDELINES_FPS,
  BRAND_GUIDELINES_FRAMES,
  BRAND_GUIDELINES_HEIGHT,
  BRAND_GUIDELINES_WIDTH,
} from "./motion";
import { ClosingIdentity } from "./scenes/closing";
import { ObjectCollage } from "./scenes/collage";
import { Identity } from "./scenes/identity";
import { Palette } from "./scenes/palette";
import { Typography } from "./scenes/typography";

export type {
  BrandGuidelinesContent,
  BrandGuidelinesPhotos,
  BrandGuidelinesProps,
  BrandGuidelinesTheme,
} from "./content";
export {
  brandGuidelinesContent,
  brandGuidelinesPhrases,
  brandGuidelinesTheme,
} from "./content";
export {
  BRAND_GUIDELINES_FPS,
  BRAND_GUIDELINES_FRAMES,
  BRAND_GUIDELINES_HEIGHT,
  BRAND_GUIDELINES_WIDTH,
  brandGuidelinesTimeline,
} from "./motion";

export function BrandGuidelines(props: BrandGuidelinesProps) {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = (currentFrame / fps) * BRAND_GUIDELINES_FPS;
  const {
    brandName,
    accentColor,
    content,
    theme,
    phrases,
    closingWords,
    photos,
    logoSrc,
    reducedMotion,
  } = props;
  const scene = useMemo(
    () =>
      resolveBrandGuidelinesProps({
        brandName,
        accentColor,
        content,
        theme,
        phrases,
        closingWords,
        photos,
        logoSrc,
        reducedMotion,
      }),
    [
      brandName,
      accentColor,
      content,
      theme,
      phrases,
      closingWords,
      photos,
      logoSrc,
      reducedMotion,
    ],
  );
  const scale = Math.min(width / 960, height / 540);
  const at = (f: number) => atFps(f, fps);
  return (
    <AbsoluteFill
      style={{
        background: scene.theme.paper,
        color: scene.theme.ink,
        overflow: "hidden",
        fontFamily: '"Manrope", sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 960,
          height: 540,
          left: (width - 960 * scale) / 2,
          top: (height - 540 * scale) / 2,
          scale,
          transformOrigin: "0 0",
          overflow: "hidden",
        }}
      >
        <Sequence
          name="Identity"
          from={0}
          durationInFrames={at(118)}
          layout="none"
        >
          <Identity scene={scene} frame={frame} />
        </Sequence>
        <Sequence
          name="Palette"
          from={at(118)}
          durationInFrames={at(326) - at(118)}
          layout="none"
        >
          <Palette scene={scene} frame={frame} />
        </Sequence>
        <Sequence
          name="Typography"
          from={at(294)}
          durationInFrames={at(806) - at(294)}
          layout="none"
        >
          <Typography scene={scene} frame={frame} />
        </Sequence>
        <Sequence
          name="Object collage"
          from={at(614)}
          durationInFrames={at(806) - at(614)}
          layout="none"
        >
          <ObjectCollage scene={scene} frame={frame} />
        </Sequence>
        <Sequence
          name="Closing identity"
          from={at(806)}
          durationInFrames={at(1072) - at(806)}
          layout="none"
        >
          <ClosingIdentity scene={scene} frame={frame} />
        </Sequence>
      </div>
      {props.audioSrc?.trim() ? (
        <Audio
          src={props.audioSrc}
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

export const brandGuidelinesConfig = {
  componentName: "BrandGuidelines",
  importPath: "@/components/remocn/templates/brand-guidelines",
  controls: {
    brandName: {
      type: "text-content" as const,
      default: "Form Study",
      description: "Brand name across the identity posters and closing lockup",
    },
    accentColor: {
      type: "color" as const,
      default: "#A64B38",
      description: "Mark, palette panel and active typography",
    },
    reducedMotion: {
      type: "boolean" as const,
      default: false,
      description:
        "Static layouts without typing, collage travel or tile flips",
    },
  },
  durationInFrames: BRAND_GUIDELINES_FRAMES,
  fps: BRAND_GUIDELINES_FPS,
  compositionWidth: BRAND_GUIDELINES_WIDTH,
  compositionHeight: BRAND_GUIDELINES_HEIGHT,
};
