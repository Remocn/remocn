import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const columnReflowConfig: ComponentConfig = {
  componentName: "ColumnReflow",
  importPath: "@/components/remocn/column-reflow",
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
    accentWord: {
      type: "text-content",
      default: "room",
      description: "Accent word",
    },
    direction: {
      type: "enum",
      default: "widen",
      variants: {
        widen: {},
        narrow: {},
      },
      description: "Direction",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
