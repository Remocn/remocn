import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const clockSweepConfig: ComponentConfig = {
  componentName: "ClockSweep",
  importPath: "@/components/remocn/clock-sweep",
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
    minutes: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Minutes",
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
