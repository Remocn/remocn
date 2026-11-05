import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const noButsConfig: ComponentConfig = {
  componentName: "NoButs",
  importPath: "@/components/remocn/no-buts",
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
  durationInFrames: 255,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
