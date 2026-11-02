import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const timingTowerConfig: ComponentConfig = {
  componentName: "TimingTower",
  importPath: "@/components/remocn/timing-tower",
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
    code: {
      type: "text-content",
      default: "RMC",
      description: "Code",
    },
    interval: {
      type: "text-content",
      default: "+12.408",
      description: "Interval",
    },
    intervalLabel: {
      type: "text-content",
      default: "Gap to P2",
      description: "Interval label",
    },
    lap: {
      type: "number",
      default: 41,
      min: 0,
      max: 123,
      step: 1,
      description: "Lap",
      hiddenFromList: false,
    },
    laps: {
      type: "number",
      default: 58,
      min: 0,
      max: 174,
      step: 1,
      description: "Laps",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
