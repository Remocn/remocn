import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const beforeAfterConfig: ComponentConfig = {
  componentName: "BeforeAfter",
  importPath: "@/components/remocn/before-after",
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
    beforeLabel: {
      type: "text-content",
      default: "Before",
      description: "Before label",
    },
    afterLabel: {
      type: "text-content",
      default: "After",
      description: "After label",
    },
    title: {
      type: "text-content",
      default: "Graded in one pass",
      description: "Title",
    },
    fit: {
      type: "enum",
      default: "cover",
      variants: {
        cover: {},
        contain: {},
      },
      description: "Fit",
    },
    pauseAt: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1.5,
      step: 0.01,
      description: "Pause at",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
