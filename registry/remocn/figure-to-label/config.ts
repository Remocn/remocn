import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const figureToLabelConfig: ComponentConfig = {
  componentName: "FigureToLabel",
  importPath: "@/components/remocn/figure-to-label",
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
    value: {
      type: "text-content",
      default: "$6.4B",
      description: "Value",
    },
    word: {
      type: "text-content",
      default: "valuation",
      description: "Word",
    },
    eyebrow: {
      type: "text-content",
      default: "",
      description: "Eyebrow",
    },
  },
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
