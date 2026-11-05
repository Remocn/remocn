import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cellDivideConfig: ComponentConfig = {
  componentName: "CellDivide",
  importPath: "@/components/remocn/cell-divide",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    label: {
      type: "text-content",
      default: "×2 every week",
      description: "Label",
    },
    generations: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Generations",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
