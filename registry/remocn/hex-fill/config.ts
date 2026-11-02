import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hexFillConfig: ComponentConfig = {
  componentName: "HexFill",
  importPath: "@/components/remocn/hex-fill",
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
      default: "of renders served from cache",
      description: "Label",
    },
    value: {
      type: "number",
      default: 86,
      min: 0,
      max: 258,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    rings: {
      type: "number",
      default: 7,
      min: 0,
      max: 21,
      step: 1,
      description: "Rings",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
