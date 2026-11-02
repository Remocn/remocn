import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const halfBuiltConfig: ComponentConfig = {
  componentName: "HalfBuilt",
  importPath: "@/components/remocn/half-built",
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
    progress: {
      type: "number",
      default: 1.6,
      min: 0,
      max: 4.8,
      step: 0.01,
      description: "Progress",
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
