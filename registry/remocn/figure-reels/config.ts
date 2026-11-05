import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const figureReelsConfig: ComponentConfig = {
  componentName: "FigureReels",
  importPath: "@/components/remocn/figure-reels",
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
    prefix: {
      type: "text-content",
      default: "$",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "M",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "Announcing",
      description: "Label",
    },
    from: {
      type: "number",
      default: 396,
      min: 0,
      max: 1188,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    to: {
      type: "number",
      default: 400,
      min: 0,
      max: 1200,
      step: 1,
      description: "To",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
