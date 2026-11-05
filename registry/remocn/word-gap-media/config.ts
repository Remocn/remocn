import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const wordGapMediaConfig: ComponentConfig = {
  componentName: "WordGapMedia",
  importPath: "@/components/remocn/word-gap-media",
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
    before: {
      type: "text-content",
      default: "Launch all",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "of this",
      description: "After",
    },
  },
  durationInFrames: 168,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
