import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const timeBreakdownConfig: ComponentConfig = {
  componentName: "TimeBreakdown",
  importPath: "@/components/remocn/time-breakdown",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Where the time goes",
      description: "Title",
    },
    beforeLabel: {
      type: "text-content",
      default: "Before",
      description: "Before label",
    },
    afterLabel: {
      type: "text-content",
      default: "With remocn",
      description: "After label",
    },
    caption: {
      type: "text-content",
      default: "less time per video",
      description: "Caption",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
