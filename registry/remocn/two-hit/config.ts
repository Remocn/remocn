import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const twoHitConfig: ComponentConfig = {
  componentName: "TwoHit",
  importPath: "@/components/remocn/two-hit",
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
      default: "Premieres Friday.",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "Streaming now.",
      description: "After",
    },
    hitAt: {
      type: "number",
      default: 34,
      min: 0,
      max: 102,
      step: 1,
      description: "Hit at",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
