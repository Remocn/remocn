import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const distributionShiftConfig: ComponentConfig = {
  componentName: "DistributionShift",
  importPath: "@/components/remocn/distribution-shift",
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
    unit: {
      type: "text-content",
      default: "ms",
      description: "Unit",
    },
    label: {
      type: "text-content",
      default: "p99 latency",
      description: "Label",
    },
    before: {
      type: "number",
      default: 840,
      min: 0,
      max: 2520,
      step: 1,
      description: "Before",
      hiddenFromList: false,
    },
    after: {
      type: "number",
      default: 120,
      min: 0,
      max: 360,
      step: 1,
      description: "After",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
