import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const diminuendoConfig: ComponentConfig = {
  componentName: "Diminuendo",
  importPath: "@/components/remocn/diminuendo",
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
      default: "#8ACE00",
      description: "Accent",
    },
    prefix: {
      type: "text-content",
      default: "",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "frames rendered from the registry last month",
      description: "Label",
    },
    separator: {
      type: "text-content",
      default: ",",
      description: "Separator",
    },
    value: {
      type: "number",
      default: 860000,
      min: 0,
      max: 2580000,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    ratio: {
      type: "number",
      default: 0.8,
      min: 0,
      max: 2.4,
      step: 0.01,
      description: "Ratio",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
