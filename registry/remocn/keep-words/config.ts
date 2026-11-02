import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const keepWordsConfig: ComponentConfig = {
  componentName: "KeepWords",
  importPath: "@/components/remocn/keep-words",
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
  durationInFrames: 330,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
