import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glyphBlockDecodeConfig: ComponentConfig = {
  componentName: "GlyphBlockDecode",
  importPath: "@/components/remocn/glyph-block-decode",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    name: {
      type: "text-content",
      default: "Remocn Studio",
      description: "Name",
    },
    url: {
      type: "text-content",
      default: "remocn.dev/studio",
      description: "Url",
    },
    seed: {
      type: "number",
      default: 7,
      min: 0,
      max: 21,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
