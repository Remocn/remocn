import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const wordPullbackConfig: ComponentConfig = {
  componentName: "WordPullback",
  importPath: "@/components/remocn/word-pullback",
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
      default: "The",
      description: "Before",
    },
    accentWord: {
      type: "text-content",
      default: "cinematic",
      description: "Accent word",
    },
    after: {
      type: "text-content",
      default: "toolkit for every launch",
      description: "After",
    },
  },
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
