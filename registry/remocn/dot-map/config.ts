import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dotMapConfig: ComponentConfig = {
  componentName: "DotMap",
  importPath: "@/components/remocn/dot-map",
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
      default: "countries",
      description: "Label",
    },
    count: {
      type: "number",
      default: 142,
      min: 0,
      max: 426,
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
