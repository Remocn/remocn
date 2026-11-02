import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const blockCityConfig: ComponentConfig = {
  componentName: "BlockCity",
  importPath: "@/components/remocn/block-city",
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
    prefix: {
      type: "text-content",
      default: "+",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "%",
      description: "Suffix",
    },
    caption: {
      type: "text-content",
      default: "renders",
      description: "Caption",
    },
    value: {
      type: "number",
      default: 340,
      min: 0,
      max: 1020,
      step: 1,
      description: "Value",
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
  durationInFrames: 250,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
