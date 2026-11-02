import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const turnaboutConfig: ComponentConfig = {
  componentName: "Turnabout",
  importPath: "@/components/remocn/turnabout",
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
      default: "You work for the video.",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "The video works for you.",
      description: "After",
    },
    highlight: {
      type: "text-content",
      default: "you.",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
