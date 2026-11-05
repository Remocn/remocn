import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tallCountConfig: ComponentConfig = {
  componentName: "TallCount",
  importPath: "@/components/remocn/tall-count",
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
    label: {
      type: "text-content",
      default: "more watch time on launch posts that move",
      description: "Label",
    },
    value: {
      type: "number",
      default: 240,
      min: 0,
      max: 720,
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
    decimals: {
      type: "number",
      default: 0,
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
