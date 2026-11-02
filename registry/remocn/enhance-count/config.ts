import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const enhanceCountConfig: ComponentConfig = {
  componentName: "EnhanceCount",
  importPath: "@/components/remocn/enhance-count",
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
    text: {
      type: "text-content",
      default: "Draft it fast.\nFinish it sharp.",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "sharp.",
      description: "Highlight",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
