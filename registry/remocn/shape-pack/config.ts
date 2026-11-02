import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shapePackConfig: ComponentConfig = {
  componentName: "ShapePack",
  importPath: "@/components/remocn/shape-pack",
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
    suffix: {
      type: "text-content",
      default: "×",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "faster renders",
      description: "Label",
    },
    value: {
      type: "number",
      default: 3.2,
      min: 0,
      max: 9.6,
      step: 0.01,
      description: "Value",
      hiddenFromList: false,
    },
    decimals: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Decimals",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
