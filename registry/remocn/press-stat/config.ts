import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pressStatConfig: ComponentConfig = {
  componentName: "PressStat",
  importPath: "@/components/remocn/press-stat",
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
    before: {
      type: "text-content",
      default: "Edit time down",
      description: "Before",
    },
    prefix: {
      type: "text-content",
      default: "",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "%",
      description: "Suffix",
    },
    value: {
      type: "number",
      default: 73,
      min: 0,
      max: 219,
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
