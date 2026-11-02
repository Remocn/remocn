import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shedWeightConfig: ComponentConfig = {
  componentName: "ShedWeight",
  importPath: "@/components/remocn/shed-weight",
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
    text: {
      type: "text-content",
      default: "Sharp at any size.",
      description: "Text",
    },
    showSizes: {
      type: "boolean",
      default: true,
      description: "Show sizes",
    },
    sizes: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Sizes",
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
