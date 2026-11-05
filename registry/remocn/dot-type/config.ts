import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dotTypeConfig: ComponentConfig = {
  componentName: "DotType",
  importPath: "@/components/remocn/dot-type",
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
    accentLast: {
      type: "boolean",
      default: true,
      description: "Accent last",
    },
    count: {
      type: "number",
      default: 1500,
      min: 0,
      max: 4500,
      step: 1,
      description: "Count",
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
