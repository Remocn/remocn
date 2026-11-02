import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const theTabConfig: ComponentConfig = {
  componentName: "TheTab",
  importPath: "@/components/remocn/the-tab",
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
    price: {
      type: "text-content",
      default: "$0",
      description: "Price",
    },
    totalLabel: {
      type: "text-content",
      default: "Total",
      description: "Total label",
    },
    total: {
      type: "text-content",
      default: "one Sunday morning.",
      description: "Total",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
