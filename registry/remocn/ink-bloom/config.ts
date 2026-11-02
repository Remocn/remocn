import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const inkBloomConfig: ComponentConfig = {
  componentName: "InkBloom",
  importPath: "@/components/remocn/ink-bloom",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    seed: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Seed",
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
