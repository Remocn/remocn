import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    fromLabel: {
      type: "text-content",
      default: "from",
      description: "From label",
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
    shiftDuration: {
      type: "number",
      default: 52,
      min: 12,
      max: 120,
      step: 4,
      description: "Shift length (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Space Grotesk", grain: true }),
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
