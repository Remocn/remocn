import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const replayWipeConfig: ComponentConfig = {
  componentName: "ReplayWipe",
  importPath: "@/components/remocn/replay-wipe",
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
    wipeLength: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
      step: 1,
      description: "Wipe length",
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
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
