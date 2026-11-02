import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const flashSweepConfig: ComponentConfig = {
  componentName: "FlashSweep",
  importPath: "@/components/remocn/flash-sweep",
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
    direction: {
      type: "enum",
      default: "right",
      variants: {
        right: {},
        left: {},
      },
      description: "Direction",
    },
    angle: {
      type: "number",
      default: 22,
      min: 0,
      max: 66,
      step: 1,
      description: "Angle",
      hiddenFromList: false,
    },
    duration: {
      type: "number",
      default: 12,
      min: 0,
      max: 36,
      step: 1,
      description: "Duration",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold",
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
  durationInFrames: 156,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
