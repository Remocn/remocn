import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const packedCountConfig: ComponentConfig = {
  componentName: "PackedCount",
  importPath: "@/components/remocn/packed-count",
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
      default: "replays on a single launch clip",
      description: "Label",
    },
    value: {
      type: "number",
      default: 41900,
      min: 0,
      max: 125700,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 120,
      min: 0,
      max: 360,
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
