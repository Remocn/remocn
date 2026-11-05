import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cardFanConfig: ComponentConfig = {
  componentName: "CardFan",
  importPath: "@/components/remocn/card-fan",
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
    title: {
      type: "text-content",
      default: "Your top formats",
      description: "Title",
    },
    caption: {
      type: "text-content",
      default: "Launch films are 41% of this month’s renders",
      description: "Caption",
    },
    accentWord: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent word",
      hiddenFromList: false,
    },
    pick: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Pick",
      hiddenFromList: false,
    },
  },
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
