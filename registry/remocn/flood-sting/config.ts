import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const floodStingConfig: ComponentConfig = {
  componentName: "FloodSting",
  importPath: "@/components/remocn/flood-sting",
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
    pick: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Pick",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
