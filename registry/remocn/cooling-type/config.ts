import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const coolingTypeConfig: ComponentConfig = {
  componentName: "CoolingType",
  importPath: "@/components/remocn/cooling-type",
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
      default: "What if your launch video could write itself?",
      description: "Text",
    },
    accentWord: {
      type: "text-content",
      default: "itself?",
      description: "Accent word",
    },
    charFrames: {
      type: "number",
      default: 1.6,
      min: 0,
      max: 4.8,
      step: 0.01,
      description: "Char frames",
      hiddenFromList: false,
    },
    coolFrames: {
      type: "number",
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Cool frames",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
